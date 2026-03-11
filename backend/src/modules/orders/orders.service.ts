import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, MerchantStatus, PaymentMethod } from '@prisma/client';
import { PrismaService } from '@shared/prisma';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { PaymentsService } from '@modules/payments/payments.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { NotificationEvent } from '@modules/notifications/dto/notification.dto';
import { CouponsService } from '@modules/coupons/coupons.service';
import { DriverMatchingService } from '@modules/driver-matching/driver-matching.service';
import { CreateOrderDto, UpdateOrderStatusDto, CreateAddressDto } from './dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => RealtimeService))
    private readonly realtime: RealtimeService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly payments: PaymentsService,
    private readonly notifications: NotificationsService,
    @Inject(forwardRef(() => CouponsService))
    private readonly coupons: CouponsService,
    @Inject(forwardRef(() => DriverMatchingService))
    private readonly driverMatching: DriverMatchingService,
  ) {}

  // =============================================
  // CUSTOMER - ADDRESSES
  // =============================================

  /**
   * Cria endereço para o customer
   */
  async createAddress(userId: string, dto: CreateAddressDto) {
    // Se for default, remover default dos outros
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        userId,
        label: dto.label,
        street: dto.street,
        number: dto.number,
        complement: dto.complement,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state.toUpperCase(),
        zipCode: dto.zipCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDefault: dto.isDefault ?? false,
      },
    });

    return address;
  }

  /**
   * Lista endereços do customer
   */
  async findAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // =============================================
  // CUSTOMER - ORDERS
  // =============================================

  /**
   * Cria pedido
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    // Validar merchant
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: dto.merchantId },
    });

    if (!merchant || merchant.status !== MerchantStatus.ACTIVE) {
      throw new NotFoundException('Estabelecimento não encontrado ou inativo');
    }

    if (!merchant.isOpen) {
      throw new BadRequestException('Estabelecimento está fechado');
    }

    // Validar endereço
    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
    });

    if (!address || address.userId !== userId) {
      throw new NotFoundException('Endereço não encontrado');
    }

    // Buscar produtos e validar
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        merchantId: dto.merchantId,
        isAvailable: true,
        deletedAt: null,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Um ou mais produtos não estão disponíveis');
    }

    // Mapear produtos por ID
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calcular valores
    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const totalPrice = Number(product.price) * item.quantity;
      subtotal += totalPrice;

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice,
        notes: item.notes,
      };
    });

    // Validar pedido mínimo
    if (subtotal < Number(merchant.minimumOrder)) {
      throw new BadRequestException(
        `Pedido mínimo é R$ ${Number(merchant.minimumOrder).toFixed(2)}`,
      );
    }

    const deliveryFee = Number(merchant.deliveryFee);
    
    // Aplicar cupom se fornecido
    let discount = 0;
    let couponCode: string | null = null;
    let couponId: string | null = null;

    if (dto.couponCode) {
      const couponResult = await this.coupons.validateCoupon(
        {
          code: dto.couponCode,
          merchantId: dto.merchantId,
          subtotal,
        },
        userId,
      );

      if (!couponResult.valid) {
        throw new BadRequestException(couponResult.error || 'Cupom inválido');
      }

      discount = couponResult.discount || 0;
      couponCode = couponResult.code || null;

      // Get coupon ID for relation
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: couponCode! },
        select: { id: true },
      });
      couponId = coupon?.id || null;

      this.logger.log(`Cupom ${couponCode} aplicado: desconto de R$ ${discount}`);
    }

    const total = subtotal + deliveryFee - discount;

    // Gerar número do pedido
    const orderNumber = await this.generateOrderNumber();

    // Criar pedido com itens
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: userId,
        merchantId: dto.merchantId,
        addressId: dto.addressId,
        couponId,
        couponCode,
        status: OrderStatus.PENDING,
        subtotal,
        deliveryFee,
        discount,
        total,
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        notes: dto.notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
        merchant: {
          select: { businessName: true, tradeName: true },
        },
        address: true,
      },
    });

    // Incrementar uso do cupom
    if (couponCode) {
      await this.coupons.applyCoupon(couponCode);
    }

    this.logger.log(`Pedido criado: ${order.orderNumber} por customer ${userId}`);

    // Emitir evento em tempo real (após commit no banco)
    await this.realtime.emitOrderCreated(
      order.id,
      order.orderNumber,
      userId,
      dto.merchantId,
      total,
      orderItems.length,
    );

    // Notificar merchant sobre novo pedido
    await this.notifications.notifyMerchantNewOrder(order.id);

    return this.sanitizeOrder(order);
  }

  /**
   * Lista pedidos do customer
   */
  async findCustomerOrders(userId: string, options: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
  } = {}) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where = {
      customerId: userId,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          merchant: {
            select: { businessName: true, tradeName: true, logoUrl: true },
          },
          items: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => this.sanitizeOrder(o)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Busca pedido por ID (customer)
   */
  async findCustomerOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: { businessName: true, tradeName: true, logoUrl: true },
        },
        items: true,
        address: true,
      },
    });

    if (!order || order.customerId !== userId) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return this.sanitizeOrder(order);
  }

  // =============================================
  // MERCHANT - ORDERS
  // =============================================

  /**
   * Lista pedidos do merchant
   */
  async findMerchantOrders(userId: string, options: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
  } = {}) {
    const merchant = await this.getMerchantByUserId(userId);
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where = {
      merchantId: merchant.id,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: {
            select: { firstName: true, lastName: true, phone: true },
          },
          items: true,
          address: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => this.sanitizeOrder(o)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Lista pedidos pendentes do merchant
   */
  async findPendingOrders(userId: string) {
    const merchant = await this.getMerchantByUserId(userId);

    const orders = await this.prisma.order.findMany({
      where: {
        merchantId: merchant.id,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING],
        },
      },
      include: {
        customer: {
          select: { firstName: true, lastName: true, phone: true },
        },
        items: true,
        address: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return orders.map((o) => this.sanitizeOrder(o));
  }

  /**
   * Busca pedido por ID (merchant)
   */
  async findMerchantOrderById(userId: string, orderId: string) {
    const merchant = await this.getMerchantByUserId(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: { firstName: true, lastName: true, phone: true, email: true },
        },
        items: true,
        address: true,
      },
    });

    if (!order || order.merchantId !== merchant.id) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return this.sanitizeOrder(order);
  }

  /**
   * Atualiza status do pedido (merchant)
   */
  async updateOrderStatus(userId: string, orderId: string, dto: UpdateOrderStatusDto) {
    const merchant = await this.getMerchantByUserId(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.merchantId !== merchant.id) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Validar transição de status
    this.validateStatusTransition(order.status, dto.status);

    // Validar pagamento para confirmação
    if (dto.status === OrderStatus.CONFIRMED) {
      const paymentCheck = await this.payments.canConfirmOrder(orderId);
      if (!paymentCheck.canConfirm) {
        throw new BadRequestException(
          `Não é possível confirmar pedido: ${paymentCheck.reason}`,
        );
      }
    }

    // Preparar dados de atualização
    const updateData: any = { status: dto.status };

    // Adicionar timestamps baseado no status
    switch (dto.status) {
      case OrderStatus.CONFIRMED:
        updateData.confirmedAt = new Date();
        break;
      case OrderStatus.PREPARING:
        updateData.preparingAt = new Date();
        break;
      case OrderStatus.READY_FOR_PICKUP:
        updateData.readyAt = new Date();
        break;
      case OrderStatus.OUT_FOR_DELIVERY:
        updateData.pickedUpAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        updateData.deliveredAt = new Date();
        updateData.paymentStatus = PaymentStatus.COMPLETED;
        break;
      case OrderStatus.CANCELLED:
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = dto.cancellationReason;
        updateData.paymentStatus = PaymentStatus.REFUNDED;
        break;
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: true,
        customer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    this.logger.log(`Pedido ${orderId} atualizado para ${dto.status}`);

    // Iniciar matching de driver quando pedido estiver pronto
    if (dto.status === OrderStatus.READY_FOR_PICKUP && !order.driverId) {
      this.startDriverMatching(orderId).catch((err) => {
        this.logger.error(`Erro ao iniciar matching para pedido ${orderId}: ${err.message}`);
      });
    }

    // Emitir evento em tempo real (após commit no banco)
    if (dto.status === OrderStatus.CANCELLED) {
      await this.realtime.emitOrderCancelled(
        orderId,
        order.orderNumber,
        order.customerId,
        order.merchantId,
        'merchant',
        dto.cancellationReason,
      );
      // Notificar cliente sobre cancelamento
      await this.notifications.notifyOrderStatusChange(
        orderId,
        NotificationEvent.ORDER_CANCELLED,
        dto.cancellationReason,
      );
    } else {
      await this.realtime.emitOrderStatusUpdated(
        orderId,
        order.orderNumber,
        order.customerId,
        order.merchantId,
        order.status,
        dto.status,
      );
      // Enviar notificação baseada no novo status
      await this.sendStatusNotification(orderId, dto.status);
    }

    return this.sanitizeOrder(updated);
  }

  /**
   * Send notification based on order status
   */
  private async sendStatusNotification(
    orderId: string,
    status: OrderStatus,
  ): Promise<void> {
    const eventMap: Partial<Record<OrderStatus, NotificationEvent>> = {
      [OrderStatus.CONFIRMED]: NotificationEvent.ORDER_CONFIRMED,
      [OrderStatus.PREPARING]: NotificationEvent.ORDER_PREPARING,
      [OrderStatus.READY_FOR_PICKUP]: NotificationEvent.ORDER_READY,
      [OrderStatus.OUT_FOR_DELIVERY]: NotificationEvent.DRIVER_ACCEPTED,
      [OrderStatus.DELIVERED]: NotificationEvent.ORDER_DELIVERED,
    };

    const event = eventMap[status];
    if (event) {
      await this.notifications.notifyOrderStatusChange(orderId, event);
    }
  }

  // =============================================
  // HELPERS
  // =============================================

  private async getMerchantByUserId(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (!merchant) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return merchant;
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  }

  private validateStatusTransition(current: OrderStatus, next: OrderStatus) {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
      [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Não é possível alterar status de ${current} para ${next}`,
      );
    }
  }

  private sanitizeOrder(order: any) {
    // Remove IDs internos sensíveis se necessário
    return order;
  }

  /**
   * Inicia busca de driver para o pedido
   */
  private async startDriverMatching(orderId: string): Promise<void> {
    try {
      const result = await this.driverMatching.startMatchingForOrder({
        orderId,
        radiusKm: 5, // Raio padrão de 5km
      });

      if (result.success) {
        this.logger.log(
          `Matching iniciado para pedido ${orderId}, oferta criada: ${result.offerId}`,
        );
      } else {
        this.logger.warn(
          `Matching não iniciado para pedido ${orderId}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Falha ao iniciar matching para pedido ${orderId}: ${error}`,
      );
    }
  }
}
