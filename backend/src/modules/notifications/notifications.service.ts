import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '@shared/prisma/prisma.service';
import {
  PushNotificationDto,
  PushNotificationBatchDto,
  EmailNotificationDto,
  NotificationEvent,
  NotificationResponseDto,
  BatchNotificationResponseDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseInitialized = false;
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.initializeFirebase();
    await this.initializeEmail();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private async initializeFirebase(): Promise<void> {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase not configured - push notifications disabled');
      return;
    }

    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }
      this.firebaseInitialized = true;
      this.logger.log('Firebase Admin SDK initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error);
    }
  }

  /**
   * Initialize Nodemailer transporter
   */
  private async initializeEmail(): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured - email notifications disabled');
      return;
    }

    try {
      this.emailTransporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465,
        auth: { user, pass },
      });

      // Verify connection
      await this.emailTransporter.verify();
      this.logger.log('Email transporter initialized');
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
      this.emailTransporter = null;
    }
  }

  /**
   * Send a push notification to a single device
   */
  async sendPushNotification(
    dto: PushNotificationDto,
  ): Promise<NotificationResponseDto> {
    if (!this.firebaseInitialized) {
      return { success: false, error: 'Push notifications not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        token: dto.token,
        notification: {
          title: dto.title,
          body: dto.body,
          imageUrl: dto.imageUrl,
        },
        data: dto.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent: ${response}`);

      return { success: true, messageId: response };
    } catch (error: any) {
      this.logger.error(`Failed to send push notification:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notifications to multiple devices
   */
  async sendPushNotificationBatch(
    dto: PushNotificationBatchDto,
  ): Promise<BatchNotificationResponseDto> {
    if (!this.firebaseInitialized) {
      return {
        successCount: 0,
        failureCount: dto.tokens.length,
        failedTokens: dto.tokens,
      };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: dto.tokens,
        notification: {
          title: dto.title,
          body: dto.body,
        },
        data: dto.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      const failedTokens = response.responses
        .map((resp, idx) => (!resp.success ? dto.tokens[idx] : null))
        .filter(Boolean) as string[];

      this.logger.log(
        `Batch push: ${response.successCount} success, ${response.failureCount} failed`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      };
    } catch (error: any) {
      this.logger.error('Failed to send batch push notifications:', error);
      return {
        successCount: 0,
        failureCount: dto.tokens.length,
        failedTokens: dto.tokens,
      };
    }
  }

  /**
   * Send an email notification
   */
  async sendEmail(dto: EmailNotificationDto): Promise<NotificationResponseDto> {
    if (!this.emailTransporter) {
      return { success: false, error: 'Email not configured' };
    }

    try {
      const fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@delivery.app';
      const fromName = this.configService.get<string>('APP_NAME') || 'Delivery App';

      const info = await this.emailTransporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: dto.to,
        subject: dto.subject,
        html: dto.html,
        text: dto.text,
      });

      this.logger.log(`Email sent to ${dto.to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${dto.to}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify customer about order status change
   */
  async notifyOrderStatusChange(
    orderId: string,
    event: NotificationEvent,
    customMessage?: string,
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        merchant: true,
      },
    });

    if (!order) {
      this.logger.warn(`Order ${orderId} not found for notification`);
      return;
    }

    const { title, body } = this.getOrderNotificationContent(
      event,
      order.merchant?.businessName || 'Estabelecimento',
      order.orderNumber,
      customMessage,
    );

    // TODO: Get FCM token from user preferences/device table
    // For now, just log the notification
    this.logger.log(`Would notify customer ${order.customerId}: ${title} - ${body}`);

    // Send email if configured
    if (order.customer.email) {
      await this.sendEmail({
        to: order.customer.email,
        subject: title,
        html: this.getOrderEmailTemplate(title, body, order.orderNumber),
      });
    }
  }

  /**
   * Notify merchant about new order
   */
  async notifyMerchantNewOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!order || !order.merchant) {
      this.logger.warn(`Order ${orderId} or merchant not found`);
      return;
    }

    const title = '🔔 Novo Pedido!';
    const body = `Pedido #${order.orderNumber} recebido - R$ ${order.total.toFixed(2)}`;

    this.logger.log(`Would notify merchant ${order.merchantId}: ${title}`);

    // Send email to merchant
    if (order.merchant.user.email) {
      await this.sendEmail({
        to: order.merchant.user.email,
        subject: title,
        html: this.getMerchantOrderEmailTemplate(order),
      });
    }
  }

  /**
   * Notify available drivers about order ready for pickup
   */
  async notifyDriversOrderAvailable(
    orderId: string,
    driverIds: string[],
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { merchant: true },
    });

    if (!order) {
      this.logger.warn(`Order ${orderId} not found`);
      return;
    }

    const title = '🚗 Entrega Disponível';
    const body = `Pedido #${order.orderNumber} pronto para retirada em ${order.merchant?.businessName}`;

    this.logger.log(`Would notify ${driverIds.length} drivers: ${title}`);

    // TODO: Get FCM tokens for drivers and send batch notification
    // For now, log it
  }

  /**
   * Notify driver assignment
   */
  async notifyDriverAssigned(orderId: string, driverId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { merchant: true },
    });

    if (!order) return;

    const title = '✅ Entrega Aceita';
    const body = `Pedido #${order.orderNumber} - Retire em ${order.merchant?.businessName}`;

    this.logger.log(`Would notify driver ${driverId}: ${title}`);
  }

  /**
   * Get notification content based on event
   */
  private getOrderNotificationContent(
    event: NotificationEvent,
    merchantName: string,
    orderNumber: string,
    customMessage?: string,
  ): { title: string; body: string } {
    const messages: Record<NotificationEvent, { title: string; body: string }> = {
      [NotificationEvent.ORDER_CONFIRMED]: {
        title: '✅ Pedido Confirmado',
        body: `Seu pedido #${orderNumber} foi confirmado por ${merchantName}`,
      },
      [NotificationEvent.ORDER_PREPARING]: {
        title: '👨‍🍳 Preparando seu Pedido',
        body: `${merchantName} está preparando seu pedido #${orderNumber}`,
      },
      [NotificationEvent.ORDER_READY]: {
        title: '📦 Pedido Pronto',
        body: `Seu pedido #${orderNumber} está pronto e aguardando retirada`,
      },
      [NotificationEvent.DRIVER_ACCEPTED]: {
        title: '🚗 Entregador a Caminho',
        body: `Um entregador está indo buscar seu pedido #${orderNumber}`,
      },
      [NotificationEvent.DRIVER_ARRIVING]: {
        title: '📍 Entregador Chegando',
        body: `O entregador está chegando com seu pedido #${orderNumber}`,
      },
      [NotificationEvent.ORDER_DELIVERED]: {
        title: '🎉 Pedido Entregue',
        body: `Seu pedido #${orderNumber} foi entregue. Bom apetite!`,
      },
      [NotificationEvent.ORDER_CANCELLED]: {
        title: '❌ Pedido Cancelado',
        body: customMessage || `Seu pedido #${orderNumber} foi cancelado`,
      },
      [NotificationEvent.NEW_ORDER]: {
        title: '🔔 Novo Pedido',
        body: `Novo pedido #${orderNumber} recebido`,
      },
      [NotificationEvent.ORDER_AVAILABLE]: {
        title: '🚗 Entrega Disponível',
        body: `Pedido #${orderNumber} disponível para retirada`,
      },
      [NotificationEvent.PAYMENT_RECEIVED]: {
        title: '💳 Pagamento Confirmado',
        body: `Pagamento do pedido #${orderNumber} foi confirmado`,
      },
      [NotificationEvent.PAYMENT_FAILED]: {
        title: '⚠️ Falha no Pagamento',
        body: `Houve um problema com o pagamento do pedido #${orderNumber}`,
      },
    };

    return messages[event] || { title: 'Notificação', body: customMessage || '' };
  }

  /**
   * Generate order status email template
   */
  private getOrderEmailTemplate(
    title: string,
    body: string,
    orderNumber: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-number { font-size: 14px; color: #6b7280; }
          h1 { margin: 0; font-size: 24px; }
          p { margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
            <p class="order-number">Pedido #${orderNumber}</p>
          </div>
          <div class="content">
            <p>${body}</p>
            <p>Acompanhe seu pedido pelo aplicativo para mais detalhes.</p>
          </div>
          <div class="footer">
            <p>Delivery App - Seu marketplace de delivery</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate merchant new order email template
   */
  private getMerchantOrderEmailTemplate(order: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          h1 { margin: 0; font-size: 24px; }
          .total { font-size: 24px; font-weight: bold; color: #22c55e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Novo Pedido!</h1>
          </div>
          <div class="content">
            <div class="order-info">
              <p><strong>Pedido:</strong> #${order.orderNumber}</p>
              <p><strong>Total:</strong> <span class="total">R$ ${order.total.toFixed(2)}</span></p>
              <p><strong>Método:</strong> ${order.paymentMethod}</p>
            </div>
            <p>Acesse o painel para visualizar os detalhes do pedido.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
