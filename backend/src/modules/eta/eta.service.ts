import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, DriverStatus } from '@prisma/client';
import { PrismaService } from '@shared/prisma/prisma.service';
import { RedisService } from '@shared/redis/redis.service';
import {
  CalculateEtaDto,
  EtaCalculationResult,
  MerchantEtaResult,
  OrderEtaResult,
  EtaBreakdown,
} from './dto/eta.dto';

// =============================================
// CONSTANTS
// =============================================

// Raio da Terra em km
const EARTH_RADIUS_KM = 6371;

// Velocidades médias por tipo de veículo (km/h)
const VEHICLE_SPEEDS = {
  BICYCLE: 12,
  MOTORCYCLE: 25,
  CAR: 20, // Trânsito urbano
  VAN: 18,
  DEFAULT: 20,
};

// Fatores de tempo médio (multiplicadores)
const TIME_FACTORS = {
  RUSH_HOUR: 1.5, // Horário de pico
  NORMAL: 1.0,
  LATE_NIGHT: 0.8, // Madrugada
};

// Tempos fixos em minutos
const FIXED_TIMES = {
  DRIVER_PICKUP_TIME: 3, // Tempo para pegar pedido no restaurante
  DRIVER_DROPOFF_TIME: 2, // Tempo para entregar ao cliente
  ORDER_PREPARATION_BUFFER: 5, // Buffer adicional de preparo
  MIN_DELIVERY_TIME: 15, // Tempo mínimo de entrega
};

// Cache keys
const MERCHANT_ETA_CACHE_PREFIX = 'eta:merchant:';
const ETA_CACHE_TTL = 300; // 5 minutos

@Injectable()
export class EtaService {
  private readonly logger = new Logger(EtaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // =============================================
  // HAVERSINE DISTANCE CALCULATION
  // =============================================

  /**
   * Calcula distância entre dois pontos usando fórmula de Haversine
   * @returns Distância em quilômetros
   */
  calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = EARTH_RADIUS_KM * c;

    return Math.round(distance * 100) / 100;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // =============================================
  // TRAVEL TIME CALCULATION
  // =============================================

  /**
   * Calcula tempo de viagem em minutos
   */
  calculateTravelTime(
    distanceKm: number,
    vehicleType?: string,
    rushHour = false,
  ): number {
    const speed = VEHICLE_SPEEDS[vehicleType as keyof typeof VEHICLE_SPEEDS] || VEHICLE_SPEEDS.DEFAULT;
    const timeFactor = this.getTimeFactor(rushHour);

    // Tempo base = distância / velocidade * 60 (para converter em minutos)
    const baseTime = (distanceKm / speed) * 60;

    // Aplicar fator de tempo
    const adjustedTime = baseTime * timeFactor;

    return Math.ceil(adjustedTime);
  }

  /**
   * Determina se é horário de pico
   */
  private isRushHour(): boolean {
    const now = new Date();
    const hour = now.getHours();

    // Horários de pico: 11h-14h (almoço), 18h-21h (jantar)
    return (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
  }

  /**
   * Obtém fator de tempo baseado no horário
   */
  private getTimeFactor(forceRushHour = false): number {
    if (forceRushHour) return TIME_FACTORS.RUSH_HOUR;

    const now = new Date();
    const hour = now.getHours();

    if (this.isRushHour()) {
      return TIME_FACTORS.RUSH_HOUR;
    }

    if (hour >= 23 || hour <= 5) {
      return TIME_FACTORS.LATE_NIGHT;
    }

    return TIME_FACTORS.NORMAL;
  }

  // =============================================
  // ETA CALCULATION
  // =============================================

  /**
   * Calcula ETA completo para entrega
   */
  async calculateEta(dto: CalculateEtaDto): Promise<EtaCalculationResult> {
    // Buscar merchant
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: dto.merchantId },
      select: {
        id: true,
        businessName: true,
        latitude: true,
        longitude: true,
        estimatedTime: true,
        isOpen: true,
      },
    });

