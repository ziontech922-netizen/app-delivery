import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Auth } from '@modules/auth/decorators';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  ProcessCardPaymentDto,
  RefundPaymentDto,
} from './dto';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // =============================================
  // CUSTOMER ENDPOINTS
  // =============================================

  @Post('payments/intents')
  @Auth(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(dto);
  }

  @Get('payments/intents/:id')
  @Auth(UserRole.CUSTOMER, UserRole.MERCHANT, UserRole.ADMIN)
  async getPaymentIntent(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findPaymentIntent(id);
  }

  @Get('payments/orders/:orderId/intent')
  @Auth(UserRole.CUSTOMER, UserRole.MERCHANT, UserRole.ADMIN)
  async getPaymentIntentByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.findPaymentIntentByOrderId(orderId);
  }

  /**
   * Processa pagamento com cartão (token gerado pelo MercadoPago.js)
   */
  @Post('payments/process-card')
  @Auth(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  async processCardPayment(@Body() dto: ProcessCardPaymentDto) {
    return this.paymentsService.processCardPayment(dto);
  }

  // =============================================
  // MERCADO PAGO WEBHOOK
  // =============================================

  /**
   * Webhook do Mercado Pago
   * Não requer autenticação (validação via assinatura)
   */
  @Post('payments/webhook/mercadopago')
  @HttpCode(HttpStatus.OK)
  async handleMercadoPagoWebhook(
    @Query('type') type: string,
    @Query('data.id') dataId: string,
    @Body() body: any,
    @Headers('x-signature') xSignature?: string,
    @Headers('x-request-id') xRequestId?: string,
  ) {
    // Mercado Pago envia type e data.id como query params ou no body
    const webhookType = type || body?.type || body?.action;
    const webhookDataId = dataId || body?.data?.id?.toString();

    if (!webhookType || !webhookDataId) {
      return { received: true };
    }

    return this.paymentsService.handleMercadoPagoWebhook({
      type: webhookType,
      dataId: webhookDataId,
      xSignature,
      xRequestId,
    });
  }

  // =============================================
  // ADMIN ENDPOINTS
  // =============================================

  @Post('admin/payments/refund')
  @Auth(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async refundPayment(@Body() dto: RefundPaymentDto) {
    return this.paymentsService.refundPayment(dto);
  }

  @Get('admin/payments/orders/:orderId/can-confirm')
  @Auth(UserRole.ADMIN, UserRole.MERCHANT)
  async canConfirmOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.canConfirmOrder(orderId);
  }
}
