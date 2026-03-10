import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ApplyCouponDto,
  CouponResponseDto,
  ApplyCouponResponseDto,
} from './dto/coupon.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ===========================================
  // ADMIN ROUTES
  // ===========================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new coupon (Admin/Merchant)' })
  @ApiResponse({ status: 201, description: 'Coupon created', type: CouponResponseDto })
  async create(
    @Body() dto: CreateCouponDto,
    @CurrentUser() user: { id: string; role: UserRole; merchantId?: string },
  ) {
    // Merchants can only create coupons for themselves
    if (user.role === UserRole.MERCHANT) {
      if (!user.merchantId) {
        throw new Error('Merchant ID not found');
      }
      dto.merchantId = user.merchantId;
    }

    return this.couponsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all coupons (Admin/Merchant)' })
  @ApiQuery({ name: 'merchantId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'includeExpired', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [CouponResponseDto] })
  async findAll(
    @Query('merchantId') merchantId?: string,
    @Query('isActive') isActive?: string,
    @Query('includeExpired') includeExpired?: string,
    @CurrentUser() user?: { role: UserRole; merchantId?: string },
  ) {
    // Merchants can only see their own coupons + global
    let filterMerchantId = merchantId;
    if (user?.role === UserRole.MERCHANT && user.merchantId) {
      filterMerchantId = user.merchantId;
    }

    return this.couponsService.findAll({
      merchantId: filterMerchantId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      includeExpired: includeExpired === 'true',
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon by ID (Admin/Merchant)' })
  @ApiResponse({ status: 200, type: CouponResponseDto })
  async findById(@Param('id') id: string) {
    return this.couponsService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update coupon (Admin/Merchant)' })
  @ApiResponse({ status: 200, type: CouponResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
    @CurrentUser() user: { role: UserRole; merchantId?: string },
  ) {
    // Merchants can only update their own coupons
    if (user.role === UserRole.MERCHANT) {
      const coupon = await this.couponsService.findById(id);
      if (coupon.merchantId !== user.merchantId) {
        throw new Error('Unauthorized');
      }
      // Merchants cannot change merchantId
      delete dto.merchantId;
    }

    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete coupon (Admin/Merchant)' })
  @ApiResponse({ status: 200, description: 'Coupon deleted' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { role: UserRole; merchantId?: string },
  ) {
    // Merchants can only delete their own coupons
    if (user.role === UserRole.MERCHANT) {
      const coupon = await this.couponsService.findById(id);
      if (coupon.merchantId !== user.merchantId) {
        throw new Error('Unauthorized');
      }
    }

    return this.couponsService.delete(id);
  }

  // ===========================================
  // PUBLIC/CUSTOMER ROUTES
  // ===========================================

  @Get('code/:code')
  @ApiOperation({ summary: 'Get coupon info by code (public)' })
  @ApiResponse({ status: 200, type: CouponResponseDto })
  async findByCode(@Param('code') code: string) {
    const coupon = await this.couponsService.findByCode(code);
    // Return limited info for public access
    return {
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      description: coupon.description,
      minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      merchantId: coupon.merchantId,
      expiresAt: coupon.expiresAt,
    };
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate coupon and calculate discount' })
  @ApiResponse({ status: 200, type: ApplyCouponResponseDto })
  async validateCoupon(
    @Body() dto: ApplyCouponDto,
    @CurrentUser() user: { id: string },
  ): Promise<ApplyCouponResponseDto> {
    return this.couponsService.validateCoupon(dto, user.id);
  }
}
