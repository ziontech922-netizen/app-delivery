import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Prisma, DriverStatus, OrderStatus, VehicleType } from '@prisma/client';
import { PrismaService } from '@shared/prisma/prisma.service';
import { RedisService } from '@shared/redis/redis.service';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { v4 as uuidv4 } from 'uuid';
import {
  FindNearbyDriversDto,
  MatchDriverForOrderDto,
  NearbyDriverResult,
} from './dto/find-drivers.dto';
import {
  DeliveryOffer,
  DeliveryOfferStatus,
  DeliveryOfferResult,
  MatchingResult,
  RespondToOfferDto,
} from './dto/delivery-offer.dto';

// Constantes de configuração
const DEFAULT_SEARCH_RADIUS_KM = 5;
const MAX_SEARCH_RADIUS_KM = 20;
const OFFER_TIMEOUT_SECONDS = 30;
const AVERAGE_SPEED_KMH = 25; // Velocidade média para estimar tempo
const EARTH_RADIUS_KM = 6371;

// Keys Redis
const OFFER_KEY_PREFIX = 'delivery:offer:';
const ORDER_OFFERS_KEY_PREFIX = 'delivery:order:offers:';
const DRIVER_CURRENT_OFFER_KEY = 'delivery:driver:current_offer:';
const ACTIVE_MATCHING_KEY = 'delivery:matching:active:';

@Injectable()
export class DriverMatchingService {
  private readonly logger = new Logger(DriverMatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(forwardRef(() => RealtimeService))
    private readonly realtime: RealtimeService,
  ) {}

  // ===========================================
  // HAVERSINE DISTANCE CALCULATION
  // ===========================================

  /**
   * Calcula a distância entre dois pontos usando a fórmula de Haversine
   * @returns Distância em quilômetros
   */
  calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = EARTH_RADIUS_KM * c;

