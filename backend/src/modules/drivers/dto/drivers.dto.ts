import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  Matches,
  IsInt,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DriverStatus, VehicleType } from '@prisma/client';

// ===========================================
// CREATE / UPDATE PROFILE
// ===========================================

export class CreateDriverProfileDto {
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve ter 11 dígitos' })
  cpf!: string;

  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @IsOptional()
  @IsString()
  cnh?: string;

  @IsOptional()
  @IsString()
  cnhCategory?: string;

  @IsOptional()
  @IsDateString()
  cnhExpiry?: string;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  vehicleYear?: number;

  @IsOptional()
  @IsString()
  vehicleColor?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxDeliveryRadius?: number;
}

export class UpdateDriverProfileDto {
  @IsOptional()
  @IsString()
  cnh?: string;

  @IsOptional()
  @IsString()
  cnhCategory?: string;

  @IsOptional()
  @IsDateString()
  cnhExpiry?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  vehicleYear?: number;

  @IsOptional()
  @IsString()
  vehicleColor?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxDeliveryRadius?: number;
}

// ===========================================
// LOCATION UPDATE
// ===========================================

export class UpdateLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @IsOptional()
  @IsString()
  orderId?: string;
}

// ===========================================
// AVAILABILITY
// ===========================================

export class SetAvailabilityDto {
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsIn(['AVAILABLE', 'BUSY', 'OFFLINE'])
  status?: 'AVAILABLE' | 'BUSY' | 'OFFLINE';

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

// ===========================================
// ORDER ACTIONS
// ===========================================

export class AcceptOrderDto {
  @IsString()
  orderId!: string;

  @IsOptional()
  @IsNumber()
  estimatedMinutes?: number;
}

export class RejectOrderDto {
  @IsString()
  orderId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CompleteDeliveryDto {
  @IsString()
  orderId!: string;

  @IsOptional()
  @IsString()
  proofPhotoUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ===========================================
// ADMIN ACTIONS
// ===========================================

export class ApproveDriverDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SuspendDriverDto {
  @IsString()
  reason!: string;
}

export class RejectDriverDto {
  @IsString()
  reason!: string;
}

// ===========================================
// QUERIES
// ===========================================

export class DriverQueryDto {
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class NearbyDriversQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  radiusKm?: number = 10;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class DriverOrdersQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ===========================================
// RESPONSE DTOs (interfaces para documentação)
// ===========================================

export interface DriverProfileResponseDto {
  id: string;
  userId: string;
  cpf: string;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  vehicleModel?: string;
  status: DriverStatus;
  isAvailable: boolean;
  totalDeliveries: number;
  averageRating?: number;
  currentLat?: number;
  currentLng?: number;
  createdAt: Date;
}

export interface DriverStatsResponseDto {
  totalDeliveries: number;
  todayDeliveries: number;
  weekDeliveries: number;
  averageRating: number;
  totalRatings: number;
  balance: number;
  pendingOrders: number;
}

export interface NearbyDriverResponseDto {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  averageRating?: number;
  totalDeliveries: number;
  distanceKm: number;
}

// ===========================================
// DRIVER REGISTRATION (PUBLIC)
// ===========================================

export class RegisterDriverDto {
  @IsString()
  @Matches(/^[A-Za-zÀ-ÿ\s]+$/, { message: 'Nome deve conter apenas letras' })
  name!: string;

  @IsString()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'E-mail inválido' })
  email!: string;

  @IsString()
  @Matches(/^.{6,}$/, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password!: string;

  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'Telefone deve ter 10 ou 11 dígitos' })
  phone!: string;

  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve ter 11 dígitos' })
  cpf!: string;

  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;
}
