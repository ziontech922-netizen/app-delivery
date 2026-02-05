import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '@shared/prisma';
import { RealtimeService } from './realtime.service';
import { JoinOrderRoomDto } from './dto';
import { RealtimeEvent, RoomJoinedPayload, RoomErrorPayload, ConnectionSuccessPayload } from './realtime.events';

// Interface para socket autenticado
interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, restringir origens
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // =============================================
  // LIFECYCLE HOOKS
  // =============================================

  afterInit(server: Server) {
    this.realtimeService.setServer(server);
    this.logger.log('WebSocket Gateway inicializado');
  }

  async handleConnection(client: Socket) {
    try {
      // Extrair token do handshake
      const token = this.extractToken(client);
      
      if (!token) {
        this.logger.warn(`Conexão rejeitada: token ausente (${client.id})`);
        client.emit(RealtimeEvent.CONNECTION_ERROR, { error: 'Token não fornecido' });
        client.disconnect(true);
        return;
      }

      // Validar e decodificar token
      const payload = await this.validateToken(token);
      
      if (!payload) {
        this.logger.warn(`Conexão rejeitada: token inválido (${client.id})`);
        client.emit(RealtimeEvent.CONNECTION_ERROR, { error: 'Token inválido' });
        client.disconnect(true);
        return;
      }

      // Buscar usuário no banco
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        this.logger.warn(`Conexão rejeitada: usuário inativo (${client.id})`);
        client.emit(RealtimeEvent.CONNECTION_ERROR, { error: 'Usuário não autorizado' });
        client.disconnect(true);
        return;
      }

      // Anexar usuário ao socket
      (client as AuthenticatedSocket).user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      // Registrar presença
      await this.realtimeService.handleUserConnected(user.id, client.id);

      // Auto-join em salas baseado no role
      const rooms = await this.realtimeService.getAutoJoinRooms(user.id, user.role);
      for (const room of rooms) {
        await client.join(room);
      }

      // Emitir sucesso
      const successPayload: ConnectionSuccessPayload = {
        userId: user.id,
        socketId: client.id,
        rooms,
      };
      client.emit(RealtimeEvent.CONNECTION_SUCCESS, successPayload);

      this.logger.log(`Cliente conectado: ${user.email} (${client.id}) - Salas: ${rooms.join(', ')}`);

    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Erro na conexão: ${err.message}`, err.stack);
      client.emit(RealtimeEvent.CONNECTION_ERROR, { error: 'Erro interno' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const authClient = client as AuthenticatedSocket;
    
    if (authClient.user) {
      await this.realtimeService.handleUserDisconnected(authClient.user.id, client.id);
      this.logger.log(`Cliente desconectado: ${authClient.user.email} (${client.id})`);
    } else {
      this.logger.debug(`Cliente desconectado: ${client.id} (não autenticado)`);
    }
  }

  // =============================================
  // MESSAGE HANDLERS
  // =============================================

  /**
   * Entrar na sala de um pedido específico
   */
  @SubscribeMessage('order:join')
  async handleJoinOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinOrderRoomDto,
  ) {
    const authClient = client as AuthenticatedSocket;
    
    if (!authClient.user) {
      throw new WsException('Não autenticado');
    }

    const canJoin = await this.realtimeService.canJoinOrderRoom(
      authClient.user.id,
      data.orderId,
    );

    if (!canJoin) {
      const errorPayload: RoomErrorPayload = {
        room: `order:${data.orderId}`,
        error: 'Não autorizado a acessar este pedido',
      };
      client.emit(RealtimeEvent.ROOM_ERROR, errorPayload);
      return { success: false, error: 'Não autorizado' };
    }

    const room = `order:${data.orderId}`;
    await client.join(room);

    const payload: RoomJoinedPayload = {
      room,
      joinedAt: new Date().toISOString(),
    };
    client.emit(RealtimeEvent.ROOM_JOINED, payload);

    this.logger.debug(`${authClient.user.email} entrou na sala ${room}`);

    return { success: true, room };
  }

  /**
   * Sair da sala de um pedido
   */
  @SubscribeMessage('order:leave')
  async handleLeaveOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinOrderRoomDto,
  ) {
    const authClient = client as AuthenticatedSocket;
    
    if (!authClient.user) {
      throw new WsException('Não autenticado');
    }

    const room = `order:${data.orderId}`;
    await client.leave(room);

    client.emit(RealtimeEvent.ROOM_LEFT, { room });

    this.logger.debug(`${authClient.user.email} saiu da sala ${room}`);

    return { success: true };
  }

  /**
   * Heartbeat para manter presença ativa
   */
  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket) {
    const authClient = client as AuthenticatedSocket;
    
    if (authClient.user) {
      await this.realtimeService.refreshUserPresence(authClient.user.id);
    }

    return { event: 'pong', timestamp: Date.now() };
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  private extractToken(client: Socket): string | null {
    // Tentar extrair do header Authorization
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Tentar extrair do query param
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (typeof token === 'string') {
      return token;
    }

    return null;
  }

  private async validateToken(token: string): Promise<{ sub: string } | null> {
    try {
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return payload;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.debug(`Token inválido: ${err.message}`);
      return null;
    }
  }
}
