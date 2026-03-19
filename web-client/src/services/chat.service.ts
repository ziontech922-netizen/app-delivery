import api from './api';
import { io, Socket } from 'socket.io-client';

// ===========================================
// CHAT TYPES
// ===========================================

export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'SYSTEM';

export interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  userHandle: string | null;
  avatarUrl: string | null;
}

export interface Conversation {
  id: string;
  otherUser: ChatUser;
  listingId: string | null;
  listing?: {
    id: string;
    title: string;
    images: string[];
  };
  lastMessageAt: string | null;
  lastMessageText: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
  sender: ChatUser;
}

export interface SendMessagePayload {
  type: MessageType;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationResponse {
  data: Conversation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MessageResponse {
  data: Message[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ===========================================
// CHAT SERVICE
// ===========================================

class ChatService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  // ===========================================
  // SOCKET CONNECTION
  // ===========================================

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://superapp-api-beta.fly.dev';
    
    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Chat] Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Chat] Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Chat] Socket connection error:', error);
    });

    // Forward events to listeners
    this.socket.on('new_message', (data) => this.emit('new_message', data));
    this.socket.on('message_read', (data) => this.emit('message_read', data));
    this.socket.on('typing', (data) => this.emit('typing', data));
    this.socket.on('user_online', (data) => this.emit('user_online', data));
    this.socket.on('user_offline', (data) => this.emit('user_offline', data));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ===========================================
  // EVENT MANAGEMENT
  // ===========================================

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  // ===========================================
  // SOCKET ACTIONS
  // ===========================================

  joinConversation(conversationId: string): void {
    this.socket?.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave_conversation', { conversationId });
  }

  sendTyping(conversationId: string): void {
    this.socket?.emit('typing', { conversationId });
  }

  // ===========================================
  // CONVERSATIONS API
  // ===========================================

  async getConversations(page = 1, limit = 20): Promise<ConversationResponse> {
    const response = await api.get(`/chat/conversations?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await api.get(`/chat/conversations/${id}`);
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/chat/unread-count');
      return response.data.unreadCount || 0;
    } catch {
      return 0;
    }
  }

  async findOrCreateConversation(recipientId: string, listingId?: string): Promise<Conversation> {
    const response = await api.post('/chat/conversations/find-or-create', {
      recipientId,
      listingId,
    });
    return response.data;
  }

  // ===========================================
  // MESSAGES API
  // ===========================================

  async getMessages(conversationId: string, page = 1, limit = 50): Promise<MessageResponse> {
    const response = await api.get(
      `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  async sendMessage(conversationId: string, payload: SendMessagePayload): Promise<Message> {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, payload);
    
    // Also emit via socket for realtime
    this.socket?.emit('send_message', {
      conversationId,
      ...payload,
    });
    
    return response.data;
  }

  async markAsRead(conversationId: string): Promise<void> {
    try {
      await api.post(`/chat/conversations/${conversationId}/read`);
      this.socket?.emit('mark_read', { conversationId });
    } catch (error) {
      console.error('[Chat] Error marking as read:', error);
    }
  }

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
}

export const chatService = new ChatService();
export default chatService;
