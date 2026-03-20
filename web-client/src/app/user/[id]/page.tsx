'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Calendar,
  Star,
  MessageCircle,
  Package,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/services/api';
import { CATEGORY_INFO } from '@/services/listing.service';
import { chatService } from '@/services/chat.service';
import { useAuthStore } from '@/store';
import { PageSpinner } from '@/components/ui/Spinner';

interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  userHandle: string | null;
  avatarUrl: string | null;
  memberSince: string;
  stats: {
    activeListings: number;
    totalReviews: number;
    averageRating: number;
  };
  recentListings: Array<{
    id: string;
    title: string;
    price: number | null;
    priceType: string;
    images: string[];
    category: string;
    city: string | null;
    state: string | null;
    createdAt: string;
  }>;
}

async function getUserProfile(userId: string): Promise<PublicUser> {
  const response = await api.get(`/users/${userId}/public`);
  return response.data;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const { isAuthenticated, user: currentUser } = useAuthStore();
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Fetch user profile
  const { data: user, isLoading: loadingUser, error: userError } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId,
  });

  const handleStartChat = async () => {
    if (!user) return;
    
    if (!isAuthenticated) {
      router.push(`/login?redirect=/user/${userId}`);
      return;
    }
    
    if (currentUser?.id === userId) {
      return; // Não pode conversar consigo mesmo
    }

    setIsStartingChat(true);
    try {
      const conversation = await chatService.findOrCreateConversation(userId);
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
      alert('Erro ao iniciar conversa. Tente novamente.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const formatPrice = (price?: number, priceType?: string) => {
    if (priceType === 'FREE') return 'Grátis';
    if (priceType === 'CONTACT') return 'Consulte';
    if (!price) return 'Consulte';
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
  };

  if (loadingUser) {
    return <PageSpinner />;
  }

  if (userError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Usuário não encontrado</h1>
          <p className="text-gray-500 mb-6">
            Este perfil não existe ou foi removido.
          </p>
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:underline"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const memberSince = formatDistanceToNow(new Date(user.memberSince), {
    locale: ptBR,
  });

  // Usar listings do perfil público
  const listings = user.recentListings || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          {isOwnProfile && (
            <Link
              href="/profile/edit"
              className="text-primary-600 font-medium hover:underline"
            >
              Editar perfil
            </Link>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl md:text-5xl font-bold text-primary-600">
                      {user.firstName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h1>
                </div>

                {user.userHandle && (
                  <p className="text-gray-500 mb-3">@{user.userHandle}</p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Membro há {memberSince}</span>
                  </div>
                  {user.stats.averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{user.stats.averageRating.toFixed(1)} ({user.stats.totalReviews} avaliações)</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      onClick={handleStartChat}
                      disabled={isStartingChat}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isStartingChat ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <MessageCircle className="w-5 h-5" />
                      )}
                      {isStartingChat ? 'Iniciando...' : 'Enviar mensagem'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 text-center">
              <Package className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{user.stats.activeListings}</p>
              <p className="text-sm text-gray-500">Anúncios</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {user.stats.averageRating > 0 ? user.stats.averageRating.toFixed(1) : '-'}
              </p>
              <p className="text-sm text-gray-500">Avaliação</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <MessageCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{user.stats.totalReviews}</p>
              <p className="text-sm text-gray-500">Avaliações</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {new Date(user.memberSince).getFullYear()}
              </p>
              <p className="text-sm text-gray-500">Desde</p>
            </div>
          </div>

          {/* User's Listings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Anúncios de {user.firstName}
              </h2>
              {listings.length > 0 && (
                <span className="text-sm text-gray-500">
                  {user.stats.activeListings} {user.stats.activeListings === 1 ? 'anúncio' : 'anúncios'}
                </span>
              )}
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum anúncio ativo no momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((listing) => {
                  const categoryInfo = CATEGORY_INFO[listing.category as keyof typeof CATEGORY_INFO];
                  return (
                    <Link
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      className="group"
                    >
                      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2">
                        <img
                          src={listing.images[0] || '/placeholder-listing.jpg'}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-primary-600 font-semibold">
                        {formatPrice(listing.price ?? undefined, listing.priceType)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: categoryInfo?.color || '#6B7280' }}
                        />
                        {categoryInfo?.label || 'Outro'}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
