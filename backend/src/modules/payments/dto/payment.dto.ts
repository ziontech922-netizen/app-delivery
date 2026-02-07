import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import { PaymentMethod, PaymentStatus, PaymentIntentStatus } from '@prisma/client';

// =============================================
// CREATE PAYMENT INTENT
// =============================================

export class CreatePaymentIntentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method!: PaymentMethod;
}

// =============================================
// PROCESS PAYMENT (STUB)
// =============================================

export class ProcessPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  paymentIntentId!: string;

  // Dados simulados (não sensíveis)
  @IsOptional()
  @IsString()
  cardLast4?: string;

  @IsOptional()
  @IsString()
  cardBrand?: string;
}

// =============================================
// WEBHOOK PAYLOAD (SIMULATED)
// =============================================

export class WebhookPayloadDto {
  @IsString()
  @IsNotEmpty()
  event!: string;

  @IsUUID()
  @IsNotEmpty()
  paymentIntentId!: string;

  @IsEnum(PaymentIntentStatus)
  @IsNotEmpty()
  status!: PaymentIntentStatus;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  failureCode?: string;

  @IsOptional()
  @IsString()
  failureMessage?: string;
}

// =============================================
// REFUND
// =============================================

export class RefundPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  paymentIntentId!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number; // Refund parcial
}

// =============================================
// RESPONSE DTOs
// =============================================

export class PaymentIntentResponseDto {
  id!: string;
  orderId!: string;
  amount!: number;
  currency!: string;
  method!: PaymentMethod;
  status!: PaymentIntentStatus;
  externalId?: string;
  expiresAt?: Date;
  createdAt!: Date;

  // PIX data (se aplicável)
  pixQrCode?: string;
  pixKey?: string;
}

export class PaymentResponseDto {
  id!: string;
  paymentIntentId!: string;
  amount!: number;
  status!: PaymentStatus;
  cardLast4?: string;
  cardBrand?: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  createdAt!: Date;
}
