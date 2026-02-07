import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  MerchantStatus,
  OrderStatus,
  UserStatus,
  UserRole,
  AdminAction,
  PaymentStatus,
  PaymentIntentStatus,
} from '@prisma/client';
import { PrismaService } from '@shared/prisma';
import { PaymentsService } from '@modules/payments/payments.service';
import {
  ApproveMerchantDto,
  SuspendMerchantDto,
  RejectMerchantDto,
  AdminCancelOrderDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  AdminRefundPaymentDto,
  AdminMerchantQueryDto,
  AdminOrderQueryDto,
  AdminUserQueryDto,
  AdminAuditQueryDto,
} from './dto';

interface AuditContext {
  adminId: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  // =============================================
  // DASHBOARD
  // =============================================

  async getDashboardStats() {
    const [
      totalMerchants,
      pendingMerchants,
      activeMerchants,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalUsers,
      activeUsers,
      revenueData,
      todayRevenueData,
    ] = await Promise.all([
      this.prisma.merchant.count(),
      this.prisma.merchant.count({ where: { status: MerchantStatus.PENDING_APPROVAL } }),
      this.prisma.merchant.count({ where: { status: MerchantStatus.ACTIVE } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE, deletedAt: null } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: OrderStatus.DELIVERED },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: OrderStatus.DELIVERED,
          deliveredAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      totalMerchants,
      pendingMerchants,
      activeMerchants,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalUsers,
      activeUsers,
      totalRevenue: Number(revenueData._sum.total ?? 0),
      todayRevenue: Number(todayRevenueData._sum.total ?? 0),
      generatedAt: new Date(),
    };
  }

  // =============================================
  // MERCHANT MANAGEMENT
  // =============================================

  async listMerchants(query: AdminMerchantQueryDto) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { document: { contains: search } },
      ];
    }

    const [merchants, total] = await Promise.all([
      this.prisma.merchant.findMany({
        where,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          _count: { select: { products: true, orders: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.merchant.count({ where }),
    ]);

    return {
      data: merchants,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMerchantDetails(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true } },
        categories: true,
        products: { where: { deletedAt: null }, take: 10 },
        orders: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: { select: { products: true, orders: true, categories: true } },
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant não encontrado');
    }

    return merchant;
  }

  async approveMerchant(merchantId: string, dto: ApproveMerchantDto, ctx: AuditContext) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant não encontrado');
    }

    if (merchant.status !== MerchantStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Merchant não está pendente de aprovação');
    }

    const updated = await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { status: MerchantStatus.ACTIVE },
    });

    await this.logAction(ctx, {
      action: AdminAction.MERCHANT_APPROVED,
      targetType: 'merchant',
      targetId: merchantId,
      previousValue: { status: merchant.status },
      newValue: { status: MerchantStatus.ACTIVE },
      reason: dto.reason,
    });

    this.logger.log(`Merchant ${merchantId} aprovado por admin ${ctx.adminId}`);

    return updated;
  }

  async suspendMerchant(merchantId: string, dto: SuspendMerchantDto, ctx: AuditContext) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant não encontrado');
    }

    if (merchant.status === MerchantStatus.SUSPENDED) {
      throw new BadRequestException('Merchant já está suspenso');
    }

    const updated = await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { status: MerchantStatus.SUSPENDED, isOpen: false },
    });

    await this.logAction(ctx, {
      action: AdminAction.MERCHANT_SUSPENDED,
      targetType: 'merchant',
      targetId: merchantId,
      previousValue: { status: merchant.status },
      newValue: { status: MerchantStatus.SUSPENDED },
      reason: dto.reason,
    });

    this.logger.log(`Merchant ${merchantId} suspenso por admin ${ctx.adminId}: ${dto.reason}`);

    return updated;
  }

  async activateMerchant(merchantId: string, ctx: AuditContext) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant não encontrado');
    }

    if (merchant.status === MerchantStatus.ACTIVE) {
      throw new BadRequestException('Merchant já está ativo');
    }

    const updated = await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { status: MerchantStatus.ACTIVE },
    });

    await this.logAction(ctx, {
      action: AdminAction.MERCHANT_ACTIVATED,
      targetType: 'merchant',
      targetId: merchantId,
      previousValue: { status: merchant.status },
      newValue: { status: MerchantStatus.ACTIVE },
    });

    this.logger.log(`Merchant ${merchantId} ativado por admin ${ctx.adminId}`);

    return updated;
  }

  async rejectMerchant(merchantId: string, dto: RejectMerchantDto, ctx: AuditContext) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant não encontrado');
    }

    if (merchant.status !== MerchantStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Merchant não está pendente de aprovação');
    }

    const updated = await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { status: MerchantStatus.INACTIVE },
    });

    await this.logAction(ctx, {
      action: AdminAction.MERCHANT_REJECTED,
      targetType: 'merchant',
      targetId: merchantId,
      previousValue: { status: merchant.status },
      newValue: { status: MerchantStatus.INACTIVE },
      reason: dto.reason,
    });

    this.logger.log(`Merchant ${merchantId} rejeitado por admin ${ctx.adminId}: ${dto.reason}`);

    return updated;
  }

  // =============================================
  // ORDER MANAGEMENT
  // =============================================

  async listOrders(query: AdminOrderQueryDto) {
    const { page = 1, limit = 20, status, merchantId, customerId, orderNumber } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (merchantId) where.merchantId = merchantId;
    if (customerId) where.customerId = customerId;
    if (orderNumber) where.orderNumber = { contains: orderNumber };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          merchant: { select: { businessName: true, tradeName: true } },
          items: true,
          paymentIntent: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOrderDetails(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        merchant: { select: { id: true, businessName: true, tradeName: true } },
        driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
        address: true,
        items: true,
        paymentIntent: { include: { payments: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }

  async cancelOrder(orderId: string, dto: AdminCancelOrderDto, ctx: AuditContext) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { paymentIntent: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Pedido já está cancelado');
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Não é possível cancelar pedido já entregue');
    }

    // Atualizar pedido
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: `[ADMIN] ${dto.reason}`,
        paymentStatus: PaymentStatus.REFUNDED,
      },
    });

    // Processar refund se solicitado
    if (dto.processRefund && order.paymentIntent?.status === PaymentIntentStatus.SUCCEEDED) {
      await this.paymentsService.refundPayment({
        paymentIntentId: order.paymentIntent.id,
        reason: `Cancelamento administrativo: ${dto.reason}`,
      });
    }

    await this.logAction(ctx, {
      action: AdminAction.ORDER_CANCELLED,
      targetType: 'order',
      targetId: orderId,
      previousValue: { status: order.status },
      newValue: { status: OrderStatus.CANCELLED },
      reason: dto.reason,
      metadata: { processedRefund: dto.processRefund },
    });

    this.logger.log(`Pedido ${orderId} cancelado por admin ${ctx.adminId}: ${dto.reason}`);

    return updated;
  }

  // =============================================
  // USER MANAGEMENT
  // =============================================

  async listUsers(query: AdminUserQueryDto) {
    const { page = 1, limit = 20, role, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { customerOrders: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        merchant: { select: { id: true, businessName: true, status: true } },
        addresses: true,
        _count: { select: { customerOrders: true, driverOrders: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto, ctx: AuditContext) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Não permitir alterar status de admin por segurança
    if (user.role === UserRole.ADMIN && ctx.adminId !== userId) {
      throw new BadRequestException('Não é possível alterar status de outro admin');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
    });

    const action = dto.status === UserStatus.SUSPENDED
      ? AdminAction.USER_SUSPENDED
      : AdminAction.USER_ACTIVATED;

    await this.logAction(ctx, {
      action,
      targetType: 'user',
      targetId: userId,
      previousValue: { status: user.status },
      newValue: { status: dto.status },
      reason: dto.reason,
    });

    this.logger.log(`User ${userId} status alterado para ${dto.status} por admin ${ctx.adminId}`);

    return { id: updated.id, email: updated.email, status: updated.status };
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto, ctx: AuditContext) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Não permitir alterar role de admin por segurança
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Não é possível alterar role de admin');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
    });

    await this.logAction(ctx, {
      action: AdminAction.USER_ROLE_CHANGED,
      targetType: 'user',
      targetId: userId,
      previousValue: { role: user.role },
      newValue: { role: dto.role },
      reason: dto.reason,
    });

    this.logger.log(`User ${userId} role alterado para ${dto.role} por admin ${ctx.adminId}`);

    return { id: updated.id, email: updated.email, role: updated.role };
  }

  // =============================================
  // PAYMENT MANAGEMENT
  // =============================================

  async listPayments(query: AdminOrderQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.paymentIntent.findMany({
        include: {
          order: {
            select: { orderNumber: true, total: true, status: true },
          },
          payments: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paymentIntent.count(),
    ]);

    return {
      data: payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async refundPayment(paymentIntentId: string, dto: AdminRefundPaymentDto, ctx: AuditContext) {
    const result = await this.paymentsService.refundPayment({
      paymentIntentId,
      reason: dto.reason,
      amount: dto.amount,
    });

    await this.logAction(ctx, {
      action: AdminAction.PAYMENT_REFUNDED,
      targetType: 'payment',
      targetId: paymentIntentId,
      newValue: { refundAmount: result.refundAmount },
      reason: dto.reason,
    });

    this.logger.log(`Payment ${paymentIntentId} refundado por admin ${ctx.adminId}`);

    return result;
  }

  // =============================================
  // AUDIT LOG
  // =============================================

  async listAuditLogs(query: AdminAuditQueryDto) {
    const { page = 1, limit = 20, adminId, targetType, targetId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (adminId) where.adminId = adminId;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: { select: { email: true, firstName: true, lastName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // =============================================
  // PRIVATE HELPERS
  // =============================================

  private async logAction(
    ctx: AuditContext,
    data: {
      action: AdminAction;
      targetType: string;
      targetId: string;
      previousValue?: any;
      newValue?: any;
      reason?: string;
      metadata?: any;
    },
  ) {
    await this.prisma.adminAuditLog.create({
      data: {
        adminId: ctx.adminId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        previousValue: data.previousValue,
        newValue: data.newValue,
        reason: data.reason,
        metadata: data.metadata,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
    });
  }
}