    if (!merchant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    if (!merchant.latitude || !merchant.longitude) {
      throw new NotFoundException('Restaurante sem coordenadas configuradas');
    }

    const merchantLat = Number(merchant.latitude);
    const merchantLng = Number(merchant.longitude);

    // Calcular distância merchant -> cliente
    const merchantToCustomerKm = this.calculateHaversineDistance(
      merchantLat,
      merchantLng,
      dto.customerLat,
      dto.customerLng,
    );

    // Calcular distância driver -> merchant (se houver posição do driver)
    let driverToMerchantKm: number | null = null;
    let driverToMerchantMinutes = 0;

    if (dto.driverLat && dto.driverLng) {
      driverToMerchantKm = this.calculateHaversineDistance(
        dto.driverLat,
        dto.driverLng,
        merchantLat,
        merchantLng,
      );
      driverToMerchantMinutes = this.calculateTravelTime(driverToMerchantKm);
    }

    // Calcular tempo de entrega merchant -> cliente
    const merchantToCustomerMinutes = this.calculateTravelTime(merchantToCustomerKm);

    // Tempo de preparo do merchant
    const preparationTimeMinutes = merchant.estimatedTime || 30;

    // Calcular total
    const totalMinutes =
      preparationTimeMinutes +
      driverToMerchantMinutes +
      FIXED_TIMES.DRIVER_PICKUP_TIME +
      merchantToCustomerMinutes +
      FIXED_TIMES.DRIVER_DROPOFF_TIME;

    // Range de tempo (min/max)
    const minVariation = Math.floor(totalMinutes * 0.8);
    const maxVariation = Math.ceil(totalMinutes * 1.3);

    const breakdown: EtaBreakdown = {
      preparationTimeMinutes,
      driverToMerchantMinutes,
      merchantToCustomerMinutes,
      totalMinutes,
      totalRange: {
        min: Math.max(minVariation, FIXED_TIMES.MIN_DELIVERY_TIME),
        max: maxVariation,
      },
    };

    // Determinar confiança
    const confidence = this.determineConfidence(dto, merchant.isOpen);

    // Fatores que afetam a estimativa
    const factors: string[] = [];
    if (this.isRushHour()) factors.push('Horário de pico');
    if (!merchant.isOpen) factors.push('Restaurante fechado');
    if (merchantToCustomerKm > 5) factors.push('Distância longa');

    return {
      estimatedDeliveryMinutes: totalMinutes,
      estimatedDeliveryTime: new Date(Date.now() + totalMinutes * 60 * 1000),
      breakdown,
      distances: {
        driverToMerchantKm,
        merchantToCustomerKm,
        totalKm: (driverToMerchantKm || 0) + merchantToCustomerKm,
      },
      confidence,
      factors,
    };
  }

  /**
   * Determina nível de confiança da estimativa
   */
  private determineConfidence(
    dto: CalculateEtaDto,
    isOpen: boolean,
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (!isOpen) return 'LOW';
    if (dto.driverLat && dto.driverLng) return 'HIGH';
    return 'MEDIUM';
  }

  // =============================================
  // MERCHANT ETA (Para listagem)
  // =============================================

