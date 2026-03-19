import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

export interface MpPixPaymentResult {
  id: number;
  status: string;
  statusDetail: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  expiresAt: string;
}

export interface MpCardPaymentResult {
  id: number;
  status: string;
  statusDetail: string;
  cardLast4: string;
  cardBrand: string;
}

export interface MpRefundResult {
  id: number;
  status: string;
  amount: number;
}

@Injectable()
export class MercadoPagoService implements OnModuleInit {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client!: MercadoPagoConfig;
  private paymentClient!: Payment;
  private isConfigured = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const accessToken = this.config.get<string>('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      this.logger.warn('MERCADO_PAGO_ACCESS_TOKEN não configurado - pagamentos em modo simulado');
      return;
    }

    this.client = new MercadoPagoConfig({ accessToken });
    this.paymentClient = new Payment(this.client);
    this.isConfigured = true;
    this.logger.log('Mercado Pago configurado com sucesso');
  }

  getIsConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Cria pagamento PIX no Mercado Pago
   */
  async createPixPayment(params: {
    amount: number;
    description: string;
    email: string;
    firstName: string;
    lastName: string;
    idempotencyKey: string;
  }): Promise<MpPixPaymentResult> {
    if (!this.isConfigured) {
      return this.simulatePixPayment(params);
    }

    const response = await this.paymentClient.create({
      body: {
        transaction_amount: params.amount,
        description: params.description,
        payment_method_id: 'pix',
        payer: {
          email: params.email,
          first_name: params.firstName,
          last_name: params.lastName,
        },
      },
      requestOptions: {
        idempotencyKey: params.idempotencyKey,
      },
    });

    const txData = response.point_of_interaction?.transaction_data;

    return {
      id: response.id!,
      status: response.status!,
      statusDetail: response.status_detail!,
      qrCode: txData?.qr_code ?? '',
      qrCodeBase64: txData?.qr_code_base64 ?? '',
      ticketUrl: txData?.ticket_url ?? '',
      expiresAt: response.date_of_expiration ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Cria pagamento com cartão no Mercado Pago
   */
  async createCardPayment(params: {
    amount: number;
    token: string;
    description: string;
    installments: number;
    email: string;
    firstName: string;
    lastName: string;
    idempotencyKey: string;
  }): Promise<MpCardPaymentResult> {
    if (!this.isConfigured) {
      return this.simulateCardPayment(params);
    }

    const response = await this.paymentClient.create({
      body: {
        transaction_amount: params.amount,
        token: params.token,
        description: params.description,
        installments: params.installments,
        payment_method_id: '', // auto-detect from token
        payer: {
          email: params.email,
          first_name: params.firstName,
          last_name: params.lastName,
        },
      },
      requestOptions: {
        idempotencyKey: params.idempotencyKey,
      },
    });

    return {
      id: response.id!,
      status: response.status!,
      statusDetail: response.status_detail!,
      cardLast4: response.card?.last_four_digits ?? '',
      cardBrand: response.payment_method_id ?? '',
    };
  }

  /**
   * Consulta pagamento no Mercado Pago
   */
  async getPayment(paymentId: number) {
    if (!this.isConfigured) {
      return { id: paymentId, status: 'approved', status_detail: 'accredited' };
    }
    return this.paymentClient.get({ id: paymentId });
  }

  /**
   * Reembolsa pagamento no Mercado Pago
   */
  async refundPayment(paymentId: number, amount?: number): Promise<MpRefundResult> {
    if (!this.isConfigured) {
      return { id: paymentId, status: 'approved', amount: amount ?? 0 };
    }

    // Mercado Pago SDK v2 refund via Payment
    const response = await (this.paymentClient as any).refund({
      id: paymentId,
      body: amount ? { amount } : undefined,
    });

    return {
      id: response.id!,
      status: response.status!,
      amount: Number(response.amount ?? amount),
    };
  }

  /**
   * Valida assinatura do webhook do Mercado Pago
   */
  validateWebhookSignature(params: {
    xSignature: string;
    xRequestId: string;
    dataId: string;
  }): boolean {
    const webhookSecret = this.config.get<string>('MERCADO_PAGO_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.warn('MERCADO_PAGO_WEBHOOK_SECRET não configurado - aceitando webhook sem validação');
      return true;
    }

    // Mercado Pago v2 signature validation
    const crypto = require('crypto');
    const parts = params.xSignature.split(',');
    let ts = '';
    let hash = '';
    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    const manifest = `id:${params.dataId};request-id:${params.xRequestId};ts:${ts};`;
    const expectedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(manifest)
      .digest('hex');

    return expectedHash === hash;
  }

  // --- Simulação para modo sem configuração ---

  private simulatePixPayment(params: { amount: number; idempotencyKey: string }): MpPixPaymentResult {
    this.logger.warn('Modo simulado: gerando PIX fake');
    const fakeId = Math.floor(Math.random() * 1_000_000_000);
    return {
      id: fakeId,
      status: 'pending',
      statusDetail: 'pending_waiting_transfer',
      qrCode: `00020126580014br.gov.bcb.pix0136sim-${params.idempotencyKey}520400005303986540${params.amount.toFixed(2)}5802BR5913DELIVERY_APP6008SAOPAULO`,
      qrCodeBase64: '',
      ticketUrl: '',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  private simulateCardPayment(params: { amount: number; token: string }): MpCardPaymentResult {
    this.logger.warn('Modo simulado: processando cartão fake');
    const fakeId = Math.floor(Math.random() * 1_000_000_000);
    const isSuccess = Math.random() > 0.1;
    return {
      id: fakeId,
      status: isSuccess ? 'approved' : 'rejected',
      statusDetail: isSuccess ? 'accredited' : 'cc_rejected_other_reason',
      cardLast4: params.token.slice(-4) || '4242',
      cardBrand: 'visa',
    };
  }
}
