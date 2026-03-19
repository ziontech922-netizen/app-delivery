'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Clock, MapPin, Tag, Megaphone, Calendar, Store } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { feedService, type FeedItem, type FeedItemType } from '@/services/feed.service';

interface FeedSectionProps {
  city?: string;
  limit?: number;
  showHeader?: boolean;
}

const FEED_TYPE_CONFIG: Record<FeedItemType, { icon: typeof Tag; color: string; label: string }> = {
  NEW_LISTING: { icon: Tag, color: 'bg-blue-500', label: 'Novo Anúncio' },
  PROMOTION: { icon: Megaphone, color: 'bg-green-500', label: 'Promoção' },
  NEW_MERCHANT: { icon: Store, color: 'bg-purple-500', label: 'Novo Parceiro' },
  SPONSORED: { icon: Tag, color: 'bg-orange-500', label: 'Patrocinado' },
  ANNOUNCEMENT: { icon: Megaphone, color: 'bg-red-500', label: 'Comunicado' },
  EVENT: { icon: Calendar, color: 'bg-pink-500', label: 'Evento' },
};

function FeedCard({ item }: { item: FeedItem }) {
  const config = FEED_TYPE_CONFIG[item.type];
  const Icon = config.icon;

  const getLink = () => {
    if (item.linkUrl) return item.linkUrl;
    if (item.listing) return `/listings/${item.listing.id}`;
    if (item.merchant) return `/merchant/${item.merchant.id}`;
    return '#';
  };

  return (
    <Link href={getLink()} className="block group">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative h-40 bg-gray-100">
          {item.imageUrl || item.listing?.images?.[0] ? (
            <Image
              src={item.imageUrl || item.listing?.images?.[0] || ''}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Icon className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* Badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 ${config.color} text-white text-xs font-medium rounded-full`}>
              <Icon className="h-3 w-3" />
              {config.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
          )}
          
          {/* Meta */}
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(item.createdAt)}
            </div>
            {item.listing?.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {item.listing.city}
              </div>
            )}
          </div>

          {/* Price (if listing) */}
          {item.listing?.price && (
            <div className="mt-3 text-lg font-bold text-orange-600">
              {formatPrice(item.listing.price)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

export default function FeedSection({ city, limit = 6, showHeader = true }: FeedSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['feed', city, limit],
    queryFn: () => feedService.getFeed({ city, limit }),
    staleTime: 2 * 60 * 1000,
  });

  const feedItems = data?.data || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
            <div className="h-40 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (feedItems.length === 0) {
    return null;
  }

  return (
    <section>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">📢 Novidades da Comunidade</h2>
            <p className="text-sm text-gray-500 mt-1">Veja o que está acontecendo por perto</p>
          </div>
          <Link
            href="/feed"
            className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Ver tudo
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {feedItems.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
