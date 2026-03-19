import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateMessageDto, SendMessageDto } from './dto/create-message.dto';
import { ConversationQueryDto, MessagesQueryDto } from './dto/conversation-query.dto';

interface AuthenticatedRequest {
  user: { id: string; email: string };
}

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // =============================================
  // CONVERSATIONS
  // =============================================

  @Get('conversations')
  @ApiOperation({ summary: 'Listar minhas conversas' })
  @ApiResponse({ status: 200, description: 'Lista de conversas' })
  getConversations(@Request() req: AuthenticatedRequest, @Query() query: ConversationQueryDto) {
    return this.chatService.getUserConversations(
      req.user.id,
      query.page,
      query.limit,
    );
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Obter detalhes de uma conversa' })
  @ApiResponse({ status: 200, description: 'Detalhes da conversa' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  getConversation(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.chatService.getConversation(id, req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Obter contagem de mensagens não lidas' })
  @ApiResponse({ status: 200, description: 'Contagem de não lidas' })
  getUnreadCount(@Request() req: AuthenticatedRequest) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  // =============================================
  // MESSAGES
  // =============================================

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Listar mensagens de uma conversa' })
  @ApiResponse({ status: 200, description: 'Lista de mensagens' })
  getMessages(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query() query: MessagesQueryDto,
  ) {
    return this.chatService.getMessages(id, req.user.id, query.page, query.limit);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Enviar mensagem em uma conversa' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada' })
  sendMessage(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(id, req.user.id, dto);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar conversa como lida' })
  @ApiResponse({ status: 200, description: 'Marcada como lida' })
  markAsRead(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.chatService.markAsRead(id, req.user.id);
  }

  @Post('conversations/find-or-create')
  @ApiOperation({ summary: 'Encontrar ou criar conversa com um usuário' })
  @ApiResponse({ status: 200, description: 'Conversa encontrada ou criada' })
  findOrCreateConversation(
    @Request() req: AuthenticatedRequest,
    @Body() body: { recipientId: string; listingId?: string },
  ) {
    return this.chatService.getOrCreateConversation(
      req.user.id,
      body.recipientId,
      body.listingId,
    );
  }

  @Post('send')
  @ApiOperation({ summary: 'Iniciar conversa e enviar mensagem' })
  @ApiResponse({ status: 201, description: 'Conversa criada e mensagem enviada' })
  createConversationAndSend(@Request() req: AuthenticatedRequest, @Body() dto: CreateMessageDto) {
    return this.chatService.createConversationAndSendMessage(req.user.id, dto);
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar mensagem' })
  @ApiResponse({ status: 204, description: 'Mensagem deletada' })
  deleteMessage(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.chatService.deleteMessage(id, req.user.id);
  }
}
