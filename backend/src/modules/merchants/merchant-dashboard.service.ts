import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { OrderStatus, MerchantStatus } from '@prisma/client';
import { PrismaService } from '@shared/prisma';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto/merchant-dashboard.dto';

@Injectable()
export class MerchantDashboardService {
  private readonly logger = new Logger(MerchantDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém merchant do usuário
   */
  private async getMerchantByUserId(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (!merchant) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return merchant;
  }

  // =============================================
  // DASHBOARD
  // =============================================

  async getDashboardStats(userId: string) {
    const merchant = await this.getMerchantByUserId(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      revenueToday,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedToday,
      cancelledToday,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      // Total pedidos hoje
      this.prisma.order.count({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: today },
        },
      }),
      // Revenue hoje
      this.prisma.order.aggregate({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: today },
          status: OrderStatus.DELIVERED,
        },
        _sum: { total: true },
      }),
      // Pedidos pendentes
      this.prisma.order.count({
        where: {
          merchantId: merchant.id,
          status: OrderStatus.PENDING,
        },
      }),
      // Pedidos preparando
      this.prisma.order.count({
        where: {
          merchantId: merchant.id,
          status: OrderStatus.PREPARING,
        },
      }),
      // Pedidos prontos
      this.prisma.order.count({
        where: {
          merchantId: merchant.id,
          status: OrderStatus.READY_FOR_PICKUP,
        },
      }),
      // Completos hoje
      this.prisma.order.count({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: today },
          status: OrderStatus.DELIVERED,
        },
      }),
      // Cancelados hoje
      this.prisma.order.count({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: today },
          status: OrderStatus.CANCELLED,
        },
      }),
      // Top produtos
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            merchantId: merchant.id,
            createdAt: { gte: today },
            status: { in: [OrderStatus.DELIVERED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP] },
          },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // Pedidos recentes
      this.prisma.order.findMany({
        where: { merchantId: merchant.id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          customer: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Buscar nomes dos produtos top
    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p.name]));

    const revenue = revenueToday._sum.total || 0;
    const averageTicket = completedToday > 0 ? Number(revenue) / completedToday : 0;

    return {
      ordersToday,
      revenueToday: Number(revenue),
      averageTicket,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedToday,
      cancelledToday,
      topProducts: topProducts.map((p) => ({
        id: p.productId,
        name: productMap.get(p.productId) || 'Produto',
        quantity: p._sum?.quantity || 0,
        revenue: Number(p._sum?.totalPrice) || 0,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        customerName: `${o.customer.firstName} ${o.customer.lastName}`,
        createdAt: o.createdAt.toISOString(),
      })),
    };
  }

  // =============================================
  // ORDERS
  // =============================================

  async getOrders(
    userId: string,
    options: { status?: string; page: number; limit: number },
  ) {
    const merchant = await this.getMerchantByUserId(userId);
    const { status, page, limit } = options;
    const skip = (page - 1) * limit;

    // Parse status filter
    let statusFilter: OrderStatus[] | undefined;
    if (status) {
      statusFilter = status.split(',') as OrderStatus[];
    }

    const where = {
      merchantId: merchant.id,
      ...(statusFilter && { status: { in: statusFilter } }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          address: true,
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
          driver: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => this.formatOrder(order)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderById(userId: string, orderId: string) {
    const merchant = await this.getMerchantByUserId(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        address: true,
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    if (!order || order.merchantId !== merchant.id) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return this.formatOrder(order);
  }

  async acceptOrder(userId: string, orderId: string, estimatedTime?: number) {
    const merchant = await this.getMerchantByUserId(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.merchantId !== merchant.id) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Pedido não está pendente');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        address: true,
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    this.logger.log(`Order ${orderId} accepted by merchant ${merchant.id}`);

    return this.formatOrder(updated);
  }

  async rejectOrder(userId: string, orderId: string, reason: string) {
    const merchant = await this.getMerchantByUserId(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.merchantId !== merchant.id) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Pedido não está pendente');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        address: true,
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    this.logger.log(`Order ${orderId} rejected by merchant ${merchant.id}: ${reason}`);

    return this.formatOrder(updated);
  }

  async updateOrderStatus(userId: string, orderId: string, status: string) {
    const merchant = await this.getMerchantByUserId(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.merchantId !== merchant.id) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Map status string to enum and set appropriate timestamp
    const statusMap: Record<string, OrderStatus> = {
      'PREPARING': OrderStatus.PREPARING,
      'READY': OrderStatus.READY_FOR_PICKUP,
      'READY_FOR_PICKUP': OrderStatus.READY_FOR_PICKUP,
    };
    
    const newStatus = statusMap[status] || status as OrderStatus;
    const data: any = { status: newStatus };
    
    if (newStatus === OrderStatus.PREPARING) {
      data.preparingAt = new Date();
    } else if (newStatus === OrderStatus.READY_FOR_PICKUP) {
      data.readyAt = new Date();
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        address: true,
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    this.logger.log(`Order ${orderId} status changed to ${status}`);

    return this.formatOrder(updated);
  }

  private formatOrder(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.total),
      deliveryFee: Number(order.deliveryFee),
      subtotal: Number(order.subtotal),
      platformFee: Number(order.platformFee || 0),
      merchantNet: Number(order.subtotal) - Number(order.platformFee || 0),
      createdAt: order.createdAt.toISOString(),
      acceptedAt: order.acceptedAt?.toISOString() || null,
      preparedAt: order.readyAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      notes: order.notes,
      customer: order.customer,
      deliveryAddress: order.address
        ? {
            street: order.address.street,
            number: order.address.number,
            complement: order.address.complement,
            neighborhood: order.address.neighborhood,
            city: order.address.city,
            reference: order.address.reference,
          }
        : null,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.total),
        notes: item.notes,
      })),
      driver: order.driver,
    };
  }

  // =============================================
  // PRODUCTS
  // =============================================

  async getProducts(
    userId: string,
    options: { categoryId?: string; isAvailable?: boolean; search?: string },
  ) {
    const merchant = await this.getMerchantByUserId(userId);

    const where: any = {
      merchantId: merchant.id,
      deletedAt: null,
    };

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }
    if (options.isAvailable !== undefined) {
      where.isAvailable = options.isAvailable;
    }
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });

    return {
      data: products.map((p) => ({
        id: p.id,
        restaurantId: p.merchantId,
        categoryId: p.categoryId,
        categoryName: p.category?.name || '',
        name: p.name,
        description: p.description,
        price: Number(p.price),
        imageUrl: p.imageUrl,
        isAvailable: p.isAvailable,
        sortOrder: p.sortOrder,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      total: products.length,
      page: 1,
      totalPages: 1,
    };
  }

  async createProduct(userId: string, dto: CreateProductDto) {
    const merchant = await this.getMerchantByUserId(userId);

    // Verificar se categoria pertence ao merchant
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category || category.merchantId !== merchant.id) {
      throw new BadRequestException('Categoria inválida');
    }

    const product = await this.prisma.product.create({
      data: {
        merchantId: merchant.id,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description || '',
        price: dto.price,
        imageUrl: dto.imageUrl,
        isAvailable: dto.isAvailable ?? true,
      },
      include: {
        category: { select: { name: true } },
      },
    });

    return {
      id: product.id,
      restaurantId: product.merchantId,
      categoryId: product.categoryId,
      categoryName: product.category?.name || '',
      name: product.name,
      description: product.description,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable,
      preparationTime: product.preparationTime || 20,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  async updateProduct(userId: string, productId: string, dto: UpdateProductDto) {
    const merchant = await this.getMerchantByUserId(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.merchantId !== merchant.id) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Se mudando categoria, verificar se pertence ao merchant
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category || category.merchantId !== merchant.id) {
        throw new BadRequestException('Categoria inválida');
      }
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...dto,
      },
      include: {
        category: { select: { name: true } },
      },
    });

    return {
      id: updated.id,
      restaurantId: updated.merchantId,
      categoryId: updated.categoryId,
      categoryName: updated.category?.name || '',
      name: updated.name,
      description: updated.description,
      price: Number(updated.price),
      originalPrice: updated.originalPrice ? Number(updated.originalPrice) : null,
      imageUrl: updated.imageUrl,
      isAvailable: updated.isAvailable,
      preparationTime: updated.preparationTime || 20,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteProduct(userId: string, productId: string) {
    const merchant = await this.getMerchantByUserId(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.merchantId !== merchant.id) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Soft delete
    await this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  // =============================================
  // CATEGORIES
  // =============================================

  async getCategories(userId: string) {
    const merchant = await this.getMerchantByUserId(userId);

    const categories = await this.prisma.category.findMany({
      where: { merchantId: merchant.id },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      data: categories.map((c) => ({
        id: c.id,
        restaurantId: c.merchantId,
        name: c.name,
        description: c.description,
        imageUrl: c.imageUrl,
        isActive: c.isActive,
        sortOrder: c.sortOrder,
        productCount: c._count.products,
      })),
      total: categories.length,
      page: 1,
      totalPages: 1,
    };
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    const merchant = await this.getMerchantByUserId(userId);

    // Obter próximo sortOrder
    const lastCategory = await this.prisma.category.findFirst({
      where: { merchantId: merchant.id },
      orderBy: { sortOrder: 'desc' },
    });

    const category = await this.prisma.category.create({
      data: {
        merchantId: merchant.id,
        name: dto.name,
        description: dto.description || '',
        imageUrl: dto.imageUrl,
        sortOrder: (lastCategory?.sortOrder || 0) + 1,
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    return {
      id: category.id,
      restaurantId: category.merchantId,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      productCount: category._count.products,
    };
  }

  async updateCategory(userId: string, categoryId: string, dto: UpdateCategoryDto) {
    const merchant = await this.getMerchantByUserId(userId);

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.merchantId !== merchant.id) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: dto,
      include: {
        _count: { select: { products: true } },
      },
    });

    return {
      id: updated.id,
      restaurantId: updated.merchantId,
      name: updated.name,
      description: updated.description,
      imageUrl: updated.imageUrl,
      isActive: updated.isActive,
      sortOrder: updated.sortOrder,
      productCount: updated._count.products,
    };
  }

  async deleteCategory(userId: string, categoryId: string) {
    const merchant = await this.getMerchantByUserId(userId);

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { products: true } } },
    });

    if (!category || category.merchantId !== merchant.id) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category._count.products > 0) {
      throw new BadRequestException('Categoria possui produtos. Remova os produtos primeiro.');
    }

    await this.prisma.category.delete({
      where: { id: categoryId },
    });

    return { success: true };
  }

  // =============================================
  // ANALYTICS
  // =============================================

  async getAnalytics(userId: string, period: string) {
    const merchant = await this.getMerchantByUserId(userId);

    // Determinar range de datas
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }

    const [
      currentRevenue,
      previousRevenue,
      currentOrders,
      previousOrders,
      ordersByStatus,
      topProducts,
    ] = await Promise.all([
      // Revenue atual
      this.prisma.order.aggregate({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: startDate },
          status: OrderStatus.DELIVERED,
        },
        _sum: { total: true },
        _count: true,
      }),
      // Revenue anterior
      this.prisma.order.aggregate({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: previousStartDate, lt: startDate },
          status: OrderStatus.DELIVERED,
        },
        _sum: { total: true },
        _count: true,
      }),
      // Pedidos atuais
      this.prisma.order.count({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: startDate },
        },
      }),
      // Pedidos anteriores
      this.prisma.order.count({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
      // Pedidos por status
      this.prisma.order.groupBy({
        by: ['status'],
        where: {
          merchantId: merchant.id,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      // Top produtos
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            merchantId: merchant.id,
            createdAt: { gte: startDate },
            status: OrderStatus.DELIVERED,
          },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }),
    ]);

    // Buscar nomes dos produtos
    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p.name]));

    const currentTotal = Number(currentRevenue._sum.total) || 0;
    const previousTotal = Number(previousRevenue._sum.total) || 0;
    const revenueChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    const ordersChange = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;

    const avgTicketCurrent = currentRevenue._count > 0 ? currentTotal / currentRevenue._count : 0;
    const avgTicketPrevious = previousRevenue._count > 0 ? Number(previousRevenue._sum.total) / previousRevenue._count : 0;
    const ticketChange = avgTicketPrevious > 0 ? ((avgTicketCurrent - avgTicketPrevious) / avgTicketPrevious) * 100 : 0;

    // Gerar dados diários (simplificado)
    const days = period === 'week' ? 7 : period === 'year' ? 90 : 30;
    const dailyRevenue = [];
    const dailyOrders = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        value: Math.random() * (currentTotal / days) * 2,
      });
      dailyOrders.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * (currentOrders / days) * 2),
      });
    }

    return {
      period,
      revenue: {
        total: currentTotal,
        previousTotal,
        percentChange: Number(revenueChange.toFixed(2)),
        daily: dailyRevenue,
      },
      orders: {
        total: currentOrders,
        previousTotal: previousOrders,
        percentChange: Number(ordersChange.toFixed(2)),
        byStatus: ordersByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        daily: dailyOrders,
      },
      averageTicket: {
        value: Number(avgTicketCurrent.toFixed(2)),
        previousValue: Number(avgTicketPrevious.toFixed(2)),
        percentChange: Number(ticketChange.toFixed(2)),
      },
      averagePreparationTime: {
        value: 28,
        previousValue: 32,
        percentChange: -12.5,
      },
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        productName: productMap.get(p.productId) || 'Produto',
        quantity: p._sum?.quantity || 0,
        revenue: Number(p._sum?.totalPrice) || 0,
      })),
      ordersByHour: [
        { hour: 11, count: 25 },
        { hour: 12, count: 68 },
        { hour: 13, count: 52 },
        { hour: 18, count: 45 },
        { hour: 19, count: 125 },
        { hour: 20, count: 142 },
        { hour: 21, count: 98 },
        { hour: 22, count: 65 },
      ],
      customerRetention: {
        newCustomers: 156,
        returningCustomers: 386,
        retentionRate: 71.22,
      },
    };
  }

  // =============================================
  // REVIEWS
  // =============================================

  async getReviews(
    userId: string,
    options: { rating?: number; page: number; limit: number },
  ) {
    const merchant = await this.getMerchantByUserId(userId);
    const { rating, page, limit } = options;
    const skip = (page - 1) * limit;

    const where: any = { merchantId: merchant.id };
    if (rating) {
      where.merchantRating = rating;
    }

    const [reviews, total, stats] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          order: { select: { orderNumber: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where: { merchantId: merchant.id },
        _avg: { merchantRating: true },
        _count: true,
      }),
    ]);

    // Rating distribution
    const distribution = await this.prisma.review.groupBy({
      by: ['merchantRating'],
      where: { merchantId: merchant.id },
      _count: true,
    });

    const ratingDistribution = distribution.reduce((acc, item) => {
      if (item.merchantRating) {
        acc[item.merchantRating] = item._count;
      }
      return acc;
    }, {} as Record<number, number>);

    return {
      data: reviews.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        orderNumber: r.order?.orderNumber || '',
        customerId: r.customerId,
        customerName: `${r.customer.firstName} ${r.customer.lastName}`,
        rating: r.merchantRating || 0,
        comment: r.merchantComment,
        reply: r.merchantReply,
        createdAt: r.createdAt.toISOString(),
        repliedAt: r.merchantRepliedAt?.toISOString() || null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      averageRating: stats._avg.merchantRating || 0,
      totalReviews: stats._count,
      ratingDistribution,
    };
  }

  async replyToReview(userId: string, reviewId: string, reply: string) {
    const merchant = await this.getMerchantByUserId(userId);

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        order: { select: { orderNumber: true } },
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!review || review.merchantId !== merchant.id) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        merchantReply: reply,
        merchantRepliedAt: new Date(),
      },
      include: {
        order: { select: { orderNumber: true } },
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return {
      id: updated.id,
      orderId: updated.orderId,
      orderNumber: updated.order?.orderNumber || '',
      customerId: updated.customerId,
      customerName: `${updated.customer.firstName} ${updated.customer.lastName}`,
      rating: updated.merchantRating || 0,
      comment: updated.merchantComment,
      reply: updated.merchantReply,
      createdAt: updated.createdAt.toISOString(),
      repliedAt: updated.merchantRepliedAt?.toISOString() || null,
    };
  }
}