    return Math.round(distance * 100) / 100; // Arredondar para 2 casas decimais
  }

  /**
   * Estima o tempo de viagem baseado na distância
   * @returns Tempo em minutos
   */
  estimateTravelTime(distanceKm: number): number {
    // Tempo base + tempo de deslocamento
    const baseTimeMinutes = 3; // Tempo para preparar saída
    const travelTimeMinutes = (distanceKm / AVERAGE_SPEED_KMH) * 60;
    return Math.ceil(baseTimeMinutes + travelTimeMinutes);
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // ===========================================
  // FIND NEARBY DRIVERS
  // ===========================================

  /**
   * Busca drivers próximos ordenados por distância (mais próximo primeiro)
   */
  async findNearbyDrivers(dto: FindNearbyDriversDto): Promise<NearbyDriverResult[]> {
    const {
      latitude,
      longitude,
      radiusKm = DEFAULT_SEARCH_RADIUS_KM,
      vehicleType,
      limit = 10,
    } = dto;

    // Calcular bounding box para filtro inicial (otimização)
    const latDelta = radiusKm / 111; // 1 grau ≈ 111km
    const lngDelta = radiusKm / (111 * Math.cos(this.toRadians(latitude)));

    // Construir query com filtros
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
      // Verificar se localização não está stale (últimos 10 minutos)
      lastLocationAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000),
      },
    };

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    // Buscar drivers candidatos
    const candidates = await this.prisma.driverProfile.findMany({
      where,
      select: {
        id: true,
        userId: true,
        vehicleType: true,
        averageRating: true,
        totalDeliveries: true,
        currentLat: true,
        currentLng: true,
        maxDeliveryRadius: true,
      },
      take: limit * 3, // Pegar mais para compensar filtro de distância
    });

    // Calcular distância real e filtrar/ordenar
    const driversWithDistance = candidates
      .map((driver) => {
        const distanceKm = this.calculateHaversineDistance(
          latitude,
          longitude,
          Number(driver.currentLat),
          Number(driver.currentLng),
        );

        return {
          id: driver.id,
          userId: driver.userId,
          vehicleType: driver.vehicleType,
          averageRating: Number(driver.averageRating) || 5.0,
          totalDeliveries: driver.totalDeliveries,
          currentLat: Number(driver.currentLat),
          currentLng: Number(driver.currentLng),
          distanceKm,
          estimatedTimeMinutes: this.estimateTravelTime(distanceKm),
        };
      })
      // Filtrar por raio e raio máximo do driver
      .filter((d) => {
        const driverMaxRadius = d.totalDeliveries > 0 ? d.distanceKm : radiusKm;
        return d.distanceKm <= radiusKm && d.distanceKm <= (driverMaxRadius || MAX_SEARCH_RADIUS_KM);
      })
      // Ordenar por distância (mais próximo primeiro)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      // Limitar resultados
      .slice(0, limit);

    return driversWithDistance;
  }

  // ===========================================
  // DELIVERY OFFER MANAGEMENT
  // ===========================================

  /**
   * Cria uma oferta de entrega para um driver específico
   */
  async createDeliveryOffer(
    orderId: string,
    driverId: string,
    distanceKm: number,
  ): Promise<DeliveryOfferResult> {
    // Verificar se já existe matching ativo para este pedido
    const activeMatching = await this.redis.get(ACTIVE_MATCHING_KEY + orderId);
    if (!activeMatching) {
      return { success: false, error: 'Matching não está ativo para este pedido' };
    }

    // Verificar se driver já tem oferta ativa
    const driverCurrentOffer = await this.redis.get(DRIVER_CURRENT_OFFER_KEY + driverId);
    if (driverCurrentOffer) {
      return { success: false, error: 'Driver já tem oferta ativa' };
    }

    // Buscar dados do pedido
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: {
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
          select: { productName: true, quantity: true },
        },
      },
    });

    if (!order) {
      return { success: false, error: 'Pedido não encontrado' };
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      return { success: false, error: 'Pedido não está pronto para coleta' };
    }

    if (order.driverId) {
      return { success: false, error: 'Pedido já atribuído a outro driver' };
    }

    // Buscar userId do driver
    const driverProfile = await this.prisma.driverProfile.findUnique({
      where: { id: driverId },
      select: { userId: true },
    });

    if (!driverProfile) {
      return { success: false, error: 'Driver não encontrado' };
    }

    // Criar oferta
    const offerId = uuidv4();
    const expiresAt = new Date(Date.now() + OFFER_TIMEOUT_SECONDS * 1000);

    const offer: DeliveryOffer = {
      id: offerId,
      orderId,
      driverId,
      driverUserId: driverProfile.userId,
      status: DeliveryOfferStatus.PENDING,
      distanceKm,
      estimatedEarnings: Number(order.deliveryFee) || 5.0,
      expiresAt,
      createdAt: new Date(),
      orderDetails: {
        orderNumber: order.orderNumber,
        merchantName: order.merchant.businessName,
        merchantAddress: `${order.merchant.street}, ${order.merchant.number} - ${order.merchant.neighborhood}`,
        deliveryAddress: `${order.address.street}, ${order.address.number} - ${order.address.neighborhood}`,
        itemCount: order.items.reduce((acc, item) => acc + item.quantity, 0),
        totalAmount: Number(order.total),
        deliveryFee: Number(order.deliveryFee) || 5.0,
      },
      pickupLocation: {
        latitude: Number(order.merchant.latitude) || 0,
        longitude: Number(order.merchant.longitude) || 0,
      },
      deliveryLocation: {
        latitude: Number(order.address.latitude) || 0,
        longitude: Number(order.address.longitude) || 0,
      },
    };

    // Salvar no Redis com TTL
    await this.redis.set(
      OFFER_KEY_PREFIX + offerId,
      JSON.stringify(offer),
      OFFER_TIMEOUT_SECONDS + 10, // TTL um pouco maior que timeout
    );

    // Registrar oferta ativa para o driver
    await this.redis.set(
      DRIVER_CURRENT_OFFER_KEY + driverId,
      offerId,
      OFFER_TIMEOUT_SECONDS + 10,
    );

    // Adicionar à lista de ofertas do pedido
    await this.redis.lpush(ORDER_OFFERS_KEY_PREFIX + orderId, offerId);

    // Enviar oferta via WebSocket para o driver
    await this.realtime.emitDeliveryOffer(driverProfile.userId, {
      id: offerId,
      orderId,
      orderNumber: order.orderNumber,
      merchantName: order.merchant.businessName,
      pickupAddress: offer.orderDetails.merchantAddress,
      deliveryAddress: offer.orderDetails.deliveryAddress,
      distanceKm,
      estimatedEarnings: offer.estimatedEarnings,
      expiresAt,
    });

    this.logger.log(
      `Oferta ${offerId} criada e enviada para driver ${driverId}, pedido ${orderId}`,
    );

    return { success: true, offer };
  }

  /**
   * Processa resposta do driver a uma oferta
   */
  async respondToOffer(
    driverUserId: string,
    dto: RespondToOfferDto,
  ): Promise<MatchingResult> {
    const startTime = Date.now();
    const { offerId, accepted, declineReason } = dto;

    // Buscar oferta
    const offerData = await this.redis.get(OFFER_KEY_PREFIX + offerId);
    if (!offerData) {
      return {
        success: false,
        error: 'Oferta não encontrada ou expirada',
        driversContacted: 0,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    const offer: DeliveryOffer = JSON.parse(offerData);

    // Verificar se é o driver correto
    if (offer.driverUserId !== driverUserId) {
      return {
        success: false,
        error: 'Oferta não pertence a este driver',
        driversContacted: 0,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    // Verificar se oferta ainda está pendente
    if (offer.status !== DeliveryOfferStatus.PENDING) {
      return {
        success: false,
        error: `Oferta já foi ${offer.status}`,
        driversContacted: 0,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    // Verificar se expirou
    if (new Date() > new Date(offer.expiresAt)) {
      await this.expireOffer(offerId);
      return {
        success: false,
        error: 'Oferta expirada',
        driversContacted: 0,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    if (accepted) {
      return this.acceptOffer(offer, startTime);
    } else {
      return this.declineOffer(offer, declineReason, startTime);
    }
  }

  /**
   * Aceita uma oferta de entrega
   */
  private async acceptOffer(
    offer: DeliveryOffer,
    startTime: number,
  ): Promise<MatchingResult> {
    // Verificar novamente se pedido ainda está disponível (race condition)
    const order = await this.prisma.order.findUnique({
      where: { id: offer.orderId },
      select: { id: true, status: true, driverId: true },
    });

    if (!order) {
      return {
        success: false,
        error: 'Pedido não encontrado',
        driversContacted: 1,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    if (order.driverId) {
      return {
        success: false,
        error: 'Pedido já foi atribuído a outro driver',
        driversContacted: 1,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      return {
        success: false,
        error: 'Pedido não está mais disponível para coleta',
        driversContacted: 1,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    try {
      // Atribuir driver ao pedido (transação)
      await this.prisma.$transaction(async (tx) => {
        // Atualizar pedido
        await tx.order.update({
          where: { id: offer.orderId },
          data: {
            driverId: offer.driverId,
            status: OrderStatus.OUT_FOR_DELIVERY,
          },
        });

        // Atualizar status do driver
        await tx.driverProfile.update({
          where: { id: offer.driverId },
          data: {
            status: DriverStatus.ON_DELIVERY,
            isAvailable: false,
          },
        });
      });

      // Atualizar oferta no Redis
      offer.status = DeliveryOfferStatus.ACCEPTED;
      offer.respondedAt = new Date();
      await this.redis.set(
        OFFER_KEY_PREFIX + offer.id,
        JSON.stringify(offer),
        300, // Manter por 5 minutos para auditoria
      );

      // Limpar matching ativo
      await this.cleanupMatching(offer.orderId, offer.driverId);

      // Notificar driver que a oferta foi aceita
      await this.realtime.emitOfferAccepted(offer.driverUserId, offer.orderId, {
        orderNumber: offer.orderDetails.orderNumber,
        merchantName: offer.orderDetails.merchantName,
        pickupAddress: offer.orderDetails.merchantAddress,
        deliveryAddress: offer.orderDetails.deliveryAddress,
      });

      // Buscar dados do driver para notificar merchant
      const driverProfile = await this.prisma.driverProfile.findUnique({
        where: { id: offer.driverId },
        include: { user: { select: { firstName: true, lastName: true, phone: true } } },
      });

      if (driverProfile) {
        // Buscar merchantId do pedido
        const orderWithMerchant = await this.prisma.order.findUnique({
          where: { id: offer.orderId },
          select: { merchantId: true },
        });

        if (orderWithMerchant) {
          await this.realtime.emitDriverAssigned(
            orderWithMerchant.merchantId,
            offer.orderId,
            offer.orderDetails.orderNumber,
            {
              name: `${driverProfile.user.firstName} ${driverProfile.user.lastName}`,
              phone: driverProfile.user.phone || undefined,
              vehicleType: driverProfile.vehicleType,
            },
          );
        }
      }

      this.logger.log(
        `Driver ${offer.driverId} aceitou pedido ${offer.orderId}`,
      );

      return {
        success: true,
        driverId: offer.driverId,
        driverUserId: offer.driverUserId,
        offerId: offer.id,
        driversContacted: 1,
        timeElapsedMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao aceitar oferta ${offer.id}: ${error}`,
      );
      return {
        success: false,
        error: 'Erro interno ao processar aceite',
        driversContacted: 1,
        timeElapsedMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Recusa uma oferta de entrega
   */
  private async declineOffer(
    offer: DeliveryOffer,
    reason: string | undefined,
    startTime: number,
  ): Promise<MatchingResult> {
    // Atualizar oferta
    offer.status = DeliveryOfferStatus.DECLINED;
    offer.respondedAt = new Date();
    await this.redis.set(
      OFFER_KEY_PREFIX + offer.id,
      JSON.stringify(offer),
      300,
    );

    // Liberar driver para receber novas ofertas
    await this.redis.del(DRIVER_CURRENT_OFFER_KEY + offer.driverId);

    this.logger.log(
      `Driver ${offer.driverId} recusou pedido ${offer.orderId}: ${reason || 'sem motivo'}`,
    );

    return {
      success: false,
      error: 'Driver recusou a oferta',
      driversContacted: 1,
      timeElapsedMs: Date.now() - startTime,
    };
  }

  /**
   * Expira uma oferta
   */
  async expireOffer(offerId: string): Promise<void> {
    const offerData = await this.redis.get(OFFER_KEY_PREFIX + offerId);
    if (!offerData) return;

    const offer: DeliveryOffer = JSON.parse(offerData);
    offer.status = DeliveryOfferStatus.EXPIRED;

    await this.redis.set(
      OFFER_KEY_PREFIX + offerId,
      JSON.stringify(offer),
      60, // Manter por 1 minuto
    );

    // Liberar driver
    await this.redis.del(DRIVER_CURRENT_OFFER_KEY + offer.driverId);

    this.logger.log(`Oferta ${offerId} expirada`);
  }

  // ===========================================
  // MATCHING ORCHESTRATION
  // ===========================================

  /**
   * Inicia o processo de matching para um pedido
   * Busca drivers próximos e envia ofertas sequencialmente
   */
  async startMatchingForOrder(dto: MatchDriverForOrderDto): Promise<MatchingResult> {
    const startTime = Date.now();
    const { orderId, radiusKm = DEFAULT_SEARCH_RADIUS_KM, vehicleType } = dto;

    // Verificar se já existe matching ativo
    const existingMatching = await this.redis.get(ACTIVE_MATCHING_KEY + orderId);
    if (existingMatching) {
      return {
        success: false,
        error: 'Matching já em andamento para este pedido',
        driversContacted: 0,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    // Buscar pedido
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: {
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException('Pedido não está pronto para coleta');
    }

    if (order.driverId) {
      throw new ConflictException('Pedido já tem driver atribuído');
    }

    if (!order.merchant.latitude || !order.merchant.longitude) {
      throw new BadRequestException('Restaurante não tem coordenadas configuradas');
    }

    // Marcar matching como ativo
    await this.redis.set(
      ACTIVE_MATCHING_KEY + orderId,
      JSON.stringify({
        startedAt: new Date(),
        radiusKm,
        vehicleType,
      }),
      300, // TTL 5 minutos
    );

    // Buscar drivers próximos
    const nearbyDrivers = await this.findNearbyDrivers({
      latitude: Number(order.merchant.latitude),
      longitude: Number(order.merchant.longitude),
      radiusKm,
      vehicleType,
      limit: 20,
    });

    if (nearbyDrivers.length === 0) {
      await this.redis.del(ACTIVE_MATCHING_KEY + orderId);
      return {
        success: false,
        error: 'Nenhum driver disponível na região',
        driversContacted: 0,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    this.logger.log(
      `Encontrados ${nearbyDrivers.length} drivers para pedido ${orderId}`,
    );

    // Enviar oferta para o primeiro driver (mais próximo)
    const firstDriver = nearbyDrivers[0];
    const offerResult = await this.createDeliveryOffer(
      orderId,
      firstDriver.id,
      firstDriver.distanceKm,
    );

    if (!offerResult.success) {
      return {
        success: false,
        error: offerResult.error,
        driversContacted: 1,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    // Retornar com oferta criada (o processo continua assíncrono)
    return {
      success: true,
      offerId: offerResult.offer?.id,
      driversContacted: 1,
      timeElapsedMs: Date.now() - startTime,
    };
  }

  /**
   * Continua o matching após recusa ou expiração
   * Envia oferta para o próximo driver da lista
   */
  async continueMatchingForOrder(orderId: string): Promise<MatchingResult> {
    const startTime = Date.now();

    // Verificar se matching ainda está ativo
    const matchingData = await this.redis.get(ACTIVE_MATCHING_KEY + orderId);
    if (!matchingData) {
      return {
        success: false,
        error: 'Matching não está mais ativo',
        driversContacted: 0,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    const matching = JSON.parse(matchingData);

    // Verificar se pedido ainda está disponível
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: { latitude: true, longitude: true },
        },
      },
    });

    if (!order || order.status !== OrderStatus.READY_FOR_PICKUP || order.driverId) {
      await this.redis.del(ACTIVE_MATCHING_KEY + orderId);
      return {
        success: false,
        error: 'Pedido não está mais disponível',
        driversContacted: 0,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    // Buscar ofertas já enviadas
    const sentOffers = await this.redis.lrange(ORDER_OFFERS_KEY_PREFIX + orderId, 0, -1);
    const excludeDriverIds: string[] = [];

    for (const offerId of sentOffers) {
      const offerData = await this.redis.get(OFFER_KEY_PREFIX + offerId);
      if (offerData) {
        const offer: DeliveryOffer = JSON.parse(offerData);
        excludeDriverIds.push(offer.driverId);
      }
    }

    // Buscar novos drivers
    const nearbyDrivers = await this.findNearbyDrivers({
      latitude: Number(order.merchant.latitude),
      longitude: Number(order.merchant.longitude),
      radiusKm: matching.radiusKm,
      vehicleType: matching.vehicleType,
      limit: 20,
    });

    // Filtrar drivers que já receberam oferta
    const availableDrivers = nearbyDrivers.filter(
      (d) => !excludeDriverIds.includes(d.id),
    );

    if (availableDrivers.length === 0) {
      await this.redis.del(ACTIVE_MATCHING_KEY + orderId);
      return {
        success: false,
        error: 'Todos os drivers da região já foram contatados',
        driversContacted: excludeDriverIds.length,
        timeElapsedMs: Date.now() - startTime,
      };
    }

    // Enviar oferta para o próximo driver mais próximo
    const nextDriver = availableDrivers[0];
    const offerResult = await this.createDeliveryOffer(
      orderId,
      nextDriver.id,
      nextDriver.distanceKm,
    );

    return {
      success: offerResult.success,
      offerId: offerResult.offer?.id,
      error: offerResult.error,
      driversContacted: excludeDriverIds.length + 1,
      timeElapsedMs: Date.now() - startTime,
    };
  }

  /**
   * Cancela o matching ativo para um pedido
   */
  async cancelMatching(orderId: string): Promise<void> {
    await this.cleanupMatching(orderId);
    this.logger.log(`Matching cancelado para pedido ${orderId}`);
  }

  /**
   * Verifica ofertas expiradas e continua o matching
   */
  async processExpiredOffers(): Promise<void> {
    // Este método seria chamado por um cron job ou task scheduler
    // Para verificar ofertas expiradas e continuar o matching
    this.logger.debug('Processando ofertas expiradas...');
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================

  private async cleanupMatching(
    orderId: string,
    acceptedDriverId?: string,
  ): Promise<void> {
    // Remover matching ativo
    await this.redis.del(ACTIVE_MATCHING_KEY + orderId);

    // Limpar lista de ofertas
    const sentOffers = await this.redis.lrange(ORDER_OFFERS_KEY_PREFIX + orderId, 0, -1);
    for (const offerId of sentOffers) {
      await this.redis.del(OFFER_KEY_PREFIX + offerId);
    }
    await this.redis.del(ORDER_OFFERS_KEY_PREFIX + orderId);

    // Se driver aceito, limpar referência
    if (acceptedDriverId) {
      await this.redis.del(DRIVER_CURRENT_OFFER_KEY + acceptedDriverId);
    }
  }

  /**
   * Obtém oferta ativa do driver
   */
  async getDriverCurrentOffer(driverUserId: string): Promise<DeliveryOffer | null> {
    // Buscar driverId pelo userId
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId: driverUserId },
      select: { id: true },
    });

    if (!profile) return null;

    const offerId = await this.redis.get(DRIVER_CURRENT_OFFER_KEY + profile.id);
    if (!offerId) return null;

    const offerData = await this.redis.get(OFFER_KEY_PREFIX + offerId);
    if (!offerData) return null;

    const offer: DeliveryOffer = JSON.parse(offerData);

    // Verificar se expirou
    if (new Date() > new Date(offer.expiresAt)) {
      await this.expireOffer(offerId);
      return null;
    }

    return offer;
  }

  /**
   * Obtém estatísticas de matching
   */
  async getMatchingStats(): Promise<{
    activeMatchings: number;
    pendingOffers: number;
  }> {
    // Implementar contagem de matchings e ofertas ativos
    return {
      activeMatchings: 0,
      pendingOffers: 0,
    };
  }
}
