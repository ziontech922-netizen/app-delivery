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
} from '@prisma/client';
import { PrismaService } from '@shared/prisma';
import { MercadoPagoService } from './mercadopago.service';
import {
  CreatePaymentIntentDto,
  ProcessCardPaymentDto,
  RefundPaymentDto,
} from './dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPago: MercadoPagoService,
  ) {}

  // =============================================
  // CREATE PAYMENT
  // =============================================

  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        paymentIntent: true,
        customer: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    if (!order) throw new NotFoundException('Pedido não encontrado');

    // Retornar existente se ainda válido
    if (order.paymentIntent) {
      if (
        order.paymentIntent.status !== PaymentIntentStatus.CANCELLED &&
        order.paymentIntent.status !== PaymentIntentStatus.FAILED
      ) {
        const existing = await this.prisma.paymentIntent.findUnique({
          where: { id: order.paymentIntent.id },
          include: { payments: true },
        });
        return this.formatPaymentIntent(existing!);
      }
    }

    // CASH: marcar como sucesso imediatamente
    if (dto.method === PaymentMethod.CASH) {
      const pi = await this.prisma.paymentIntent.create({
        data: {
          orderId: dto.orderId,
          amount: order.total,
          currency: 'BRL',
          method: PaymentMethod.CASH,
          status: PaymentIntentStatus.SUCCEEDED,
          externalStatus: 'cash_payment',
          processedAt: new Date(),
          metadata: { orderNumber: order.orderNumber },
        },
      });

      await this.prisma.payment.create({
        data: {
          paymentIntentId: pi.id,
          amount: order.total,
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
      });

      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.COMPLETED },
      });

      this.logger.log(`Pagamento em dinheiro confirmado para pedido ${order.orderNumber}`);
      return this.formatPaymentIntent(pi);
    }

    // PIX: criar pagamento no Mercado Pago
    if (dto.method === PaymentMethod.PIX) {
      const idempotencyKey = `pix-${order.id}-${Date.now()}`;
      const mpResult = await this.mercadoPago.createPixPayment({
        amount: Number(order.total),
        description: `Pedido ${order.orderNumber}`,
        email: order.customer.email,
        firstName: order.customer.firstName,
        lastName: order.customer.lastName,
        idempotencyKey,
      });

      const pi = await this.prisma.paymentIntent.create({
        data: {
          orderId: dto.orderId,
          amount: order.total,
          currency: 'BRL',
          method: PaymentMethod.PIX,
          status: PaymentIntentStatus.CREATED,
          externalId: String(mpResult.id),
          externalStatus: mpResult.status,
          expiresAt: new Date(mpResult.expiresAt),
          metadata: { orderNumber: order.orderNumber, merchantId: order.merchantId },
        },
      });

      await this.prisma.payment.create({
        data: {
          paymentIntentId: pi.id,
          amount: order.total,
          status: PaymentStatus.PENDING,
          externalId: String(mpResult.id),
          pixKey: mpResult.qrCode,
          pixQrCode: mpResult.qrCodeBase64 || mpResult.qrCode,
        },
      });

      this.logger.log(`PIX criado: MP#${mpResult.id} para pedido ${order.orderNumber}`);

      return {
        ...this.formatPaymentIntent(pi),
        pixQrCode: mpResult.qrCode,
        pixQrCodeBase64: mpResult.qrCodeBase64,
        pixTicketUrl: mpResult.ticketUrl,
      };
    }

    // CREDIT_CARD / DEBIT_CARD: criar PaymentIntent aguardando token
    const pi = await this.prisma.paymentIntent.create({
      data: {
        orderId: dto.orderId,
        amount: order.total,
        currency: 'BRL',
        method: dto.method,
        status: PaymentIntentStatus.CREATED,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        metadata: { orderNumber: order.orderNumber, merchantId: order.merchantId },
      },
    });

    this.logger.log(`PaymentIntent (cartão) criado: ${pi.id} para pedido ${order.orderNumber}`);
    return this.formatPaymentIntent(pi);
  }

  // =============================================
  // PROCESS CARD PAYMENT
  // =============================================

  async processCardPayment(dto: ProcessCardPaymentDto) {
    const pi = await this.prisma.paymentIntent.findUnique({
      where: { id: dto.paymentIntentId },
      include: {
        order: {
          include: { customer: { select: { email: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!pi) throw new NotFoundException('PaymentIntent não encontrado');

    if (pi.status !== PaymentIntentStatus.CREATED) {
      throw new BadRequestException(`PaymentIntent não está em estado processável: ${pi.status}`);
    }

    if (pi.expiresAt && pi.expiresAt < new Date()) {
      await this.prisma.paymentIntent.update({
        where: { id: pi.id },
        data: { status: PaymentIntentStatus.CANCELLED },
      });
      throw new BadRequestException('PaymentIntent expirado');
    }

    // Atualizar para PROCESSING
    await this.prisma.paymentIntent.update({
      where: { id: pi.id },
      data: { status: PaymentIntentStatus.PROCESSING },
    });

    // Processar no Mercado Pago
    const mpResult = await this.mercadoPago.createCardPayment({
      amount: Number(pi.amount),
      token: dto.token,
      description: `Pedido ${pi.order.orderNumber}`,
      installments: dto.installments || 1,
      email: pi.order.customer.email,
      firstName: pi.order.customer.firstName,
      lastName: pi.order.customer.lastName,
      idempotencyKey: `card-${pi.id}-${Date.now()}`,
    });

    // Criar registro Payment
    await this.prisma.payment.create({
      data: {
        paymentIntentId: pi.id,
        amount: pi.amount,
        status: mpResult.status === 'approved' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
        externalId: String(mpResult.id),
        externalStatus: mpResult.statusDetail,
        cardLast4: mpResult.cardLast4,
        cardBrand: mpResult.cardBrand,
        paidAt: mpResult.status === 'approved' ? new Date() : undefined,
        failureCode: mpResult.status !== 'approved' ? mpResult.statusDetail : undefined,
        failureMessage: mpResult.status !== 'approved' ? this.getCardErrorMessage(mpResult.statusDetail) : undefined,
      },
    });

    if (mpResult.status === 'approved') {
      return this.processPaymentSuccess(pi.id, {
        externalId: String(mpResult.id),
        externalStatus: mpResult.statusDetail,
      });
    } else {
      return this.processPaymentFailure(pi.id, {
        code: mpResult.statusDetail,
        message: this.getCardErrorMessage(mpResult.statusDetail),
      });
    }
  }

  // =============================================
  // MERCADO PAGO WEBHOOK
  // =============================================

  async handleMercadoPagoWebhook(params: {
    type: string;
    dataId: string;
    xSignature?: string;
    xRequestId?: string;
  }) {
    this.logger.log(`Webhook Mercado Pago recebido: type=${params.type}, data.id=${params.dataId}`);

    // Validar assinatura se disponível
    if (params.xSignature && params.xRequestId) {
      const isValid = this.mercadoPago.validateWebhookSignature({
        xSignature: params.xSignature,
        xRequestId: params.xRequestId,
        dataId: params.dataId,
      });
      if (!isValid) {
        this.logger.warn('Webhook com assinatura inválida - rejeitando');
        throw new BadRequestException('Assinatura do webhook inválida');
      }
    }

    // Apenas processar notificações de pagamento
    if (params.type !== 'payment') {
      this.logger.log(`Webhook ignorado: tipo ${params.type}`);
      return { received: true };
    }

    // Buscar pagamento no Mercado Pago
    const mpPaymentId = parseInt(params.dataId, 10);
    const mpPayment = await this.mercadoPago.getPayment(mpPaymentId);

    // Encontrar PaymentIntent pelo externalId
    const pi = await this.prisma.paymentIntent.findFirst({
      where: { externalId: String(mpPaymentId) },
    });

    if (!pi) {
      // Pode ser um pagamento que não é nosso - ignorar
      this.logger.warn(`Webhook: PaymentIntent não encontrado para MP#${mpPaymentId}`);
      return { received: true };
    }

    // Já processado?
    if (pi.status === PaymentIntentStatus.SUCCEEDED || pi.status === PaymentIntentStatus.FAILED) {
      this.logger.log(`Webhook: PaymentIntent ${pi.id} já está em status final ${pi.status}`);
      return { received: true };
    }

    const mpStatus = (mpPayment as any).status as string;

    switch (mpStatus) {
      case 'approved':
        await this.processPaymentSuccess(pi.id, {
          externalId: String(mpPaymentId),
          externalStatus: (mpPayment as any).status_detail,
        });
        break;

      case 'rejected':
        await this.processPaymentFailure(pi.id, {
          code: (mpPayment as any).status_detail,
          message: this.getCardErrorMessage((mpPayment as any).status_detail),
        });
        break;

      case 'cancelled':
        await this.cancelPaymentIntent(pi.id);
        break;

      case 'in_process':
      case 'pending':
        this.logger.log(`Webhook: pagamento ${mpPaymentId} ainda pendente (${mpStatus})`);
        break;

      default:
        this.logger.warn(`Webhook: status desconhecido ${mpStatus}`);
    }

    return { received: true };
  }

  // =============================================
  // QUERIES
  // =============================================

  async findPaymentIntent(id: string) {
    const pi = await this.prisma.paymentIntent.findUnique({
      where: { id },
      include: { payments: true },
    });
    if (!pi) throw new NotFoundException('PaymentIntent não encontrado');
    return this.formatPaymentIntent(pi);
  }

  async findPaymentIntentByOrderId(orderId: string) {
    const pi = await this.prisma.paymentIntent.findUnique({
      where: { orderId },
      include: { payments: true },
    });
    if (!pi) throw new NotFoundException('PaymentIntent não encontrado para este pedido');
    return this.formatPaymentIntent(pi);
  }

  // =============================================
  // REFUND
  // =============================================

  async refundPayment(dto: RefundPaymentDto) {
    const pi = await this.prisma.paymentIntent.findUnique({
      where: { id: dto.paymentIntentId },
      include: { payments: true, order: true },
    });

    if (!pi) throw new NotFoundException('PaymentIntent não encontrado');
    if (pi.status !== PaymentIntentStatus.SUCCEEDED) {
      throw new BadRequestException('Apenas pagamentos bem-sucedidos podem ser reembolsados');
    }

    const payment = pi.payments.find((p) => p.status === PaymentStatus.COMPLETED);
    if (!payment) throw new BadRequestException('Pagamento não encontrado');

    const refundAmount = dto.amount ?? Number(payment.amount);

    // Reembolsar no Mercado Pago se tiver externalId
    if (payment.externalId) {
      try {
        await this.mercadoPago.refundPayment(parseInt(payment.externalId, 10), refundAmount);
      } catch (error) {
        this.logger.error(`Erro ao reembolsar no Mercado Pago: ${error}`);
      }
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
        refundReason: dto.reason ?? 'Solicitado pelo sistema',
        refundAmount,
      },
    });

    await this.prisma.order.update({
      where: { id: pi.orderId },
      data: { paymentStatus: PaymentStatus.REFUNDED },
    });

    this.logger.log(`Refund processado: ${payment.id} - R$ ${refundAmount.toFixed(2)}`);

    return { success: true, paymentId: payment.id, refundAmount, refundedAt: new Date() };
  }

  // =============================================
  // CONFIRM ORDER CHECK
  // =============================================

  async canConfirmOrder(orderId: string): Promise<{ canConfirm: boolean; reason?: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { paymentIntent: true },
    });

    if (!order) return { canConfirm: false, reason: 'Pedido não encontrado' };
    if (order.paymentMethod === PaymentMethod.CASH) return { canConfirm: true };
    if (!order.paymentIntent) return { canConfirm: false, reason: 'Pagamento não iniciado' };
    if (order.paymentIntent.status === PaymentIntentStatus.SUCCEEDED) return { canConfirm: true };
    if (order.paymentIntent.status === PaymentIntentStatus.FAILED) return { canConfirm: false, reason: 'Pagamento falhou' };
    if (order.paymentIntent.status === PaymentIntentStatus.CANCELLED) return { canConfirm: false, reason: 'Pagamento cancelado' };
    return { canConfirm: false, reason: 'Pagamento pendente' };
  }

  // =============================================
  // INTERNAL HELPERS
  // =============================================

  private async processPaymentSuccess(
    paymentIntentId: string,
    options: { externalId?: string; externalStatus?: string } = {},
  ) {
    const pi = await this.prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: {
        status: PaymentIntentStatus.SUCCEEDED,
        externalId: options.externalId,
        externalStatus: options.externalStatus ?? 'approved',
        processedAt: new Date(),
      },
      include: { order: true },
    });

    const existingPayment = await this.prisma.payment.findFirst({ where: { paymentIntentId } });
    if (existingPayment) {
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status: PaymentStatus.COMPLETED, paidAt: new Date() },
      });
    } else {
      await this.prisma.payment.create({
        data: { paymentIntentId, amount: pi.amount, status: PaymentStatus.COMPLETED, paidAt: new Date() },
      });
    }

    await this.prisma.order.update({
      where: { id: pi.orderId },
      data: { paymentStatus: PaymentStatus.COMPLETED },
    });

    this.logger.log(`Pagamento aprovado: ${paymentIntentId} para pedido ${pi.order.orderNumber}`);
    return this.formatPaymentIntent(pi);
  }

  private async processPaymentFailure(
    paymentIntentId: string,
    failure: { code?: string; message?: string },
  ) {
    const pi = await this.prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: { status: PaymentIntentStatus.FAILED, externalStatus: 'rejected', processedAt: new Date() },
    });

    const existingPayment = await this.prisma.payment.findFirst({ where: { paymentIntentId } });
    if (existingPayment) {
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status: PaymentStatus.FAILED, failureCode: failure.code, failureMessage: failure.message },
      });
    }

    await this.prisma.order.update({
      where: { id: pi.orderId },
      data: { paymentStatus: PaymentStatus.FAILED },
    });

    this.logger.warn(`Pagamento falhou: ${paymentIntentId} - ${failure.code}: ${failure.message}`);
    return this.formatPaymentIntent(pi);
  }

  private async cancelPaymentIntent(paymentIntentId: string) {
    const pi = await this.prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: { status: PaymentIntentStatus.CANCELLED, processedAt: new Date() },
    });
    return this.formatPaymentIntent(pi);
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
      pixQrCodeBase64: payment?.pixQrCode,
      pixKey: payment?.pixKey,
      cardLast4: payment?.cardLast4,
      cardBrand: payment?.cardBrand,
      failureCode: payment?.failureCode,
      failureMessage: payment?.failureMessage,
    };
  }

  private getCardErrorMessage(statusDetail: string): string {
    const messages: Record<string, string> = {
      accredited: 'Pagamento aprovado',
      pending_contingency: 'Pagamento em análise',
      pending_review_manual: 'Pagamento em revisão manual',
      cc_rejected_bad_filled_card_number: 'Número do cartão incorreto',
      cc_rejected_bad_filled_date: 'Data de validade incorreta',
      cc_rejected_bad_filled_other: 'Dados do cartão incorretos',
      cc_rejected_bad_filled_security_code: 'Código de segurança incorreto',
      cc_rejected_blacklist: 'Cartão não autorizado',
      cc_rejected_call_for_authorize: 'Ligue para sua operadora para autorizar',
      cc_rejected_card_disabled: 'Cartão desabilitado, ligue para sua operadora',
      cc_rejected_duplicated_payment: 'Pagamento duplicado, tente novamente mais tarde',
      cc_rejected_high_risk: 'Transação recusada por risco elevado',
      cc_rejected_insufficient_amount: 'Saldo insuficiente',
      cc_rejected_invalid_installments: 'Parcelas inválidas',
      cc_rejected_max_attempts: 'Número máximo de tentativas atingido',
      cc_rejected_other_reason: 'Cartão recusado pela operadora',
    };
    return messages[statusDetail] ?? 'Pagamento recusado';
  }
}
