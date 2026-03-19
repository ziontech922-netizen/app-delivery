import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { RedisService } from '@shared/redis/redis.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { NotificationEvent } from '@modules/notifications/dto/notification.dto';
import {
  DriverStatus,
  VehicleType,
  OrderStatus,
  UserRole,
  Prisma,
} from '@prisma/client';
import {
  CreateDriverProfileDto,
  UpdateDriverProfileDto,
  UpdateLocationDto,
  SetAvailabilityDto,
  AcceptOrderDto,
  CompleteDeliveryDto,
  DriverQueryDto,
  NearbyDriversQueryDto,
  DriverOrdersQueryDto,
  ApproveDriverDto,
  SuspendDriverDto,
  RejectDriverDto,
  RegisterDriverDto,
} from './dto';
import * as argon2 from 'argon2';

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  // ===========================================
  // PUBLIC REGISTRATION
  // ===========================================

  async registerDriver(dto: RegisterDriverDto) {
    // Verificar se email já existe
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException('E-mail já cadastrado');
    }

    // Verificar se CPF já existe
    const existingCpf = await this.prisma.driverProfile.findUnique({
      where: { cpf: dto.cpf },
    });

    if (existingCpf) {
      throw new ConflictException('CPF já cadastrado');
    }

    // Hash da senha com Argon2
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    // Separar nome em firstName e lastName
    const nameParts = dto.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Criar usuário e perfil de driver em uma transação
    const result = await this.prisma.$transaction(async (tx) => {
      // Criar usuário
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName,
          lastName,
          phone: dto.phone,
          role: UserRole.DRIVER,
        },
      });

      // Criar perfil de driver
      const driverProfile = await tx.driverProfile.create({
        data: {
          userId: user.id,
          cpf: dto.cpf,
          vehicleType: dto.vehicleType,
          vehiclePlate: dto.vehiclePlate,
          status: DriverStatus.PENDING_APPROVAL,
          isAvailable: false,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
        },
        driverProfile: {
          id: driverProfile.id,
          cpf: driverProfile.cpf,
          vehicleType: driverProfile.vehicleType,
          vehiclePlate: driverProfile.vehiclePlate,
          status: driverProfile.status,
        },
      };
    });

    return {
      message: 'Cadastro realizado com sucesso! Aguarde a aprovação.',
      ...result,
    };
  }

  // ===========================================
  // PROFILE MANAGEMENT
  // ===========================================

  async createProfile(userId: string, dto: CreateDriverProfileDto) {
    // Verificar se usuário existe e tem role DRIVER
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { driverProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.role !== UserRole.DRIVER) {
      throw new ForbiddenException('Usuário não tem permissão de motorista');
    }

    if (user.driverProfile) {
      throw new ConflictException('Motorista já possui perfil cadastrado');
    }

    // Verificar CPF duplicado
    const existingCpf = await this.prisma.driverProfile.findUnique({
      where: { cpf: dto.cpf },
    });

    if (existingCpf) {
      throw new ConflictException('CPF já cadastrado');
    }

    // Criar perfil
    const profile = await this.prisma.driverProfile.create({
      data: {
        userId,
        cpf: dto.cpf,
        vehicleType: dto.vehicleType,
        cnh: dto.cnh,
        cnhCategory: dto.cnhCategory,
        cnhExpiry: dto.cnhExpiry ? new Date(dto.cnhExpiry) : undefined,
        vehiclePlate: dto.vehiclePlate,
        vehicleModel: dto.vehicleModel,
        vehicleYear: dto.vehicleYear,
        vehicleColor: dto.vehicleColor,
        photoUrl: dto.photoUrl,
        documentUrl: dto.documentUrl,
        maxDeliveryRadius: dto.maxDeliveryRadius ?? 10,
        status: DriverStatus.PENDING_APPROVAL,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    return profile;
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    // Map backend status to frontend expected values
    const statusMap: Record<string, string> = {
      'ONLINE': 'AVAILABLE',
      'ON_DELIVERY': 'BUSY',
      'OFFLINE': 'OFFLINE',
      'APPROVED': 'OFFLINE',
      'PENDING_APPROVAL': 'OFFLINE',
      'SUSPENDED': 'OFFLINE',
    };

    // Flatten user data for frontend compatibility
    const { user, ...driverData } = profile;
    return {
      ...driverData,
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl || driverData.photoUrl,
      isVerified: profile.status === 'APPROVED' || profile.status === 'ONLINE' || profile.status === 'OFFLINE',
      status: statusMap[profile.status] || 'OFFLINE',
    };
  }

  async updateProfile(userId: string, dto: UpdateDriverProfileDto) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    // Não permitir edição se suspenso
    if (profile.status === DriverStatus.SUSPENDED) {
      throw new ForbiddenException('Motorista suspenso não pode editar perfil');
    }

    const updated = await this.prisma.driverProfile.update({
      where: { userId },
      data: {
        cnh: dto.cnh,
        cnhCategory: dto.cnhCategory,
        cnhExpiry: dto.cnhExpiry ? new Date(dto.cnhExpiry) : undefined,
        vehicleType: dto.vehicleType,
        vehiclePlate: dto.vehiclePlate,
        vehicleModel: dto.vehicleModel,
        vehicleYear: dto.vehicleYear,
        vehicleColor: dto.vehicleColor,
        photoUrl: dto.photoUrl,
        documentUrl: dto.documentUrl,
        maxDeliveryRadius: dto.maxDeliveryRadius,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Map backend status to frontend expected values
    const statusMap: Record<string, string> = {
      'ONLINE': 'AVAILABLE',
      'ON_DELIVERY': 'BUSY',
      'OFFLINE': 'OFFLINE',
      'APPROVED': 'OFFLINE',
      'PENDING_APPROVAL': 'OFFLINE',
      'SUSPENDED': 'OFFLINE',
    };

    // Flatten user data for frontend compatibility
    const { user, ...driverData } = updated;
    return {
      ...driverData,
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl || driverData.photoUrl,
      isVerified: updated.status === 'APPROVED' || updated.status === 'ONLINE' || updated.status === 'OFFLINE',
      status: statusMap[updated.status] || 'OFFLINE',
    };
  }

  // ===========================================
  // LOCATION & AVAILABILITY
  // ===========================================

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    // Atualizar localização no perfil (cache)
    await this.prisma.driverProfile.update({
      where: { userId },
      data: {
        currentLat: dto.latitude,
        currentLng: dto.longitude,
        lastLocationAt: new Date(),
      },
    });

    // Salvar histórico de localização
    await this.prisma.driverLocation.create({
      data: {
        driverId: profile.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        heading: dto.heading,
        speed: dto.speed,
        orderId: dto.orderId,
      },
    });

    // Cache no Redis para queries rápidas
    await this.redis.set(
      `driver:location:${profile.id}`,
      JSON.stringify({
        lat: dto.latitude,
        lng: dto.longitude,
        timestamp: Date.now(),
      }),
      300, // 5 minutos TTL
    );

    return { success: true };
  }

  async setAvailability(userId: string, dto: SetAvailabilityDto) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    // Verificar se está em entrega (não pode mudar disponibilidade)
    if (profile.status === DriverStatus.ON_DELIVERY) {
      throw new BadRequestException(
        'Complete a entrega atual antes de mudar disponibilidade',
      );
    }

    // Verificar se aprovado
    if (
      profile.status !== DriverStatus.APPROVED &&
      profile.status !== DriverStatus.ONLINE &&
      profile.status !== DriverStatus.OFFLINE
    ) {
      throw new ForbiddenException(
        'Motorista não está aprovado para aceitar entregas',
      );
    }

    // Convert status string to isAvailable boolean if provided
    let isAvailable: boolean;
    if (dto.status !== undefined) {
      isAvailable = dto.status === 'AVAILABLE';
    } else if (dto.isAvailable !== undefined) {
      isAvailable = dto.isAvailable;
    } else {
      throw new BadRequestException('Forneça status ou isAvailable');
    }

    const newStatus = isAvailable
      ? DriverStatus.ONLINE
      : DriverStatus.OFFLINE;

    const updateData: Prisma.DriverProfileUpdateInput = {
      isAvailable: isAvailable,
      status: newStatus,
    };

    // Atualizar localização se fornecida
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      updateData.currentLat = dto.latitude;
      updateData.currentLng = dto.longitude;
      updateData.lastLocationAt = new Date();
    }

    const updated = await this.prisma.driverProfile.update({
      where: { userId },
      data: updateData,
    });

    // Atualizar cache Redis
    if (isAvailable) {
      await this.redis.set(
        `driver:available:${profile.id}`,
        JSON.stringify({
          lat: dto.latitude,
          lng: dto.longitude,
          vehicleType: profile.vehicleType,
        }),
        600, // 10 minutos
      );
    } else {
      await this.redis.del(`driver:available:${profile.id}`);
    }

    // Map backend status to frontend expected values
    const statusMap: Record<string, string> = {
      'ONLINE': 'AVAILABLE',
      'ON_DELIVERY': 'BUSY',
      'OFFLINE': 'OFFLINE',
      'APPROVED': 'OFFLINE',
      'PENDING_APPROVAL': 'OFFLINE',
      'SUSPENDED': 'OFFLINE',
    };

    return {
      ...updated,
      status: statusMap[updated.status] || 'OFFLINE',
    };
  }

  // ===========================================
  // ORDER MANAGEMENT
  // ===========================================

  async getAvailableOrders(userId: string, query: DriverOrdersQueryDto) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    // Pedidos READY_FOR_PICKUP sem motorista atribuído
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: OrderStatus.READY_FOR_PICKUP,
          driverId: null,
        },
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
              street: true,
              number: true,
              neighborhood: true,
              city: true,
              latitude: true,
              longitude: true,
            },
          },
          address: true,
          items: {
            select: {
              productName: true,
              quantity: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({
        where: {
          status: OrderStatus.READY_FOR_PICKUP,
          driverId: null,
        },
      }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyOrders(userId: string, query: DriverOrdersQueryDto) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    const { page = 1, limit = 20, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      driverId: userId,
    };

    if (status) {
      where.status = status as OrderStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
              street: true,
              number: true,
              neighborhood: true,
            },
          },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async acceptOrder(userId: string, dto: AcceptOrderDto) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    if (profile.status !== DriverStatus.ONLINE) {
      throw new ForbiddenException(
        'Você precisa estar online para aceitar pedidos',
      );
    }

    // Verificar pedido
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException('Pedido não está pronto para coleta');
    }

    if (order.driverId) {
      throw new ConflictException('Pedido já aceito por outro motorista');
    }

    // Atribuir motorista ao pedido
    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: dto.orderId },
        data: {
          driverId: userId,
          status: OrderStatus.OUT_FOR_DELIVERY,
          pickedUpAt: new Date(),
        },
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
              street: true,
              number: true,
              neighborhood: true,
              latitude: true,
              longitude: true,
            },
          },
          address: true,
        },
      }),
      this.prisma.driverProfile.update({
        where: { userId },
        data: {
          status: DriverStatus.ON_DELIVERY,
          isAvailable: false,
        },
      }),
    ]);

    // Notificar cliente que motorista aceitou a entrega
    await this.notifications.notifyOrderStatusChange(
      dto.orderId,
      NotificationEvent.DRIVER_ACCEPTED,
    );

    return updatedOrder;
  }

  async completeDelivery(userId: string, dto: CompleteDeliveryDto) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    // Verificar pedido
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.driverId !== userId) {
      throw new ForbiddenException('Este pedido não está atribuído a você');
    }

    if (order.status !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException('Pedido não está em rota de entrega');
    }

    // Completar entrega
    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: dto.orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      }),
      this.prisma.driverProfile.update({
        where: { userId },
        data: {
          status: DriverStatus.ONLINE,
          isAvailable: true,
          totalDeliveries: { increment: 1 },
        },
      }),
    ]);

    // Notificar cliente que pedido foi entregue
    await this.notifications.notifyOrderStatusChange(
      dto.orderId,
      NotificationEvent.ORDER_DELIVERED,
    );

    return updatedOrder;
  }

  // ===========================================
  // STATISTICS
  // ===========================================

  async getMyStats(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const [todayDeliveries, weekDeliveries, pendingOrders] = await Promise.all([
      this.prisma.order.count({
        where: {
          driverId: userId,
          status: OrderStatus.DELIVERED,
          deliveredAt: { gte: todayStart },
        },
      }),
      this.prisma.order.count({
        where: {
          driverId: userId,
          status: OrderStatus.DELIVERED,
          deliveredAt: { gte: weekStart },
        },
      }),
      this.prisma.order.count({
        where: {
          driverId: userId,
          status: OrderStatus.OUT_FOR_DELIVERY,
        },
      }),
    ]);

    return {
      totalDeliveries: profile.totalDeliveries,
      todayDeliveries,
      weekDeliveries,
      averageRating: profile.averageRating
        ? Number(profile.averageRating)
        : null,
      totalRatings: profile.totalRatings,
      balance: Number(profile.balance),
      pendingOrders,
    };
  }

  async getEarningsSummary(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayOrders, weekOrders, monthOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          driverId: userId,
          status: OrderStatus.DELIVERED,
          deliveredAt: { gte: todayStart },
        },
        select: { deliveryFee: true },
      }),
      this.prisma.order.findMany({
        where: {
          driverId: userId,
          status: OrderStatus.DELIVERED,
          deliveredAt: { gte: weekStart },
        },
        select: { deliveryFee: true },
      }),
      this.prisma.order.findMany({
        where: {
          driverId: userId,
          status: OrderStatus.DELIVERED,
          deliveredAt: { gte: monthStart },
        },
        select: { deliveryFee: true },
      }),
    ]);

    const today = todayOrders.reduce((sum, o) => sum + Number(o.deliveryFee || 0), 0);
    const thisWeek = weekOrders.reduce((sum, o) => sum + Number(o.deliveryFee || 0), 0);
    const thisMonth = monthOrders.reduce((sum, o) => sum + Number(o.deliveryFee || 0), 0);
    const totalEarnings = Number(profile.balance);
    const totalDeliveries = profile.totalDeliveries;
    const averagePerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

    return {
      today,
      thisWeek,
      thisMonth,
      totalEarnings,
      totalDeliveries,
      averagePerDelivery,
    };
  }

  async getDailyEarnings(userId: string, startDate?: string, endDate?: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) {
      start.setDate(start.getDate() - 30); // Últimos 30 dias por padrão
    }

    const orders = await this.prisma.order.findMany({
      where: {
        driverId: userId,
        status: OrderStatus.DELIVERED,
        deliveredAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        deliveryFee: true,
        deliveredAt: true,
      },
      orderBy: { deliveredAt: 'asc' },
    });

    // Agrupar por dia
    const dailyMap = new Map<string, { amount: number; deliveries: number }>();
    
    for (const order of orders) {
      if (order.deliveredAt) {
        const dateKey = order.deliveredAt.toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey) || { amount: 0, deliveries: 0 };
        existing.amount += Number(order.deliveryFee || 0);
        existing.deliveries += 1;
        dailyMap.set(dateKey, existing);
      }
    }

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      deliveries: data.deliveries,
    }));
  }

  // ===========================================
  // DELIVERY MANAGEMENT
  // ===========================================

  async getCurrentDelivery(userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        driverId: userId,
        status: {
          in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY],
        },
      },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        address: {
          select: {
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            latitude: true,
            longitude: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!order) {
      return null;
    }

    // Transformar para o formato esperado pelo frontend
    return {
      id: order.id,
      status: order.status,
      restaurant: {
        id: order.merchant?.id,
        name: order.merchant?.businessName,
        phone: null,
        address: {},
      },
      customer: {
        id: order.customer?.id,
        name: `${order.customer?.firstName} ${order.customer?.lastName}`,
        phone: order.customer?.phone,
      },
      deliveryAddress: order.address || {},
      items: order.items.map((item) => ({
        name: item.product?.name || 'Item',
        quantity: item.quantity,
        price: Number(item.unitPrice),
      })),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      estimatedDeliveryTime: null,
    };
  }

  async getDeliveryHistory(
    userId: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      driverId: userId,
      status: OrderStatus.DELIVERED,
    };

    if (startDate || endDate) {
      where.deliveredAt = {};
      if (startDate) where.deliveredAt.gte = new Date(startDate);
      if (endDate) where.deliveredAt.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          merchant: {
            select: { businessName: true },
          },
          customer: {
            select: { firstName: true, lastName: true },
          },
          review: {
            select: { driverRating: true },
          },
        },
        orderBy: { deliveredAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => ({
        id: order.id,
        orderId: order.id,
        restaurantName: order.merchant?.businessName || 'Restaurante',
        customerName: `${order.customer?.firstName} ${order.customer?.lastName}`,
        deliveryFee: Number(order.deliveryFee),
        status: order.status,
        completedAt: order.deliveredAt?.toISOString(),
        rating: order.review?.driverRating,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateDeliveryStatus(
    userId: string,
    orderId: string,
    status: 'PICKED_UP' | 'DELIVERED',
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        driverId: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const newStatus =
      status === 'PICKED_UP'
        ? OrderStatus.OUT_FOR_DELIVERY
        : OrderStatus.DELIVERED;

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
      },
    });

    return updatedOrder;
  }

  async cancelDelivery(userId: string, orderId: string, reason: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        driverId: userId,
        status: {
          in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY],
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado ou não pode ser cancelado');
    }

    // Remover o motorista e voltar para status READY_FOR_PICKUP
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.READY_FOR_PICKUP,
        driverId: null,
        notes: order.notes
          ? `${order.notes}\n[Cancelado pelo motorista: ${reason}]`
          : `[Cancelado pelo motorista: ${reason}]`,
      },
    });

    return updatedOrder;
  }

  // ===========================================
  // ADMIN OPERATIONS
  // ===========================================

  async listDrivers(query: DriverQueryDto) {
    const { status, vehicleType, isAvailable, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DriverProfileWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    const [drivers, total] = await Promise.all([
      this.prisma.driverProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.driverProfile.count({ where }),
    ]);

    return {
      data: drivers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDriverById(driverId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        locations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Motorista não encontrado');
    }

    // Contar entregas recentes
    const recentDeliveries = await this.prisma.order.count({
      where: {
        driverId: driver.userId,
        status: OrderStatus.DELIVERED,
        deliveredAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      },
    });

    return {
      ...driver,
      recentDeliveries,
    };
  }

  async approveDriver(driverId: string, dto: ApproveDriverDto) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Motorista não encontrado');
    }

    if (driver.status !== DriverStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Motorista não está pendente de aprovação');
    }

    const updated = await this.prisma.driverProfile.update({
      where: { id: driverId },
      data: {
        status: DriverStatus.APPROVED,
        approvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  }

  async suspendDriver(driverId: string, dto: SuspendDriverDto) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Motorista não encontrado');
    }

    if (driver.status === DriverStatus.SUSPENDED) {
      throw new BadRequestException('Motorista já está suspenso');
    }

    // Se estiver em entrega, não permitir
    if (driver.status === DriverStatus.ON_DELIVERY) {
      throw new BadRequestException(
        'Não é possível suspender motorista em entrega ativa',
      );
    }

    const updated = await this.prisma.driverProfile.update({
      where: { id: driverId },
      data: {
        status: DriverStatus.SUSPENDED,
        isAvailable: false,
        suspendedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Remover do cache de disponíveis
    await this.redis.del(`driver:available:${driverId}`);

    return updated;
  }

  async activateDriver(driverId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Motorista não encontrado');
    }

    if (driver.status !== DriverStatus.SUSPENDED) {
      throw new BadRequestException('Motorista não está suspenso');
    }

    const updated = await this.prisma.driverProfile.update({
      where: { id: driverId },
      data: {
        status: DriverStatus.APPROVED,
        suspendedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  }

  async rejectDriver(driverId: string, dto: RejectDriverDto) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Motorista não encontrado');
    }

    if (driver.status !== DriverStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Motorista não está pendente de aprovação');
    }

    // Soft delete - marcar como suspenso com razão
    const updated = await this.prisma.driverProfile.update({
      where: { id: driverId },
      data: {
        status: DriverStatus.SUSPENDED,
        suspendedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  }

  // ===========================================
  // NEARBY DRIVERS (para matching de pedidos)
  // ===========================================

  async findNearbyDrivers(query: NearbyDriversQueryDto) {
    const { latitude, longitude, radiusKm = 10, vehicleType, limit = 10 } = query;

    // Calcular bounding box aproximado
    // 1 grau de latitude ≈ 111km
    // 1 grau de longitude ≈ 111km * cos(latitude)
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    const where: Prisma.DriverProfileWhereInput = {
      isAvailable: true,
      status: DriverStatus.ONLINE,
      currentLat: {
        gte: latitude - latDelta,
        lte: latitude + latDelta,
      },
      currentLng: {
        gte: longitude - lngDelta,
        lte: longitude + lngDelta,
      },
    };

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    const drivers = await this.prisma.driverProfile.findMany({
      where,
      select: {
        id: true,
        userId: true,
        vehicleType: true,
        averageRating: true,
        totalDeliveries: true,
        currentLat: true,
        currentLng: true,
      },
      take: limit * 2, // Pegar mais para filtrar por distância real
    });

    // Calcular distância real e filtrar
    const driversWithDistance = drivers
      .map((driver) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          Number(driver.currentLat),
          Number(driver.currentLng),
        );
        return {
          ...driver,
          distanceKm: Math.round(distance * 100) / 100,
        };
      })
      .filter((d) => d.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return driversWithDistance;
  }

  // Fórmula de Haversine para calcular distância
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
