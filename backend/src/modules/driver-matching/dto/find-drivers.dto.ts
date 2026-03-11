import { IsNumber, IsOptional, IsEnum, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';

export class FindNearbyDriversDto {
  @ApiProperty({ description: 'Latitude do ponto de origem (restaurante)' })
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ description: 'Longitude do ponto de origem (restaurante)' })
  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({
    description: 'Raio máximo de busca em km',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(20)
  radiusKm?: number = 5;

  @ApiPropertyOptional({
    description: 'Tipo de veículo preferido',
    enum: VehicleType,
  })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({
    description: 'Número máximo de drivers a retornar',
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class MatchDriverForOrderDto {
  @ApiProperty({ description: 'ID do pedido' })
  @IsUUID()
  orderId!: string;

  @ApiPropertyOptional({
    description: 'Raio máximo de busca em km',
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(20)
  radiusKm?: number = 5;

  @ApiPropertyOptional({
    description: 'Tipo de veículo preferido',
    enum: VehicleType,
  })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;
}

export interface NearbyDriverResult {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  averageRating: number;
  totalDeliveries: number;
  currentLat: number;
  currentLng: number;
  distanceKm: number;
  estimatedTimeMinutes: number;
}