  /**
   * Calcula ETA para exibição na listagem de restaurantes
   */
  async calculateMerchantEta(
    merchantId: string,
    customerLat: number,
    customerLng: number,
  ): Promise<MerchantEtaResult> {
    // Verificar cache
    const cacheKey = `${MERCHANT_ETA_CACHE_PREFIX}${merchantId}:${customerLat.toFixed(4)}:${customerLng.toFixed(4)}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Buscar merchant
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        businessName: true,
        tradeName: true,
        latitude: true,
        longitude: true,
        estimatedTime: true,
        isOpen: true,
      },
    });

    if (!merchant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const merchantLat = Number(merchant.latitude) || 0;
    const merchantLng = Number(merchant.longitude) || 0;

    // Calcular distância
    const distanceKm = this.calculateHaversineDistance(
      merchantLat,
      merchantLng,
      customerLat,
      customerLng,
    );

    // Tempo de preparo
    const preparationTimeMinutes = merchant.estimatedTime || 30;

    // Tempo de entrega (sem driver específico)
    const deliveryTimeMinutes = this.calculateTravelTime(distanceKm);

    // Total
    const totalMinutes = preparationTimeMinutes + deliveryTimeMinutes + FIXED_TIMES.DRIVER_PICKUP_TIME;

    // Range
    const minTime = Math.max(Math.floor(totalMinutes * 0.85), FIXED_TIMES.MIN_DELIVERY_TIME);
    const maxTime = Math.ceil(totalMinutes * 1.2);

    const result: MerchantEtaResult = {
      merchantId: merchant.id,
      merchantName: merchant.tradeName || merchant.businessName,
      estimatedDeliveryMinutes: totalMinutes,
      deliveryRange: {
        min: minTime,
        max: maxTime,
      },
      preparationTimeMinutes,
      deliveryTimeMinutes,
      distanceKm,
      isOpen: merchant.isOpen,
    };

    // Cache por 5 minutos
    await this.redis.set(cacheKey, JSON.stringify(result), ETA_CACHE_TTL);

    return result;
  }

  /**
   * Calcula ETA para múltiplos merchants (bulk)
   */
  async calculateBulkMerchantEta(
    merchantIds: string[],
    customerLat: number,
    customerLng: number,
  ): Promise<MerchantEtaResult[]> {
    const results = await Promise.all(
      merchantIds.map((id) =>
        this.calculateMerchantEta(id, customerLat, customerLng).catch(() => null),
      ),
    );

    return results.filter((r): r is MerchantEtaResult => r !== null);
  }

  // =============================================
  // ORDER ETA (Para tracking)
  // =============================================

  /**
   * Calcula ETA atualizado para um pedido em andamento
   */
  async calculateOrderEta(orderId: string): Promise<OrderEtaResult> {
    // Buscar pedido com todas informações necessárias
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: {
            latitude: true,
            longitude: true,
            estimatedTime: true,
          },
        },
        address: {
          select: {
            latitude: true,
            longitude: true,
          },
        },
        driver: {
          include: {
            driverProfile: {
              select: {
                currentLat: true,
                currentLng: true,
                vehicleType: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const now = new Date();
    let remainingMinutes: number | null = null;
    let breakdown: { preparationRemaining: number; deliveryRemaining: number } | null = null;
    let driverLocation: OrderEtaResult['driverLocation'] = null;
    let estimatedDeliveryTime: Date | null = null;

    // Calcular baseado no status atual
    switch (order.status) {
      case OrderStatus.PENDING:
      case OrderStatus.CONFIRMED: {
        // Pedido ainda não começou preparo
        const prepTime = order.merchant.estimatedTime || 30;
        const deliveryDistance = this.calculateDeliveryDistance(order);
        const deliveryTime = this.calculateTravelTime(deliveryDistance);

        remainingMinutes = prepTime + deliveryTime + FIXED_TIMES.DRIVER_PICKUP_TIME;
        breakdown = {
          preparationRemaining: prepTime,
          deliveryRemaining: deliveryTime,
        };
        estimatedDeliveryTime = new Date(now.getTime() + remainingMinutes * 60 * 1000);
        break;
      }

      case OrderStatus.PREPARING: {
        // Em preparo - usar tempo desde início do preparo
        const preparingAt = order.preparingAt || now;
        const prepTime = order.merchant.estimatedTime || 30;
        const elapsedMinutes = Math.floor((now.getTime() - preparingAt.getTime()) / 60000);
        const prepRemaining = Math.max(0, prepTime - elapsedMinutes);

        const deliveryDistance = this.calculateDeliveryDistance(order);
        const deliveryTime = this.calculateTravelTime(deliveryDistance);

        remainingMinutes = prepRemaining + deliveryTime + FIXED_TIMES.DRIVER_PICKUP_TIME;
        breakdown = {
          preparationRemaining: prepRemaining,
          deliveryRemaining: deliveryTime,
        };
        estimatedDeliveryTime = new Date(now.getTime() + remainingMinutes * 60 * 1000);
        break;
      }

      case OrderStatus.READY_FOR_PICKUP: {
        // Pronto - aguardando driver
        const deliveryDistance = this.calculateDeliveryDistance(order);
        const deliveryTime = this.calculateTravelTime(deliveryDistance);

        // Se tem driver atribuído, calcular distância do driver
        if (order.driver?.driverProfile) {
          const driverLat = Number(order.driver.driverProfile.currentLat);
          const driverLng = Number(order.driver.driverProfile.currentLng);
          const merchantLat = Number(order.merchant.latitude);
          const merchantLng = Number(order.merchant.longitude);

          if (driverLat && driverLng && merchantLat && merchantLng) {
            const driverToMerchant = this.calculateHaversineDistance(
              driverLat, driverLng, merchantLat, merchantLng,
            );
            const pickupTime = this.calculateTravelTime(
              driverToMerchant,
              order.driver.driverProfile.vehicleType,
            );

            remainingMinutes = pickupTime + FIXED_TIMES.DRIVER_PICKUP_TIME + deliveryTime;
            driverLocation = {
              latitude: driverLat,
              longitude: driverLng,
              distanceToDestinationKm: driverToMerchant,
            };
          }
        } else {
          // Sem driver ainda - estimar tempo médio
          remainingMinutes = 10 + deliveryTime; // 10 min para encontrar driver
        }

        breakdown = {
          preparationRemaining: 0,
          deliveryRemaining: remainingMinutes || deliveryTime,
        };
        estimatedDeliveryTime = new Date(now.getTime() + (remainingMinutes || 0) * 60 * 1000);
        break;
      }

      case OrderStatus.OUT_FOR_DELIVERY: {
        // Em entrega - calcular distância do driver ao cliente
        if (order.driver?.driverProfile && order.address.latitude && order.address.longitude) {
          const driverLat = Number(order.driver.driverProfile.currentLat);
          const driverLng = Number(order.driver.driverProfile.currentLng);
          const customerLat = Number(order.address.latitude);
          const customerLng = Number(order.address.longitude);

          if (driverLat && driverLng) {
            const distanceToCustomer = this.calculateHaversineDistance(
              driverLat, driverLng, customerLat, customerLng,
            );

            remainingMinutes = this.calculateTravelTime(
              distanceToCustomer,
              order.driver.driverProfile.vehicleType,
            ) + FIXED_TIMES.DRIVER_DROPOFF_TIME;

            driverLocation = {
              latitude: driverLat,
              longitude: driverLng,
              distanceToDestinationKm: distanceToCustomer,
            };
          }
        }

        if (!remainingMinutes) {
          // Fallback se não tiver localização do driver
          const pickedUpAt = order.pickedUpAt || now;
          const elapsedSincePickup = Math.floor((now.getTime() - pickedUpAt.getTime()) / 60000);
          const deliveryDistance = this.calculateDeliveryDistance(order);
          const totalDeliveryTime = this.calculateTravelTime(deliveryDistance);
          remainingMinutes = Math.max(5, totalDeliveryTime - elapsedSincePickup);
        }

        breakdown = {
          preparationRemaining: 0,
          deliveryRemaining: remainingMinutes,
        };
        estimatedDeliveryTime = new Date(now.getTime() + remainingMinutes * 60 * 1000);
        break;
      }

      case OrderStatus.DELIVERED:
      case OrderStatus.CANCELLED:
        // Pedido finalizado
        remainingMinutes = 0;
        estimatedDeliveryTime = order.deliveredAt || null;
        break;
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      estimatedDeliveryTime,
      remainingMinutes,
      breakdown,
      driverLocation,
      lastUpdated: now,
    };
  }

  /**
   * Calcula distância total de entrega (merchant -> cliente)
   */
  private calculateDeliveryDistance(order: {
    merchant: { latitude: unknown; longitude: unknown };
    address: { latitude: unknown; longitude: unknown };
  }): number {
    const merchantLat = Number(order.merchant.latitude) || 0;
    const merchantLng = Number(order.merchant.longitude) || 0;
    const customerLat = Number(order.address.latitude) || 0;
    const customerLng = Number(order.address.longitude) || 0;

    if (!merchantLat || !merchantLng || !customerLat || !customerLng) {
      return 3; // Distância padrão de 3km se não houver coordenadas
    }

    return this.calculateHaversineDistance(
      merchantLat,
      merchantLng,
      customerLat,
      customerLng,
    );
  }

  // =============================================
  // UTILITIES
  // =============================================

  /**
   * Formata ETA para exibição
   */
  formatEtaDisplay(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${mins}min`;
  }

  /**
   * Formata range de tempo
   */
  formatEtaRange(min: number, max: number): string {
    return `${min}-${max} min`;
  }

  /**
   * Invalida cache de ETA para um merchant
   */
  async invalidateMerchantEtaCache(merchantId: string): Promise<void> {
    // Nota: Em produção, usar scan/keys com pattern
    // Por enquanto, apenas logar
    this.logger.debug(`Cache de ETA invalidado para merchant ${merchantId}`);
  }
}
