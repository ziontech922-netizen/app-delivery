import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@shared/prisma';
import { ChatService } from './chat.service';
import { SendMessageDto, MessageType } from './dto/create-message.dto';

interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.validateToken(token);
      if (!payload) {
        client.disconnect();
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      // Anexar usuário ao socket
      (client as AuthenticatedSocket).user = user;

      // Adicionar à sala do usuário
      client.join(`user:${user.id}`);

      // Rastrear conexões
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)?.add(client.id);

      this.logger.log(`User ${user.id} connected to chat`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      const userSocketSet = this.userSockets.get(client.user.id);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(client.user.id);
        }
      }
      this.logger.log(`User ${client.user.id} disconnected from chat`);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      // Verificar se o usuário tem acesso à conversa
      await this.chatService.getConversation(data.conversationId, client.user.id);
      client.join(`conversation:${data.conversationId}`);
      this.logger.log(`User ${client.user.id} joined conversation ${data.conversationId}`);
    } catch (error) {
      client.emit('error', { message: 'Não foi possível entrar na conversa' });
    }
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; type: MessageType; content: string; metadata?: any },
  ) {
    try {
      const message = await this.chatService.sendMessage(
        data.conversationId,
        client.user.id,
        {
          type: data.type,
          content: data.content,
          metadata: data.metadata,
        },
      );

      // Emitir para todos na conversa
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('new_message', message);

      // Buscar a conversa para notificar o outro participante
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: data.conversationId },
      });

      if (conversation) {
        const otherUserId =
          conversation.participant1Id === client.user.id
            ? conversation.participant2Id
            : conversation.participant1Id;

        // Notificar o outro usuário (pode estar em outra tela)
        this.server.to(`user:${otherUserId}`).emit('conversation_updated', {
          conversationId: data.conversationId,
          lastMessageAt: message.createdAt,
          lastMessageText: data.type === MessageType.TEXT ? data.content.substring(0, 100) : `[${data.type}]`,
        });
      }

      return { success: true, message };
    } catch (error) {
      client.emit('error', { message: 'Erro ao enviar mensagem' });
      return { success: false };
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId: client.user.id,
      firstName: client.user.firstName,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('user_stopped_typing', {
      userId: client.user.id,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      await this.chatService.markAsRead(data.conversationId, client.user.id);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  // =============================================
  // HELPERS
  // =============================================

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (!auth) return null;
    return auth.replace('Bearer ', '');
  }

  private async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      return null;
    }
  }

  // Método para notificar de outros módulos
  notifyNewMessage(userId: string, conversation: any, message: any) {
    this.server.to(`user:${userId}`).emit('new_message_notification', {
      conversation,
      message,
    });
  }
}
