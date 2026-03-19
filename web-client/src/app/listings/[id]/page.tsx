'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Clock,
  Eye,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  User,
  Calendar,
} from 'lucide-react';
import { useState } from 'react';
import { listingService, CATEGORY_INFO } from '@/services/listing.service';
import { chatService } from '@/services/chat.service';
import { useAuthStore } from '@/store';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => listingService.getById(listingId),
    enabled: !!listingId,
  });

  const formatPrice = (price?: number, priceType?: string) => {
    if (priceType === 'FREE') return 'Grátis';
    if (priceType === 'CONTACT') return 'A combinar';
    if (!price) return 'Consulte';
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const handleFavorite = async () => {
    if (!listing) return;
    try {
      if (isFavorited) {
        await listingService.unfavorite(listing.id);
      } else {
        await listingService.favorite(listing.id);
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Erro ao favoritar:', error);
    }
  };

  const handleShare = async () => {
    if (!listing) return;
    try {
      await navigator.share({
        title: listing.title,
        text: listing.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback: copiar link
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  const handleContact = async () => {
    if (!listing) return;
    
    // Verificar se está autenticado
    if (!isAuthenticated) {
      router.push(`/login?redirect=/listings/${listingId}`);
      return;
    }
    
    // Não permitir chat consigo mesmo
    if (user?.id === listing.userId) {
      alert('Você não pode conversar consigo mesmo');
      return;
    }
    
    setIsStartingChat(true);
    try {
      const conversation = await chatService.findOrCreateConversation(
        listing.userId,
        listing.id
      );
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
      alert('Erro ao iniciar conversa. Tente novamente.');
    } finally {
      setIsStartingChat(false);
    }
  };

  if (isLoading) {
    return <PageSpinner />;
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Anúncio não encontrado</p>
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

  const categoryInfo = CATEGORY_INFO[listing.category];
  const images = listing.images.length > 0 ? listing.images : ['/placeholder-listing.jpg'];

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-full transition-colors ${
                isFavorited
                  ? 'bg-red-50 text-red-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="Compartilhar"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden">
              <img
                src={images[currentImageIndex]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white shadow-lg"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white shadow-lg"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>

              {/* Category Badge */}
              <div
                className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: categoryInfo?.color || '#6B7280' }}
              >
                {categoryInfo?.label || 'Outro'}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? 'border-primary-500'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-8 bg-white rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Descrição</h2>
              <p className="text-gray-600 whitespace-pre-line">
                {listing.description || 'Sem descrição disponível.'}
              </p>

              {/* Tags */}
              {listing.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {listing.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Main Info Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              {/* Price */}
              <div className="mb-6">
                <p className="text-3xl font-bold text-primary-600">
                  {formatPrice(listing.price, listing.priceType)}
                </p>
                {listing.priceType === 'NEGOTIABLE' && (
                  <span className="text-sm text-gray-500">Aceita negociação</span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl font-bold text-gray-900 mb-4">{listing.title}</h1>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{listing.viewCount} visualizações</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{listing.favoriteCount}</span>
                </div>
              </div>

              {/* Location */}
              {listing.city && (
                <div className="flex items-start gap-2 text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 mt-0.5 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {listing.neighborhood ? `${listing.neighborhood}, ` : ''}
                      {listing.city}
                    </p>
                    {listing.state && <p className="text-sm text-gray-500">{listing.state}</p>}
                  </div>
                </div>
              )}

              {/* Posted Date */}
              <div className="flex items-center gap-2 text-gray-500 mb-6">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Publicado{' '}
                  {formatDistanceToNow(new Date(listing.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>

              {/* Seller Info */}
              {listing.user && (
                <div className="border-t pt-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {listing.user.avatarUrl ? (
                        <img
                          src={listing.user.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {listing.user.firstName} {listing.user.lastName}
                      </p>
                      {listing.user.userHandle && (
                        <p className="text-sm text-gray-500">@{listing.user.userHandle}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleContact}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Conversar com vendedor
                </button>
                <button className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                  <Phone className="w-5 h-5" />
                  Ver telefone
                </button>
              </div>

              {/* Safety Tips */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Dicas de segurança</p>
                    <p className="text-blue-600 mt-1">
                      Sempre combine encontros em locais públicos e verifique o produto antes de pagar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
