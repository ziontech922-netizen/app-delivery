'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  MessageCircle, 
  Search,
  Clock,
  Loader2,
  Package,
  User
} from 'lucide-react';
import { chatService, type Conversation } from '@/services/chat.service';
import { useAuthStore } from '@/store';
import { Card } from '@/components/ui';

export default function MerchantChatPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['merchant-conversations'],
    queryFn: () => chatService.getConversations(),
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => chatService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const conversations = conversationsData?.data || [];

  const filteredConversations = conversations.filter((conv) => {
    if (!search) return true;
    const name = `${conv.otherUser.firstName} ${conv.otherUser.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-green-600" />
          Chat com Clientes
        </h1>
        {unreadCount > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount} {unreadCount === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
          </p>
        )}
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredConversations.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conversa</h3>
          <p className="text-gray-500">
            Quando clientes entrarem em contato, as conversas aparecerão aqui.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                conversation.unreadCount > 0 ? 'bg-green-50 border-green-200' : ''
              }`}
              onClick={() => router.push(`/chat/${conversation.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  {conversation.otherUser.avatarUrl ? (
                    <img
                      src={conversation.otherUser.avatarUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  {conversation.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium truncate ${
                      conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                    </h3>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                  
                  {conversation.listing && (
                    <div className="flex items-center gap-1 text-xs text-primary-600 mt-1">
                      <Package className="w-3 h-3" />
                      {conversation.listing.title}
                    </div>
                  )}
                  
                  <p className={`text-sm truncate mt-1 ${
                    conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {conversation.lastMessageText || 'Nenhuma mensagem'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
