import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Auth } from '@modules/auth/decorators';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  ProcessPaymentDto,
  WebhookPayloadDto,
  RefundPaymentDto,
} from './dto';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // =============================================
  // CUSTOMER ENDPOINTS
  // =============================================

  /**
   * Cria PaymentIntent para um pedido
   */
  @Post('payments/intents')
  @Auth(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(dto);
  }

  /**
   * Busca PaymentIntent por ID
   */
  @Get('payments/intents/:id')
  @Auth(UserRole.CUSTOMER, UserRole.MERCHANT, UserRole.ADMIN)
  async getPaymentIntent(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findPaymentIntent(id);
  }

  /**
   * Busca PaymentIntent por orderId
   */
  @Get('payments/orders/:orderId/intent')
  @Auth(UserRole.CUSTOMER, UserRole.MERCHANT, UserRole.ADMIN)
  async getPaymentIntentByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.findPaymentIntentByOrderId(orderId);
  }

  /**
   * Processa pagamento (simulado)
   * Em produção, isso seria feito pelo SDK do gateway
   */
  @Post('payments/process')
  @Auth(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  async processPayment(@Body() dto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(dto);
  }

  // =============================================
  // WEBHOOK (SIMULATED)
  // =============================================

  /**
   * Endpoint de webhook simulado
   * Em produção, seria chamado pelo gateway de pagamento
   * Não requer autenticação (validação via assinatura em produção)
   */
  @Post('payments/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: WebhookPayloadDto) {
    return this.paymentsService.handleWebhook(payload);
  }

  // =============================================
  // ADMIN ENDPOINTS
  // =============================================

  /**
   * Processa refund manualmente
   */
  @Post('admin/payments/refund')
  @Auth(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async refundPayment(@Body() dto: RefundPaymentDto) {
    return this.paymentsService.refundPayment(dto);
  }

  /**
   * Verifica se pedido pode ser confirmado
   */
  @Get('admin/payments/orders/:orderId/can-confirm')
  @Auth(UserRole.ADMIN, UserRole.MERCHANT)
  async canConfirmOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.canConfirmOrder(orderId);
  }
}
