import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// =============================================
// REQUEST DTOs
// =============================================

export class CalculateEtaDto {
  @IsString()
  merchantId!: string;

  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  customerLat!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  customerLng!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  driverLat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  driverLng?: number;
}

export class CalculateDeliveryEtaDto {
  @IsString()
  orderId!: string;
}

// =============================================
// RESPONSE DTOs
// =============================================

export interface EtaBreakdown {
  preparationTimeMinutes: number;
  driverToMerchantMinutes: number;
  merchantToCustomerMinutes: number;
  totalMinutes: number;
  totalRange: {
    min: number;
    max: number;
  };
}

export interface EtaCalculationResult {
  estimatedDeliveryMinutes: number;
  estimatedDeliveryTime: Date;
  breakdown: EtaBreakdown;
  distances: {
    driverToMerchantKm: number | null;
    merchantToCustomerKm: number;
    totalKm: number;
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: string[];
}

export interface MerchantEtaResult {
  merchantId: string;
  merchantName: string;
  estimatedDeliveryMinutes: number;
  deliveryRange: {
    min: number;
    max: number;
  };
  preparationTimeMinutes: number;
  deliveryTimeMinutes: number;
  distanceKm: number;
  isOpen: boolean;
}

export interface OrderEtaResult {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  estimatedDeliveryTime: Date | null;
  remainingMinutes: number | null;
  breakdown: {
    preparationRemaining: number;
    deliveryRemaining: number;
  } | null;
  driverLocation: {
    latitude: number;
    longitude: number;
    distanceToDestinationKm: number;
  } | null;
  lastUpdated: Date;
}
