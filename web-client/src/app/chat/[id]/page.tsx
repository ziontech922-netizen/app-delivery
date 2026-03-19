'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  User,
  Loader2
} from 'lucide-react';
import Cookies from 'js-cookie';
import { chatService, type Message } from '@/services/chat.service';
import { useAuthStore } from '@/store';

export default function ChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const conversationId = params.id as string;
  
  const { user, isAuthenticated } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch conversation details
  const { data: conversation, isLoading: loadingConversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatService.getConversation(conversationId),
    enabled: !!conversationId && isAuthenticated,
  });

  // Fetch messages
  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatService.getMessages(conversationId),
    enabled: !!conversationId && isAuthenticated,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const messages = useMemo(() => messagesData?.data || [], [messagesData?.data]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => 
      chatService.sendMessage(conversationId, { type: 'TEXT', content }),
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Mark as read
  useEffect(() => {
    if (conversationId && isAuthenticated) {
      chatService.markAsRead(conversationId);
    }
  }, [conversationId, isAuthenticated]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to socket
  useEffect(() => {
    // Get token from cookies first, then localStorage as fallback
    const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
    if (token && conversationId) {
      chatService.connect(token);
      chatService.joinConversation(conversationId);

      const unsubscribe = chatService.on('new_message', () => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      });

      return () => {
        chatService.leaveConversation(conversationId);
        unsubscribe();
      };
    }
  }, [conversationId, queryClient]);

  // Handle send
  const handleSend = () => {
    const text = messageText.trim();
    if (!text || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(text);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Faça login para acessar</h2>
          <p className="text-gray-500 mb-4">Você precisa estar logado para ver suas conversas</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600"
          >
            Fazer login
          </Link>
        </div>
      </div>
    );
  }

  if (loadingConversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const otherUser = conversation?.otherUser;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            title="Voltar"
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>

          <Link href={`/profile/${otherUser?.id}`} className="flex items-center gap-3 flex-1">
            <div className="relative">
              {otherUser?.avatarUrl ? (
                <Image
                  src={otherUser.avatarUrl}
                  alt={otherUser.firstName}
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">
                    {otherUser?.firstName?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">
                {otherUser?.firstName} {otherUser?.lastName}
              </h2>
              {otherUser?.userHandle && (
                <p className="text-sm text-gray-500 truncate">@{otherUser.userHandle}</p>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button title="Ligar" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Phone className="h-5 w-5 text-gray-600" />
            </button>
            <button title="Videochamada" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Video className="h-5 w-5 text-gray-600" />
            </button>
            <button title="Mais opções" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Listing context (if from a listing) */}
        {conversation?.listing && (
          <div className="max-w-3xl mx-auto px-4 pb-3">
            <Link 
              href={`/listings/${conversation.listing.id}`}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {conversation.listing.images?.[0] && (
                <Image
                  src={conversation.listing.images[0]}
                  alt={conversation.listing.title}
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {conversation.listing.title}
                </p>
                <p className="text-xs text-gray-500">Conversa sobre este anúncio</p>
              </div>
            </Link>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {loadingMessages ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Comece a conversa</h3>
              <p className="text-sm text-gray-500">
                Envie uma mensagem para {otherUser?.firstName}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isOwn={message.senderId === user?.id}
                  showAvatar={index === 0 || messages[index - 1].senderId !== message.senderId}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button title="Enviar imagem" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ImageIcon className="h-5 w-5 text-gray-500" />
            </button>
            
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma mensagem..."
                className="w-full px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
            </div>

            <button
              title="Enviar mensagem"
              onClick={handleSend}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="p-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar 
}: { 
  message: Message; 
  isOwn: boolean;
  showAvatar: boolean;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0">
          {message.sender?.avatarUrl ? (
            <Image
              src={message.sender.avatarUrl}
              alt={message.sender.firstName}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {message.sender?.firstName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>
      )}
      
      {!isOwn && !showAvatar && <div className="w-8" />}

      <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOwn
              ? 'bg-orange-500 text-white rounded-br-md'
              : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
          }`}
        >
          {message.type === 'IMAGE' && typeof message.metadata?.imageUrl === 'string' && (
            <Image
              src={message.metadata.imageUrl}
              alt="Imagem enviada"
              width={200}
              height={200}
              className="rounded-lg mb-2"
            />
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
          <span className="text-xs text-gray-400">{time}</span>
          {isOwn && (
            message.readAt ? (
              <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <Check className="h-3.5 w-3.5 text-gray-400" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
