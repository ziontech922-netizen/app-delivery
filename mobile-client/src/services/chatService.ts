import { api } from '../config/api';
import { socketService } from './socketService';
import type { 
  PaginatedResponse,
} from '../types';

// ===========================================
// CHAT TYPES
// ===========================================

export type MessageType = 'text' | 'image' | 'audio' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  audioDuration?: number;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  userHandle?: string;
  isOnline?: boolean;
}

export interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessagePayload {
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  audioDuration?: number;
}

// ===========================================
// CHAT SERVICE
// ===========================================

class ChatService {
  private messageCallbacks: ((message: Message) => void)[] = [];
  private isConnected = false;

  // ===========================================
  // REALTIME
  // ===========================================

  connect() {
    if (this.isConnected) return;
    
    socketService.on('new_message', (message: Message) => {
      this.messageCallbacks.forEach(cb => cb(message));
    });

    socketService.on('message_read', (data: { conversationId: string; readBy: string }) => {
      // Handle read receipts
    });

    this.isConnected = true;
  }

  disconnect() {
    socketService.off('new_message');
    socketService.off('message_read');
    this.messageCallbacks = [];
    this.isConnected = false;
  }

  onNewMessage(callback: (message: Message) => void) {
    this.connect();
    this.messageCallbacks.push(callback);
  }

  offNewMessage(callback: (message: Message) => void) {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  }

  joinConversation(conversationId: string) {
    socketService.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string) {
    socketService.emit('leave_conversation', { conversationId });
  }

  // ===========================================
  // CONVERSATIONS
  // ===========================================

  async getConversations(page = 1, limit = 20): Promise<Conversation[]> {
    try {
      const response = await api.get(`/chat/conversations?page=${page}&limit=${limit}`);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      const response = await api.get(`/chat/conversations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/chat/unread-count');
      return response.data.unreadCount || 0;
    } catch (error) {
      return 0;
    }
  }

  // ===========================================
  // MESSAGES
  // ===========================================

  async getMessages(conversationId: string, page = 1, limit = 50): Promise<Message[]> {
    try {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
      );
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async sendMessage(conversationId: string, payload: SendMessagePayload): Promise<Message> {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, payload);
    
    // Also emit via socket for realtime
    socketService.emit('send_message', {
      conversationId,
      ...payload,
    });
    
    return response.data;
  }

  async markAsRead(conversationId: string): Promise<void> {
    try {
      await api.post(`/chat/conversations/${conversationId}/read`);
      socketService.emit('mark_read', { conversationId });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  // Start a new conversation
  async startConversation(
    recipientId: string,
    payload: SendMessagePayload,
    listingId?: string
  ): Promise<{ conversation: Conversation; message: Message }> {
    const response = await api.post('/chat/send', {
      recipientId,
      ...payload,
      listingId,
    });
    return response.data;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/chat/messages/${messageId}`);
  }

  // Find or create conversation with a user
  async findOrCreateConversation(recipientId: string, listingId?: string): Promise<Conversation> {
    const response = await api.post('/chat/conversations/find-or-create', {
      recipientId,
      listingId,
    });
    return response.data;
  }
}

export const chatService = new ChatService();
export default chatService;
