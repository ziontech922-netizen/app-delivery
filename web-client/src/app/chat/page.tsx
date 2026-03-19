'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MessageCircle, 
  Search,
  Plus,
  Clock,
  Loader2
} from 'lucide-react';
import { useState } from 'react';
import { chatService, type Conversation } from '@/services/chat.service';
import { useAuthStore } from '@/store';

export default function ChatListPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [search, setSearch] = useState('');

  // Fetch conversations
  const { data: conversationsData, isLoading, error: conversationsError } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
    enabled: isAuthenticated,
    refetchInterval: 10000, // Poll every 10 seconds
    retry: 2,
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => chatService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const conversations = conversationsData?.data || [];

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!search) return true;
    const name = `${conv.otherUser.firstName} ${conv.otherUser.lastName}`.toLowerCase();
    const handle = conv.otherUser.userHandle?.toLowerCase() || '';
    const searchLower = search.toLowerCase();
    return name.includes(searchLower) || handle.includes(searchLower);
  });

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Chat em Tempo Real</h1>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Converse com vendedores, tire dúvidas e negocie diretamente pelo app.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
          >
            Fazer login para começar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-green-600" />
                Mensagens
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">
                  {unreadCount} {unreadCount === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
                </p>
              )}
            </div>
            <button
              title="Nova conversa"
              onClick={() => router.push('/chat/new')}
              className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversas..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </header>

      {/* Conversations List */}
      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : conversationsError ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro ao carregar conversas
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Não foi possível carregar suas conversas. Tente novamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-block px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {search
                ? `Não encontramos conversas para "${search}"`
                : 'Comece uma conversa com um vendedor ao visitar um anúncio'}
            </p>
            <Link
              href="/listings"
              className="inline-block px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Explorar anúncios
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <ConversationItem key={conversation.id} conversation={conversation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conversation }: { conversation: Conversation }) {
  const { otherUser, lastMessageText, lastMessageAt, unreadCount } = conversation;

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className="flex items-center gap-4 p-4 bg-white hover:bg-gray-50 transition-colors"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {otherUser.avatarUrl ? (
          <Image
            src={otherUser.avatarUrl}
            alt={otherUser.firstName}
            width={56}
            height={56}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-semibold text-orange-600">
              {otherUser.firstName[0]?.toUpperCase()}
            </span>
          </div>
        )}
        {/* Online indicator */}
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-semibold truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
            {otherUser.firstName} {otherUser.lastName}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {lastMessageAt && (
              <>
                <Clock className="h-3 w-3" />
                {formatTime(lastMessageAt)}
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className={`text-sm truncate flex-1 ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {lastMessageText || 'Nenhuma mensagem'}
          </p>
          
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {/* Listing context */}
        {conversation.listing && (
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <div className="w-6 h-6 bg-gray-100 rounded overflow-hidden">
              {conversation.listing.images?.[0] && (
                <Image
                  src={conversation.listing.images[0]}
                  alt=""
                  width={24}
                  height={24}
                  className="object-cover"
                />
              )}
            </div>
            <span className="truncate">{conversation.listing.title}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
