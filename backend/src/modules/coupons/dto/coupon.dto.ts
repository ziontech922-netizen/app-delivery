import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CouponType } from '@prisma/client';

// ===========================================
// CREATE COUPON
// ===========================================

export class CreateCouponDto {
  @ApiProperty({ description: 'Código único do cupom (maiúsculas, sem espaços)', example: 'DESCONTO10' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[A-Z0-9]+$/, { message: 'Código deve conter apenas letras maiúsculas e números' })
  @Transform(({ value }) => value?.toUpperCase().replace(/\s/g, ''))
  code!: string;

  @ApiProperty({ enum: CouponType, description: 'Tipo do cupom: PERCENT ou FIXED' })
  @IsEnum(CouponType)
  type!: CouponType;

  @ApiProperty({ description: 'Valor do desconto (percentual 0-100 ou valor fixo)', example: 10 })
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional({ description: 'Número máximo de usos totais' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Número máximo de usos por usuário' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsesPerUser?: number;

  @ApiPropertyOptional({ description: 'Data de início da validade' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Data de expiração' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Valor mínimo do pedido para usar o cupom' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ description: 'Valor máximo de desconto (para cupons percentuais)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'ID do merchant (deixe vazio para cupom global)' })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiPropertyOptional({ description: 'Descrição do cupom' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Se o cupom está ativo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===========================================
// UPDATE COUPON
// ===========================================

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}

// ===========================================
// APPLY COUPON
// ===========================================

export class ApplyCouponDto {
  @ApiProperty({ description: 'Código do cupom', example: 'DESCONTO10' })
  @IsString()
  @Transform(({ value }) => value?.toUpperCase().replace(/\s/g, ''))
  code!: string;

  @ApiProperty({ description: 'ID do merchant do pedido' })
  @IsString()
  merchantId!: string;

  @ApiProperty({ description: 'Subtotal do pedido (sem frete)', example: 50 })
  @IsNumber()
  @Min(0)
  subtotal!: number;
}

// ===========================================
// RESPONSE DTOs
// ===========================================

export class CouponResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ enum: CouponType })
  type!: CouponType;

  @ApiProperty()
  value!: number;

  @ApiPropertyOptional()
  maxUses?: number;

  @ApiProperty()
  currentUses!: number;

  @ApiPropertyOptional()
  maxUsesPerUser?: number;

  @ApiPropertyOptional()
  startsAt?: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiPropertyOptional()
  minOrderValue?: number;

  @ApiPropertyOptional()
  maxDiscount?: number;

  @ApiPropertyOptional()
  merchantId?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

export class ApplyCouponResponseDto {
  @ApiProperty({ description: 'Se o cupom é válido' })
  valid!: boolean;

  @ApiPropertyOptional({ description: 'Mensagem de erro se inválido' })
  error?: string;

  @ApiPropertyOptional({ description: 'Código do cupom' })
  code?: string;

  @ApiPropertyOptional({ description: 'Tipo do cupom' })
  type?: CouponType;

  @ApiPropertyOptional({ description: 'Valor do desconto calculado' })
  discount?: number;

  @ApiPropertyOptional({ description: 'Novo total após desconto' })
  newTotal?: number;

  @ApiPropertyOptional({ description: 'Descrição do cupom' })
  description?: string;
}
