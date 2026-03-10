import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { CouponType, Prisma } from '@prisma/client';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ApplyCouponDto,
  ApplyCouponResponseDto,
} from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new coupon
   */
  async create(dto: CreateCouponDto) {
    // Check if code already exists
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Cupom com código "${dto.code}" já existe`);
    }

    // Validate percent value
    if (dto.type === CouponType.PERCENT && dto.value > 100) {
      throw new BadRequestException('Valor percentual não pode ser maior que 100');
    }

    // Validate merchant if provided
    if (dto.merchantId) {
      const merchant = await this.prisma.merchant.findUnique({
        where: { id: dto.merchantId },
      });
      if (!merchant) {
        throw new NotFoundException('Merchant não encontrado');
      }
    }

    return this.prisma.coupon.create({
      data: {
        code: dto.code,
        type: dto.type,
        value: dto.value,
        maxUses: dto.maxUses,
        maxUsesPerUser: dto.maxUsesPerUser,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        minOrderValue: dto.minOrderValue,
        maxDiscount: dto.maxDiscount,
        merchantId: dto.merchantId,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Find all coupons with optional filters
   */
  async findAll(filters?: {
    merchantId?: string;
    isActive?: boolean;
    includeExpired?: boolean;
  }) {
    const where: Prisma.CouponWhereInput = {
      deletedAt: null,
    };

    if (filters?.merchantId) {
      where.merchantId = filters.merchantId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (!filters?.includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    return this.prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find coupon by ID
   */
  async findById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        merchant: {
          select: { id: true, businessName: true, tradeName: true },
        },
      },
    });

    if (!coupon || coupon.deletedAt) {
      throw new NotFoundException('Cupom não encontrado');
    }

    return coupon;
  }

  /**
   * Find coupon by code
   */
  async findByCode(code: string) {
    const normalizedCode = code.toUpperCase().replace(/\s/g, '');
    
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: normalizedCode },
      include: {
        merchant: {
          select: { id: true, businessName: true, tradeName: true },
        },
      },
    });

    if (!coupon || coupon.deletedAt) {
      throw new NotFoundException('Cupom não encontrado');
    }

    return coupon;
  }

  /**
   * Update coupon
   */
  async update(id: string, dto: UpdateCouponDto) {
    await this.findById(id); // Check existence

    // Check code uniqueness if changing
    if (dto.code) {
      const existing = await this.prisma.coupon.findFirst({
        where: {
          code: dto.code,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(`Cupom com código "${dto.code}" já existe`);
      }
    }

    // Validate percent value
    if (dto.type === CouponType.PERCENT && dto.value && dto.value > 100) {
      throw new BadRequestException('Valor percentual não pode ser maior que 100');
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.code && { code: dto.code }),
        ...(dto.type && { type: dto.type }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
        ...(dto.maxUsesPerUser !== undefined && { maxUsesPerUser: dto.maxUsesPerUser }),
        ...(dto.startsAt !== undefined && { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.minOrderValue !== undefined && { minOrderValue: dto.minOrderValue }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount }),
        ...(dto.merchantId !== undefined && { merchantId: dto.merchantId || null }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /**
   * Soft delete coupon
   */
  async delete(id: string) {
    await this.findById(id);

    return this.prisma.coupon.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Validate and calculate coupon discount
   */
  async validateCoupon(
    dto: ApplyCouponDto,
    userId?: string,
  ): Promise<ApplyCouponResponseDto> {
    const normalizedCode = dto.code.toUpperCase().replace(/\s/g, '');

    // Find coupon
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    // Not found
    if (!coupon || coupon.deletedAt) {
      return { valid: false, error: 'Cupom não encontrado' };
    }

    // Not active
    if (!coupon.isActive) {
      return { valid: false, error: 'Cupom inativo' };
    }

    // Not started yet
    if (coupon.startsAt && coupon.startsAt > new Date()) {
      return { valid: false, error: 'Cupom ainda não está disponível' };
    }

    // Expired
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { valid: false, error: 'Cupom expirado' };
    }

    // Max uses reached
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return { valid: false, error: 'Cupom atingiu o limite de usos' };
    }

    // Check user usage limit
    if (userId && coupon.maxUsesPerUser) {
      const userUsageCount = await this.prisma.order.count({
        where: {
          customerId: userId,
          couponCode: coupon.code,
          status: { not: 'CANCELLED' },
        },
      });

      if (userUsageCount >= coupon.maxUsesPerUser) {
        return { valid: false, error: 'Você já utilizou este cupom o número máximo de vezes' };
      }
    }

    // Merchant restriction
    if (coupon.merchantId && coupon.merchantId !== dto.merchantId) {
      return { valid: false, error: 'Cupom não válido para este estabelecimento' };
    }

    // Minimum order value
    const minOrderValue = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;
    if (dto.subtotal < minOrderValue) {
      return {
        valid: false,
        error: `Valor mínimo do pedido é R$ ${minOrderValue.toFixed(2)}`,
      };
    }

    // Calculate discount
    let discount: number;
    if (coupon.type === CouponType.PERCENT) {
      discount = (dto.subtotal * Number(coupon.value)) / 100;
      // Apply max discount cap if set
      const maxDiscount = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;
      if (maxDiscount && discount > maxDiscount) {
        discount = maxDiscount;
      }
    } else {
      // Fixed discount
      discount = Number(coupon.value);
    }

    // Discount cannot exceed subtotal
    if (discount > dto.subtotal) {
      discount = dto.subtotal;
    }

    // Round to 2 decimal places
    discount = Math.round(discount * 100) / 100;
    const newTotal = Math.round((dto.subtotal - discount) * 100) / 100;

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      discount,
      newTotal,
      description: coupon.description || undefined,
    };
  }

  /**
   * Apply coupon to order - increments usage count
   * Called when order is confirmed
   */
  async applyCoupon(code: string): Promise<void> {
    const normalizedCode = code.toUpperCase().replace(/\s/g, '');

    await this.prisma.coupon.update({
      where: { code: normalizedCode },
      data: {
        currentUses: { increment: 1 },
      },
    });

    this.logger.log(`Coupon ${normalizedCode} usage incremented`);
  }

  /**
   * Revert coupon usage - decrements usage count
   * Called when order is cancelled
   */
  async revertCouponUsage(code: string): Promise<void> {
    const normalizedCode = code.toUpperCase().replace(/\s/g, '');

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (coupon && coupon.currentUses > 0) {
      await this.prisma.coupon.update({
        where: { code: normalizedCode },
        data: {
          currentUses: { decrement: 1 },
        },
      });

      this.logger.log(`Coupon ${normalizedCode} usage decremented`);
    }
  }
}
