'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Newspaper, 
  MapPin, 
  Clock, 
  ChevronRight,
  Tag,
  Megaphone,
  Store,
  Calendar,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { feedService, type FeedItem, type FeedItemType, type FeedQuery } from '@/services/feed.service';

const FEED_FILTERS: { type: FeedItemType | 'ALL'; label: string; icon: typeof Tag }[] = [
  { type: 'ALL', label: 'Tudo', icon: Newspaper },
  { type: 'NEW_LISTING', label: 'Anúncios', icon: Tag },
  { type: 'PROMOTION', label: 'Promoções', icon: Megaphone },
  { type: 'NEW_MERCHANT', label: 'Parceiros', icon: Store },
  { type: 'ANNOUNCEMENT', label: 'Comunicados', icon: Megaphone },
  { type: 'EVENT', label: 'Eventos', icon: Calendar },
];

const FEED_TYPE_CONFIG: Record<FeedItemType, { color: string; bgColor: string; label: string }> = {
  NEW_LISTING: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Novo Anúncio' },
  PROMOTION: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Promoção' },
  NEW_MERCHANT: { color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Novo Parceiro' },
  SPONSORED: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Patrocinado' },
  ANNOUNCEMENT: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Comunicado' },
  EVENT: { color: 'text-pink-600', bgColor: 'bg-pink-100', label: 'Evento' },
};

export default function FeedPage() {
  const [selectedFilter, setSelectedFilter] = useState<FeedItemType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const query: FeedQuery = {
    page,
    limit: 20,
    ...(selectedFilter !== 'ALL' && { type: selectedFilter }),
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['feed', query],
    queryFn: () => feedService.getFeed(query),
    staleTime: 60000,
  });

  const feedItems = data?.data || [];
  const meta = data?.meta;
  const hasMore = meta ? page < meta.totalPages : false;

  const handleFilterChange = (type: FeedItemType | 'ALL') => {
    setSelectedFilter(type);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-orange-500" />
                Feed da Comunidade
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Novidades, promoções e eventos da sua região
              </p>
            </div>
            <button
              title="Atualizar feed"
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {FEED_FILTERS.map((filter) => (
              <button
                key={filter.type}
                onClick={() => handleFilterChange(filter.type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedFilter === filter.type
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
                }`}
              >
                <filter.icon className="h-4 w-4" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Feed Content */}
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : feedItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Newspaper className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma novidade encontrada
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {selectedFilter !== 'ALL'
                ? 'Não há itens nesta categoria no momento'
                : 'O feed está vazio. Volte mais tarde para ver novidades!'}
            </p>
            {selectedFilter !== 'ALL' && (
              <button
                onClick={() => handleFilterChange('ALL')}
                className="text-orange-600 font-medium hover:underline"
              >
                Ver todos os itens
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {feedItems.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {meta && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página {page} de {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const config = FEED_TYPE_CONFIG[item.type];

  const getLink = () => {
    if (item.linkUrl) return item.linkUrl;
    if (item.listing) return `/listings/${item.listing.id}`;
    if (item.merchant) return `/merchant/${item.merchant.id}`;
    return '#';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Link href={getLink()} className="group block">
      <article className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="relative h-48 bg-gray-100">
          {item.imageUrl || item.listing?.images?.[0] ? (
            <Image
              src={item.imageUrl || item.listing?.images?.[0] || ''}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Tag className="h-12 w-12 text-gray-300" />
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${config.bgColor} ${config.color} text-xs font-semibold rounded-full`}>
              {config.label}
            </span>
          </div>

          {/* Featured Badge */}
          {item.listing?.isFeatured && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                <TrendingUp className="h-3 w-3" />
                Destaque
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-orange-600 transition-colors">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTimeAgo(item.createdAt)}
            </div>
            {item.listing?.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {item.listing.city}
              </div>
            )}
          </div>

          {/* Price (if listing) */}
          {item.listing?.price && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-2xl font-bold text-orange-600">
                {formatPrice(item.listing.price)}
              </span>
              <span className="text-sm text-gray-400">
                {item.listing.priceType === 'NEGOTIABLE' && 'Negociável'}
              </span>
            </div>
          )}

          {/* Merchant info (if NEW_MERCHANT) */}
          {item.merchant && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
              {item.merchant.logoUrl && (
                <Image
                  src={item.merchant.logoUrl}
                  alt={item.merchant.tradeName}
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.merchant.tradeName}</p>
                <p className="text-xs text-gray-500">{item.merchant.cuisineType}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-orange-500 transition-colors" />
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
