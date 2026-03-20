'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import { useAuthStore } from '@/store';
import { chatService } from '@/services/chat.service';
import { cn } from '@/lib/utils';

interface FloatingChatButtonProps {
  className?: string;
}

export default function FloatingChatButton({ className }: FloatingChatButtonProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Páginas onde o FAB não deve aparecer
  const hiddenPaths = [
    '/admin', '/merchant', '/login', '/register', 
    '/welcome', '/forgot-password', '/reset-password',
    '/chat' // Já está no chat, não precisa do FAB
  ];
  const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));

  // Buscar contagem de não lidas
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const count = await chatService.getUnreadCount();
      
      // Se aumentou, ativar animação
      if (count > unreadCount) {
        setHasNewMessage(true);
        setTimeout(() => setHasNewMessage(false), 3000);
      }
      
      setUnreadCount(count);
    } catch {
      // Silenciar erro - usuário pode não ter conversas
    }
  }, [isAuthenticated, unreadCount]);

  // Buscar ao montar e a cada 30 segundos
  useEffect(() => {
    // Usar timeout para evitar cascading renders
    const timeoutId = setTimeout(() => fetchUnreadCount(), 100);
    
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  // Escutar eventos de nova mensagem via socket
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewMessage = () => {
      setHasNewMessage(true);
      setUnreadCount(prev => prev + 1);
      setTimeout(() => setHasNewMessage(false), 3000);
    };

    // chatService.on retorna função de unsubscribe
    const unsubscribe = chatService.on('new_message', handleNewMessage);
    
    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  // Mostrar tooltip inicial para novos usuários
  useEffect(() => {
    if (isAuthenticated) {
      const hasSeenTooltip = localStorage.getItem('chat_fab_tooltip_seen');
      if (!hasSeenTooltip) {
        setTimeout(() => setShowTooltip(true), 2000);
        setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem('chat_fab_tooltip_seen', 'true');
        }, 6000);
      }
    }
  }, [isAuthenticated]);

  // Não mostrar em páginas ocultas ou se não autenticado
  if (shouldHide || !isAuthenticated) return null;

  return (
    <>
      {/* Tooltip de boas-vindas */}
      {showTooltip && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-20 z-50 animate-fade-in">
          <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-[200px]">
            <button 
              onClick={() => setShowTooltip(false)}
              className="absolute -top-2 -right-2 bg-gray-700 rounded-full p-1"
              title="Fechar dica"
              aria-label="Fechar dica"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="font-medium">💬 Chat do SuperApp</p>
            <p className="text-gray-300 text-xs mt-1">
              Converse com vendedores e compradores do marketplace!
            </p>
            {/* Seta */}
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}

      {/* FAB Principal */}
      <Link
        href="/chat"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          // Posição - acima do BottomNav no mobile, canto inferior direito no desktop
          'fixed z-50',
          'bottom-20 right-4 md:bottom-6 md:right-6',
          
          // Tamanho e forma
          'h-14 w-14 rounded-full',
          
          // Cores e gradiente profissional
          'bg-gradient-to-br from-primary-500 to-primary-600',
          'hover:from-primary-600 hover:to-primary-700',
          
          // Sombra elegante
          'shadow-lg shadow-primary-500/30',
          'hover:shadow-xl hover:shadow-primary-500/40',
          
          // Flexbox para centralizar ícone
          'flex items-center justify-center',
          
          // Transições suaves
          'transition-all duration-300 ease-out',
          'hover:scale-105 active:scale-95',
          
          // Animação de pulso quando tem nova mensagem
          hasNewMessage && 'animate-bounce',
          
          className
        )}
        aria-label={`Chat - ${unreadCount > 0 ? `${unreadCount} mensagens não lidas` : 'Abrir conversas'}`}
      >
        {/* Ícone do Chat */}
        <MessageCircle 
          className={cn(
            'h-6 w-6 text-white transition-transform duration-300',
            isHovered && 'scale-110'
          )}
          strokeWidth={2}
        />

        {/* Badge de mensagens não lidas */}
        {unreadCount > 0 && (
          <span 
            className={cn(
              'absolute -top-1 -right-1',
              'min-w-[22px] h-[22px] px-1.5',
              'bg-red-500 text-white',
              'text-xs font-bold',
              'rounded-full',
              'flex items-center justify-center',
              'border-2 border-white',
              'shadow-sm',
              // Animação de entrada
              'animate-scale-in'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Indicador de nova mensagem (pulso) */}
        {hasNewMessage && (
          <span className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-75" />
        )}
      </Link>

      {/* Estilos de animação */}
      <style jsx global>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
