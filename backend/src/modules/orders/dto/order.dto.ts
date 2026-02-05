import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentMethod } from '@prisma/client';

// =============================================
// ORDER ITEM DTO
// =============================================

export class OrderItemDto {
  @IsString()
  @IsNotEmpty({ message: 'ID do produto é obrigatório' })
  productId!: string;

  @IsNumber()
  @Min(1, { message: 'Quantidade deve ser pelo menos 1' })
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

// =============================================
// CREATE ORDER DTO
// =============================================

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'ID do merchant é obrigatório' })
  merchantId!: string;

  @IsString()
  @IsNotEmpty({ message: 'ID do endereço é obrigatório' })
  addressId!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Pedido deve ter pelo menos 1 item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido' })
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}

// =============================================
// UPDATE ORDER STATUS DTO
// =============================================

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Status inválido' })
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

// =============================================
// CREATE ADDRESS DTO (para customer)
// =============================================

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsString()
  @IsNotEmpty()
  neighborhood!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  zipCode!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  isDefault?: boolean;
}
