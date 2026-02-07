import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  PaymentMethod,
  PaymentStatus,
  PaymentIntentStatus,
  OrderStatus,
} from '@prisma/client';
import { PrismaService } from '@shared/prisma';
import {
  CreatePaymentIntentDto,
  ProcessPaymentDto,
  WebhookPayloadDto,
  RefundPaymentDto,
} from './dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =============================================
  // PAYMENT INTENT
  // =============================================

  /**
   * Cria um PaymentIntent para um pedido
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    // Buscar pedido
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { paymentIntent: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se já existe PaymentIntent
    if (order.paymentIntent) {
      // Se já existe e não está cancelado/falhou, retornar o existente
      if (
        order.paymentIntent.status !== PaymentIntentStatus.CANCELLED &&
        order.paymentIntent.status !== PaymentIntentStatus.FAILED
      ) {
        return this.formatPaymentIntent(order.paymentIntent);
      }
    }

    // Calcular tempo de expiração (30 minutos)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Gerar ID externo simulado
    const externalId = this.generateExternalId();

    // Criar PaymentIntent
    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        orderId: dto.orderId,
        amount: order.total,
        currency: 'BRL',
        method: dto.method,
        status: PaymentIntentStatus.CREATED,
        externalId,
        expiresAt,
        metadata: {
          orderNumber: order.orderNumber,
          merchantId: order.merchantId,
        },
      },
    });

    this.logger.log(`PaymentIntent criado: ${paymentIntent.id} para pedido ${order.orderNumber}`);

    // Se for CASH, já marcar como SUCCEEDED
    if (dto.method === PaymentMethod.CASH) {
      return this.processPaymentSuccess(paymentIntent.id, {
        externalStatus: 'cash_payment',
      });
    }

    // Se for PIX, gerar QR Code simulado
    if (dto.method === PaymentMethod.PIX) {
      const pixData = this.generatePixData(paymentIntent.id, Number(order.total));
      await this.prisma.payment.create({
        data: {
          paymentIntentId: paymentIntent.id,
          amount: order.total,
          status: PaymentStatus.PENDING,
          pixKey: pixData.key,
          pixQrCode: pixData.qrCode,
        },
      });
    }

    return this.formatPaymentIntent(paymentIntent);
  }

  /**
   * Busca PaymentIntent por ID
   */
  async findPaymentIntent(id: string) {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!paymentIntent) {
      throw new NotFoundException('PaymentIntent não encontrado');
    }

    return this.formatPaymentIntent(paymentIntent);
  }

  /**
   * Busca PaymentIntent por orderId
   */
  async findPaymentIntentByOrderId(orderId: string) {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { orderId },
      include: { payments: true },
    });

    if (!paymentIntent) {
      throw new NotFoundException('PaymentIntent não encontrado para este pedido');
    }

    return this.formatPaymentIntent(paymentIntent);
  }

  // =============================================
  // PROCESS PAYMENT (STUB)
  // =============================================

  /**
   * Processa pagamento (simulado)
   * Em produção, isso seria feito via webhook do gateway
   */
  async processPayment(dto: ProcessPaymentDto) {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { id: dto.paymentIntentId },
      include: { order: true },
    });

    if (!paymentIntent) {
      throw new NotFoundException('PaymentIntent não encontrado');
    }

    if (paymentIntent.status !== PaymentIntentStatus.CREATED) {
      throw new BadRequestException(
        `PaymentIntent não está em estado processável: ${paymentIntent.status}`,
      );
    }

    // Verificar expiração
    if (paymentIntent.expiresAt && paymentIntent.expiresAt < new Date()) {
      await this.prisma.paymentIntent.update({
        where: { id: dto.paymentIntentId },
        data: { status: PaymentIntentStatus.CANCELLED },
      });
      throw new BadRequestException('PaymentIntent expirado');
    }

    // Simular processamento
    await this.prisma.paymentIntent.update({
      where: { id: dto.paymentIntentId },
      data: { status: PaymentIntentStatus.PROCESSING },
    });

    // Criar registro de Payment
    const payment = await this.prisma.payment.create({
      data: {
        paymentIntentId: dto.paymentIntentId,
        amount: paymentIntent.amount,
        status: PaymentStatus.PROCESSING,
        cardLast4: dto.cardLast4,
        cardBrand: dto.cardBrand,
        externalId: this.generateExternalId(),
      },
    });

    this.logger.log(`Payment criado: ${payment.id} para intent ${dto.paymentIntentId}`);

    // Simular sucesso (em produção, viria via webhook)
    // Aqui usamos 90% de chance de sucesso para simular
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      return this.processPaymentSuccess(dto.paymentIntentId);
    } else {
      return this.processPaymentFailure(dto.paymentIntentId, {
        code: 'card_declined',
        message: 'Cartão recusado pela operadora',
      });
    }
  }

  // =============================================
  // WEBHOOK (SIMULATED)
  // =============================================

  /**
   * Processa webhook simulado
   */
  async handleWebhook(payload: WebhookPayloadDto) {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { id: payload.paymentIntentId },
    });

    if (!paymentIntent) {
      throw new NotFoundException('PaymentIntent não encontrado');
    }

    this.logger.log(`Webhook recebido: ${payload.event} para ${payload.paymentIntentId}`);

    switch (payload.status) {
      case PaymentIntentStatus.SUCCEEDED:
        return this.processPaymentSuccess(payload.paymentIntentId, {
          externalId: payload.externalId,
        });

      case PaymentIntentStatus.FAILED:
        return this.processPaymentFailure(payload.paymentIntentId, {
          code: payload.failureCode,
          message: payload.failureMessage,
        });

      case PaymentIntentStatus.CANCELLED:
        return this.cancelPaymentIntent(payload.paymentIntentId);

      default:
        throw new BadRequestException(`Status inválido: ${payload.status}`);
    }
  }

  // =============================================
  // REFUND
  // =============================================

  /**
   * Processa refund (lógico)
   */
  async refundPayment(dto: RefundPaymentDto) {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { id: dto.paymentIntentId },
      include: { payments: true, order: true },
    });

    if (!paymentIntent) {
      throw new NotFoundException('PaymentIntent não encontrado');
    }

    if (paymentIntent.status !== PaymentIntentStatus.SUCCEEDED) {
      throw new BadRequestException('Apenas pagamentos bem-sucedidos podem ser reembolsados');
    }

    const payment = paymentIntent.payments.find((p) => p.status === PaymentStatus.COMPLETED);
    if (!payment) {
      throw new BadRequestException('Pagamento não encontrado');
    }

    const refundAmount = dto.amount ?? Number(payment.amount);

    // Atualizar Payment
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
        refundReason: dto.reason ?? 'Solicitado pelo sistema',
        refundAmount,
      },
    });

    // Atualizar Order
    await this.prisma.order.update({
      where: { id: paymentIntent.orderId },
      data: { paymentStatus: PaymentStatus.REFUNDED },
    });

    this.logger.log(
      `Refund processado: ${payment.id} - R$ ${refundAmount.toFixed(2)}`,
    );

    return {
      success: true,
      paymentId: payment.id,
      refundAmount,
      refundedAt: new Date(),
    };
  }

  // =============================================
  // INTERNAL HELPERS
  // =============================================

  /**
   * Processa sucesso do pagamento
   */
  private async processPaymentSuccess(
    paymentIntentId: string,
    options: { externalId?: string; externalStatus?: string } = {},
  ) {
    // Atualizar PaymentIntent
    const paymentIntent = await this.prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: {
        status: PaymentIntentStatus.SUCCEEDED,
        externalId: options.externalId,
        externalStatus: options.externalStatus ?? 'approved',
        processedAt: new Date(),
      },
      include: { order: true },
    });

    // Atualizar/Criar Payment
    const existingPayment = await this.prisma.payment.findFirst({
      where: { paymentIntentId },
    });

    if (existingPayment) {
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
      });
    } else {
      await this.prisma.payment.create({
        data: {
          paymentIntentId,
          amount: paymentIntent.amount,
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
      });
    }

    // Atualizar Order
    await this.prisma.order.update({
      where: { id: paymentIntent.orderId },
      data: { paymentStatus: PaymentStatus.COMPLETED },
    });

    this.logger.log(
      `Pagamento aprovado: ${paymentIntentId} para pedido ${paymentIntent.order.orderNumber}`,
    );

    return this.formatPaymentIntent(paymentIntent);
  }

  /**
   * Processa falha do pagamento
   */
  private async processPaymentFailure(
    paymentIntentId: string,
    failure: { code?: string; message?: string },
  ) {
    // Atualizar PaymentIntent
    const paymentIntent = await this.prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: {
        status: PaymentIntentStatus.FAILED,
        externalStatus: 'rejected',
        processedAt: new Date(),
      },
    });

    // Atualizar Payment
    const existingPayment = await this.prisma.payment.findFirst({
      where: { paymentIntentId },
    });

    if (existingPayment) {
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureCode: failure.code,
          failureMessage: failure.message,
        },
      });
    }

    // Atualizar Order
    await this.prisma.order.update({
      where: { id: paymentIntent.orderId },
      data: { paymentStatus: PaymentStatus.FAILED },
    });

    this.logger.warn(`Pagamento falhou: ${paymentIntentId} - ${failure.code}: ${failure.message}`);

    return this.formatPaymentIntent(paymentIntent);
  }

  /**
   * Cancela PaymentIntent
   */
  private async cancelPaymentIntent(paymentIntentId: string) {
    const paymentIntent = await this.prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: {
        status: PaymentIntentStatus.CANCELLED,
        processedAt: new Date(),
      },
    });

    this.logger.log(`PaymentIntent cancelado: ${paymentIntentId}`);

    return this.formatPaymentIntent(paymentIntent);
  }

  /**
   * Verifica se pedido pode ser confirmado baseado no pagamento
   */
  async canConfirmOrder(orderId: string): Promise<{
    canConfirm: boolean;
    reason?: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { paymentIntent: true },
    });

    if (!order) {
      return { canConfirm: false, reason: 'Pedido não encontrado' };
    }

    // CASH sempre pode confirmar
    if (order.paymentMethod === PaymentMethod.CASH) {
      return { canConfirm: true };
    }

    // Verificar PaymentIntent
    if (!order.paymentIntent) {
      return { canConfirm: false, reason: 'Pagamento não iniciado' };
    }

    if (order.paymentIntent.status === PaymentIntentStatus.SUCCEEDED) {
      return { canConfirm: true };
    }

    if (order.paymentIntent.status === PaymentIntentStatus.FAILED) {
      return { canConfirm: false, reason: 'Pagamento falhou' };
    }

    if (order.paymentIntent.status === PaymentIntentStatus.CANCELLED) {
      return { canConfirm: false, reason: 'Pagamento cancelado' };
    }

    return { canConfirm: false, reason: 'Pagamento pendente' };
  }

  // =============================================
  // UTILITIES
  // =============================================

  private generateExternalId(): string {
    return `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private generatePixData(paymentIntentId: string, amount: number) {
    // Simula dados PIX
    return {
      key: `pix_${paymentIntentId}`,
      qrCode: `00020126580014br.gov.bcb.pix0136${paymentIntentId}5204000053039865802BR5913DELIVERY_APP6008SAOPAULO62070503***6304${amount.toFixed(2)}`,
    };
  }

  private formatPaymentIntent(paymentIntent: any) {
    const payment = paymentIntent.payments?.[0];

    return {
      id: paymentIntent.id,
      orderId: paymentIntent.orderId,
      amount: Number(paymentIntent.amount),
      currency: paymentIntent.currency,
      method: paymentIntent.method,
      status: paymentIntent.status,
      externalId: paymentIntent.externalId,
      expiresAt: paymentIntent.expiresAt,
      createdAt: paymentIntent.createdAt,
      pixQrCode: payment?.pixQrCode,
      pixKey: payment?.pixKey,
    };
  }
}
