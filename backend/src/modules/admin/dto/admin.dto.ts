import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { MerchantStatus, OrderStatus, UserStatus, UserRole, DriverStatus, VehicleType } from '@prisma/client';

// =============================================
// MERCHANT MANAGEMENT
// =============================================

export class ApproveMerchantDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SuspendMerchantDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class RejectMerchantDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class UpdateMerchantStatusDto {
  @IsEnum(MerchantStatus)
  @IsNotEmpty()
  status!: MerchantStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

// =============================================
// ORDER MANAGEMENT
// =============================================

export class AdminCancelOrderDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsOptional()
  processRefund?: boolean = true;
}

export class AdminUpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

// =============================================
// USER MANAGEMENT
// =============================================

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status!: UserStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;

  @IsOptional()
  @IsString()
  reason?: string;
}

// =============================================
// PAYMENT MANAGEMENT
// =============================================

export class AdminRefundPaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

// =============================================
// QUERY DTOs
// =============================================

export class AdminPaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AdminMerchantQueryDto extends AdminPaginationDto {
  @IsOptional()
  @IsEnum(MerchantStatus)
  status?: MerchantStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminOrderQueryDto extends AdminPaginationDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsUUID()
  merchantId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  orderNumber?: string;
}

export class AdminUserQueryDto extends AdminPaginationDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminAuditQueryDto extends AdminPaginationDto {
  @IsOptional()
  @IsUUID()
  adminId?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  targetId?: string;
}

// =============================================
// DASHBOARD
// =============================================

export class DashboardStatsResponseDto {
  totalMerchants!: number;
  pendingMerchants!: number;
  activeMerchants!: number;
  
  totalOrders!: number;
  pendingOrders!: number;
  completedOrders!: number;
  cancelledOrders!: number;
  
  totalUsers!: number;
  activeUsers!: number;
  
  totalRevenue!: number;
  todayRevenue!: number;
  
  generatedAt!: Date;
}

// =============================================
// DRIVER MANAGEMENT
// =============================================

export class AdminDriverQueryDto extends AdminPaginationDto {
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ApproveDriverDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SuspendDriverDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class RejectDriverDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
