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
} from './dto';

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

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
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    return profile;
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
          },
        },
      },
    });

    return updated;
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

    const newStatus = dto.isAvailable
      ? DriverStatus.ONLINE
      : DriverStatus.OFFLINE;

    const updateData: Prisma.DriverProfileUpdateInput = {
      isAvailable: dto.isAvailable,
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
    if (dto.isAvailable) {
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

    return updated;
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
