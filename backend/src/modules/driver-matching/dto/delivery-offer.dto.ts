import { IsUUID, IsOptional, IsNumber, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeliveryOfferDto {
  @ApiProperty({ description: 'ID do pedido' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ description: 'ID do driver profile' })
  @IsUUID()
  driverId!: string;

  @ApiPropertyOptional({
    description: 'Tempo limite para resposta em segundos',
    default: 30,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timeoutSeconds?: number = 30;
}

export class RespondToOfferDto {
  @ApiProperty({ description: 'ID da oferta' })
  @IsUUID()
  offerId!: string;

  @ApiProperty({ description: 'Aceitar ou recusar a oferta' })
  @IsBoolean()
  accepted!: boolean;

  @ApiPropertyOptional({ description: 'Motivo da recusa' })
  @IsOptional()
  @IsString()
  declineReason?: string;
}

export enum DeliveryOfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface DeliveryOffer {
  id: string;
  orderId: string;
  driverId: string;
  driverUserId: string;
  status: DeliveryOfferStatus;
  distanceKm: number;
  estimatedEarnings: number;
  expiresAt: Date;
  createdAt: Date;
  respondedAt?: Date;

  // Order details for display
  orderDetails: {
    orderNumber: string;
    merchantName: string;
    merchantAddress: string;
    deliveryAddress: string;
    itemCount: number;
    totalAmount: number;
    deliveryFee: number;
  };

  // Restaurant location
  pickupLocation: {
    latitude: number;
    longitude: number;
  };

  // Delivery location
  deliveryLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface DeliveryOfferResult {
  success: boolean;
  offer?: DeliveryOffer;
  error?: string;
}

export interface MatchingResult {
  success: boolean;
  driverId?: string;
  driverUserId?: string;
  offerId?: string;
  error?: string;
  driversContacted: number;
  timeElapsedMs: number;
}
