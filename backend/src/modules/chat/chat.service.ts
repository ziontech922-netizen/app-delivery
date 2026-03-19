import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma';
import { CreateMessageDto, MessageType, SendMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =============================================
  // CONVERSATIONS
  // =============================================

  async getOrCreateConversation(
    userId: string,
    recipientId: string,
    listingId?: string,
  ) {
    // Garantir ordem consistente para evitar duplicatas
    const [participant1Id, participant2Id] = [userId, recipientId].sort();

    // Buscar conversa existente
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        participant1Id,
        participant2Id,
        listingId: listingId || null,
      },
      include: {
        participant1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userHandle: true,
            avatarUrl: true,
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userHandle: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!conversation) {
      // Criar nova conversa
      conversation = await this.prisma.conversation.create({
        data: {
          participant1Id,
          participant2Id,
          listingId,
        },
        include: {
          participant1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userHandle: true,
              avatarUrl: true,
            },
          },
          participant2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userHandle: true,
              avatarUrl: true,
            },
          },
        },
      });

      this.logger.log(`New conversation created: ${conversation.id}`);
    }

    return conversation;
  }

  async getUserConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participant1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userHandle: true,
              avatarUrl: true,
            },
          },
          participant2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userHandle: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.conversation.count({
        where: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
      }),
    ]);

    // Mapear para incluir informações do outro participante e contagem de não lidas
    const mappedConversations = conversations.map((conv) => {
      const isParticipant1 = conv.participant1Id === userId;
      const otherUser = isParticipant1 ? conv.participant2 : conv.participant1;
      const unreadCount = isParticipant1
        ? conv.participant1UnreadCount
        : conv.participant2UnreadCount;

      return {
        id: conv.id,
        otherUser,
        listingId: conv.listingId,
        lastMessageAt: conv.lastMessageAt,
        lastMessageText: conv.lastMessageText,
        unreadCount,
        createdAt: conv.createdAt,
      };
    });

    return {
      data: mappedConversations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participant1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userHandle: true,
            avatarUrl: true,
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userHandle: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    // Verificar se o usuário é participante
    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new ForbiddenException('Você não tem acesso a esta conversa');
    }

    const isParticipant1 = conversation.participant1Id === userId;
    const otherUser = isParticipant1
      ? conversation.participant2
      : conversation.participant1;

    return {
      id: conversation.id,
      otherUser,
      listingId: conversation.listingId,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
    };
  }

  // =============================================
  // MESSAGES
  // =============================================

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    // Verificar acesso à conversa
    await this.getConversation(conversationId, userId);

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userHandle: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.message.count({
        where: { conversationId, deletedAt: null },
      }),
    ]);

    return {
      data: messages.reverse(), // Retornar em ordem cronológica
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ) {
    // Verificar acesso à conversa
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    if (
      conversation.participant1Id !== senderId &&
      conversation.participant2Id !== senderId
    ) {
      throw new ForbiddenException('Você não tem acesso a esta conversa');
    }

    // Criar mensagem
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        type: dto.type as any,
        content: dto.content,
        metadata: dto.metadata,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userHandle: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Atualizar conversa
    const isParticipant1 = conversation.participant1Id === senderId;
    const unreadField = isParticipant1
      ? 'participant2UnreadCount'
      : 'participant1UnreadCount';

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageText:
          dto.type === MessageType.TEXT
            ? dto.content.substring(0, 100)
            : `[${dto.type}]`,
        [unreadField]: { increment: 1 },
      },
    });

    this.logger.log(`Message sent in conversation ${conversationId}`);

    return message;
  }

  async createConversationAndSendMessage(
    senderId: string,
    dto: CreateMessageDto,
  ) {
    // Verificar se o destinatário existe
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
      select: { id: true },
    });

    if (!recipient) {
      throw new NotFoundException('Destinatário não encontrado');
    }

    // Obter ou criar conversa
    const conversation = await this.getOrCreateConversation(
      senderId,
      dto.recipientId,
      dto.listingId,
    );

    // Enviar mensagem
    const message = await this.sendMessage(conversation.id, senderId, {
      type: dto.type,
      content: dto.content,
      metadata: dto.metadata,
    });

    return {
      conversation,
      message,
    };
  }

  async markAsRead(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    // Determinar qual campo de contagem zerar
    const isParticipant1 = conversation.participant1Id === userId;
    const unreadField = isParticipant1
      ? 'participant1UnreadCount'
      : 'participant2UnreadCount';

    // Zerar contagem de não lidas
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { [unreadField]: 0 },
    });

    // Marcar mensagens como lidas
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      select: {
        participant1Id: true,
        participant1UnreadCount: true,
        participant2UnreadCount: true,
      },
    });

    const totalUnread = conversations.reduce((sum, conv) => {
      const isParticipant1 = conv.participant1Id === userId;
      return (
        sum +
        (isParticipant1
          ? conv.participant1UnreadCount
          : conv.participant2UnreadCount)
      );
    }, 0);

    return { unreadCount: totalUnread };
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Você não pode deletar esta mensagem');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
