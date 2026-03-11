import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private publisher: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (!redisUrl) {
      this.logger.warn('REDIS_URL não configurada. Redis desabilitado (modo degradado).');
      return;
    }

    try {
      // Cliente principal para cache
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis: máximo de tentativas atingido');
            return null; // Para de tentar
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      // Cliente para Pub/Sub (subscriber)
      this.subscriber = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Cliente para Pub/Sub (publisher)
      this.publisher = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Event handlers
      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis conectado');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis erro: ${err.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis desconectado');
      });

      // Tentar conectar
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect(),
      ]);

      this.isConnected = true;
      this.logger.log('Redis inicializado com sucesso');
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Falha ao conectar Redis: ${err.message}. Modo degradado ativo.`);
      this.isConnected = false;
      this.client = null;
      this.subscriber = null;
      this.publisher = null;
    }
  }

  async onModuleDestroy() {
    const closePromises: Promise<void>[] = [];

    if (this.client) {
      closePromises.push(this.client.quit().then(() => {}));
    }
    if (this.subscriber) {
      closePromises.push(this.subscriber.quit().then(() => {}));
    }
    if (this.publisher) {
      closePromises.push(this.publisher.quit().then(() => {}));
    }

    await Promise.all(closePromises);
    this.logger.log('Redis desconectado');
  }

  // =============================================
  // STATUS
  // =============================================

  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }

  isAvailable(): boolean {
    return this.isConnected;
  }

  // =============================================
  // CACHE OPERATIONS (com fallback)
  // =============================================

  /**
   * Salva valor no cache com TTL
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setex(key, ttlSeconds, value);
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Redis SET falhou: ${err.message}`);
      return false;
    }
  }

  /**
   * Busca valor do cache
   */
  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Redis GET falhou: ${err.message}`);
      return null;
    }
  }

  /**
   * Remove chave do cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Redis DEL falhou: ${err.message}`);
      return false;
    }
  }

  /**
   * Salva objeto JSON no cache
   */
  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
    return this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /**
   * Busca objeto JSON do cache
   */
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  // =============================================
  // PUB/SUB OPERATIONS
  // =============================================

  /**
   * Publica mensagem em um canal
   */
  async publish(channel: string, message: string): Promise<boolean> {
    if (!this.isConnected || !this.publisher) {
      return false;
    }

    try {
      await this.publisher.publish(channel, message);
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Redis PUBLISH falhou: ${err.message}`);
      return false;
    }
  }

  /**
   * Publica objeto JSON em um canal
   */
  async publishJson<T>(channel: string, data: T): Promise<boolean> {
    return this.publish(channel, JSON.stringify(data));
  }

  /**
   * Inscreve em um canal
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<boolean> {
    if (!this.isConnected || !this.subscriber) {
      return false;
    }

    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          callback(message);
        }
      });
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Redis SUBSCRIBE falhou: ${err.message}`);
      return false;
    }
  }

  // =============================================
  // PRESENCE (Online Status)
  // =============================================

  /**
   * Marca usuário como online
   */
  async setUserOnline(userId: string, ttlSeconds = 300): Promise<boolean> {
    return this.set(`user:${userId}:online`, '1', ttlSeconds);
  }

  /**
   * Verifica se usuário está online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const value = await this.get(`user:${userId}:online`);
    return value === '1';
  }

  /**
   * Marca usuário como offline
   */
  async setUserOffline(userId: string): Promise<boolean> {
    return this.del(`user:${userId}:online`);
  }

  // =============================================
  // ORDER CACHE
  // =============================================

  /**
   * Cache do status do pedido
   */
  async cacheOrderStatus(orderId: string, status: string, ttlSeconds = 600): Promise<boolean> {
    return this.set(`order:${orderId}:status`, status, ttlSeconds);
  }

  /**
   * Busca status do pedido do cache
   */
  async getOrderStatus(orderId: string): Promise<string | null> {
    return this.get(`order:${orderId}:status`);
  }

  /**
   * Cache de pedidos ativos do merchant
   */
  async cacheMerchantActiveOrders(merchantId: string, orderIds: string[], ttlSeconds = 300): Promise<boolean> {
    return this.setJson(`merchant:${merchantId}:active_orders`, orderIds, ttlSeconds);
  }

  /**
   * Busca pedidos ativos do merchant do cache
   */
  async getMerchantActiveOrders(merchantId: string): Promise<string[] | null> {
    return this.getJson<string[]>(`merchant:${merchantId}:active_orders`);
  }

  /**
   * Invalida cache de pedidos ativos do merchant
   */
  async invalidateMerchantActiveOrders(merchantId: string): Promise<boolean> {
    return this.del(`merchant:${merchantId}:active_orders`);
  }

  // =============================================
  // LIST OPERATIONS
  // =============================================

  /**
   * Adiciona elemento no início da lista
   */
  async lpush(key: string, value: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.lpush(key, value);
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Redis LPUSH falhou: ${err.message}`);
      return false;
    }
  }

  /**
   * Obtém elementos da lista
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.isConnected || !this.client) {
      return [];
    }

    try {
      return await this.client.lrange(key, start, stop);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Redis LRANGE falhou: ${err.message}`);
      return [];
    }
  }

  /**
   * Remove elementos de uma lista
   */
  async lrem(key: string, count: number, value: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      return await this.client.lrem(key, count, value);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Redis LREM falhou: ${err.message}`);
      return 0;
    }
  }
}
