import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// =============================================
// REQUEST DTOs
// =============================================

export class CreatePlatformFeeDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  fixedFee?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsString()
  merchantId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxFee?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priority?: number;
}

export class UpdatePlatformFeeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  fixedFee?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsString()
  merchantId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxFee?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priority?: number;
}

// =============================================
// RESPONSE DTOs
// =============================================

export interface PlatformFeeResponse {
  id: string;
  name: string;
  description: string | null;
  percentage: number | null;
  fixedFee: number | null;
  deliveryFee: number | null;
  merchantId: string | null;
  merchantName?: string;
  minOrderValue: number | null;
  maxFee: number | null;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeCalculationResult {
  platformFee: number;      // Comissão deduzida do merchant
  serviceFee: number;       // Taxa de serviço cobrada do cliente
  merchantNet: number;
  breakdown: {
    percentageFee: number;  // Comissão percentual (do merchant)
    fixedFee: number;       // Taxa fixa de serviço (do cliente)
    deliveryFee: number;    // Taxa adicional de delivery (do cliente)
  };
  appliedFee: {
    id: string;
    name: string;
  } | null;
}

export interface FeePreviewResult {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;           // Taxa de serviço (fixedFee + platformDeliveryFee)
  platformFee: number;          // Comissão percentual (para referência)
  discount: number;
  total: number;
  merchantNet: number;
  breakdown: {
    percentageFee: number;
    fixedFee: number;
    platformDeliveryFee: number;
  };
}
