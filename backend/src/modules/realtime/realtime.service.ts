import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '@shared/redis';
import { PrismaService } from '@shared/prisma';
import {
  RealtimeEvent,
  OrderCreatedPayload,
  OrderStatusUpdatedPayload,
  OrderCancelledPayload,
} from './realtime.events';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Define a instância do servidor Socket.IO
   */
  setServer(server: Server) {
    this.server = server;
  }

  /**
   * Retorna a instância do servidor
   */
  getServer(): Server | null {
    return this.server;
  }

  // =============================================
  // USER PRESENCE
  // =============================================

  /**
   * Registra usuário como online
   */
  async handleUserConnected(userId: string, socketId: string): Promise<void> {
    await this.redis.setUserOnline(userId);
    this.logger.debug(`User ${userId} conectado (socket: ${socketId})`);
  }

  /**
   * Remove usuário online
   */
  async handleUserDisconnected(userId: string, socketId: string): Promise<void> {
    await this.redis.setUserOffline(userId);
    this.logger.debug(`User ${userId} desconectado (socket: ${socketId})`);
  }

  /**
   * Atualiza heartbeat do usuário (keep-alive)
   */
  async refreshUserPresence(userId: string): Promise<void> {
    await this.redis.setUserOnline(userId);
  }

  // =============================================
  // ROOM AUTHORIZATION
  // =============================================

  /**
   * Verifica se usuário pode entrar na sala de um pedido
   */
  async canJoinOrderRoom(userId: string, orderId: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: { select: { userId: true } },
      },
    });

    if (!order) {
      return false;
    }

    // Customer do pedido
    if (order.customerId === userId) {
      return true;
    }

    // Merchant do pedido
    if (order.merchant.userId === userId) {
      return true;
    }

    // TODO: Driver do pedido (futuro)

    return false;
  }

  /**
   * Verifica se usuário pode entrar na sala do merchant
   */
  async canJoinMerchantRoom(userId: string, merchantId: string): Promise<boolean> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return false;
    }

    // Apenas o dono do merchant
    return merchant.userId === userId;
  }

  /**
   * Obtém salas automáticas do usuário baseado em seu role
   */
  async getAutoJoinRooms(userId: string, role: string): Promise<string[]> {
    const rooms: string[] = [`user:${userId}`];

    if (role === 'CUSTOMER') {
      rooms.push(`customer:${userId}`);
    }

    if (role === 'MERCHANT') {
      const merchant = await this.prisma.merchant.findUnique({
        where: { userId },
      });
      if (merchant) {
        rooms.push(`merchant:${merchant.id}`);
      }
    }

    // TODO: DRIVER role (futuro)

    return rooms;
  }

  // =============================================
  // ORDER EVENTS EMISSION
  // =============================================

  /**
   * Emite evento de pedido criado
   */
  async emitOrderCreated(
    orderId: string,
    orderNumber: string,
    customerId: string,
    merchantId: string,
    total: number,
    itemsCount: number,
  ): Promise<void> {
    if (!this.server) {
      this.logger.warn('Server não inicializado, evento não emitido');
      return;
    }

    const payload: OrderCreatedPayload = {
      orderId,
      orderNumber,
      customerId,
      merchantId,
      total,
      itemsCount,
      createdAt: new Date().toISOString(),
    };

    // Emitir para merchant (receber pedido)
    this.server.to(`merchant:${merchantId}`).emit(RealtimeEvent.ORDER_CREATED, payload);
    
    // Emitir para customer (confirmação)
    this.server.to(`customer:${customerId}`).emit(RealtimeEvent.ORDER_CREATED, payload);

    // Cache no Redis
    await this.redis.cacheOrderStatus(orderId, 'PENDING');
    await this.redis.invalidateMerchantActiveOrders(merchantId);

    this.logger.log(`Evento ORDER_CREATED emitido para pedido ${orderNumber}`);
  }

  /**
   * Emite evento de status atualizado
   */
  async emitOrderStatusUpdated(
    orderId: string,
    orderNumber: string,
    customerId: string,
    merchantId: string,
    previousStatus: string,
    newStatus: string,
  ): Promise<void> {
    if (!this.server) {
      this.logger.warn('Server não inicializado, evento não emitido');
      return;
    }

    const payload: OrderStatusUpdatedPayload = {
      orderId,
      orderNumber,
      previousStatus,
      newStatus,
      updatedAt: new Date().toISOString(),
    };

    // Emitir para todos interessados
    this.server.to(`order:${orderId}`).emit(RealtimeEvent.ORDER_STATUS_UPDATED, payload);
    this.server.to(`customer:${customerId}`).emit(RealtimeEvent.ORDER_STATUS_UPDATED, payload);
    this.server.to(`merchant:${merchantId}`).emit(RealtimeEvent.ORDER_STATUS_UPDATED, payload);

    // Atualizar cache no Redis
    await this.redis.cacheOrderStatus(orderId, newStatus);
    await this.redis.invalidateMerchantActiveOrders(merchantId);

    this.logger.log(`Evento ORDER_STATUS_UPDATED emitido: ${orderNumber} → ${newStatus}`);
  }

  /**
   * Emite evento de pedido cancelado
   */
  async emitOrderCancelled(
    orderId: string,
    orderNumber: string,
    customerId: string,
    merchantId: string,
    cancelledBy: 'customer' | 'merchant',
    reason?: string,
  ): Promise<void> {
    if (!this.server) {
      this.logger.warn('Server não inicializado, evento não emitido');
      return;
    }

    const payload: OrderCancelledPayload = {
      orderId,
      orderNumber,
      cancelledBy,
      reason,
      cancelledAt: new Date().toISOString(),
    };

    // Emitir para todos interessados
    this.server.to(`order:${orderId}`).emit(RealtimeEvent.ORDER_CANCELLED, payload);
    this.server.to(`customer:${customerId}`).emit(RealtimeEvent.ORDER_CANCELLED, payload);
    this.server.to(`merchant:${merchantId}`).emit(RealtimeEvent.ORDER_CANCELLED, payload);

    // Limpar cache no Redis
    await this.redis.del(`order:${orderId}:status`);
    await this.redis.invalidateMerchantActiveOrders(merchantId);

    this.logger.log(`Evento ORDER_CANCELLED emitido: ${orderNumber}`);
  }

  // =============================================
  // UTILITIES
  // =============================================

  /**
   * Conta clientes conectados em uma sala
   */
  async getRoomSize(room: string): Promise<number> {
    if (!this.server) return 0;
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.length;
  }

  /**
   * Verifica se há alguém na sala
   */
  async isRoomOccupied(room: string): Promise<boolean> {
    return (await this.getRoomSize(room)) > 0;
  }
}
