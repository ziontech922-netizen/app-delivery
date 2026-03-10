'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  MessageSquare,
  Send,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Filter,
  X,
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { merchantDashboardService, MerchantReview } from '@/services/merchant.dashboard.service';

export default function MerchantReviewsPage() {
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Fetch reviews
  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'reviews', ratingFilter],
    queryFn: () =>
      merchantDashboardService.getReviews({
        rating: ratingFilter || undefined,
      }),
    placeholderData: {
      data: [
        {
          id: 'r1',
          orderId: 'o1',
          orderNumber: 'ORD-2024-001',
          customerId: 'c1',
          customerName: 'João Silva',
          rating: 5,
          comment: 'Pizza maravilhosa! Chegou quentinha e no prazo. Com certeza vou pedir novamente!',
          reply: null,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          repliedAt: null,
        },
        {
          id: 'r2',
          orderId: 'o2',
          orderNumber: 'ORD-2024-002',
          customerId: 'c2',
          customerName: 'Maria Santos',
          rating: 4,
          comment: 'Comida muito boa, mas demorou um pouco mais do que o esperado.',
          reply: 'Olá Maria! Obrigado pelo feedback. Pedimos desculpas pela demora, estávamos com movimento alto nesse dia. Vamos melhorar!',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          repliedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'r3',
          orderId: 'o3',
          orderNumber: 'ORD-2024-003',
          customerId: 'c3',
          customerName: 'Carlos Lima',
          rating: 5,
          comment: 'Melhor pizzaria da região! Atendimento impecável.',
          reply: null,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          repliedAt: null,
        },
        {
          id: 'r4',
          orderId: 'o4',
          orderNumber: 'ORD-2024-004',
          customerId: 'c4',
          customerName: 'Ana Paula',
          rating: 3,
          comment: 'Pizza estava boa, mas veio com menos recheio do que o normal.',
          reply: null,
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          repliedAt: null,
        },
        {
          id: 'r5',
          orderId: 'o5',
          orderNumber: 'ORD-2024-005',
          customerId: 'c5',
          customerName: 'Ricardo Mendes',
          rating: 5,
          comment: 'Perfeito! Sabor incrível e entrega super rápida.',
          reply: 'Obrigado Ricardo! Ficamos muito felizes com seu feedback! 🍕',
          createdAt: new Date(Date.now() - 432000000).toISOString(),
          repliedAt: new Date(Date.now() - 345600000).toISOString(),
        },
        {
          id: 'r6',
          orderId: 'o6',
          orderNumber: 'ORD-2024-006',
          customerId: 'c6',
          customerName: 'Fernanda Oliveira',
          rating: 2,
          comment: 'Pizza chegou fria e a borda estava queimada.',
          reply: null,
          createdAt: new Date(Date.now() - 518400000).toISOString(),
          repliedAt: null,
        },
      ],
      total: 6,
      page: 1,
      totalPages: 1,
      averageRating: 4.0,
      totalReviews: 6,
      ratingDistribution: {
        1: 0,
        2: 1,
        3: 1,
        4: 1,
        5: 3,
      },
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      merchantDashboardService.replyToReview(reviewId, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'reviews'] });
      setReplyingTo(null);
      setReplyText('');
    },
  });

  const reviews = data?.data || [];
  const stats = {
    averageRating: data?.averageRating || 0,
    totalReviews: data?.totalReviews || 0,
    ratingDistribution: data?.ratingDistribution || {},
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderStars = (rating: number, size = 'sm') => {
    const sizeClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleSubmitReply = (reviewId: string) => {
    if (replyText.trim()) {
      replyMutation.mutate({ reviewId, reply: replyText });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
        <p className="text-gray-500 mt-1">Veja o que seus clientes estão dizendo</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Rating */}
        <Card className="p-6 text-center">
          <p className="text-5xl font-bold text-gray-900 mb-2">
            {stats.averageRating.toFixed(1)}
          </p>
          {renderStars(Math.round(stats.averageRating), 'lg')}
          <p className="text-sm text-gray-500 mt-2">
            Baseado em {stats.totalReviews} avaliações
          </p>
        </Card>

        {/* Rating Distribution */}
        <Card className="p-6 col-span-1 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Distribuição de Avaliações</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <button
                    onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                    className={`flex items-center gap-1 min-w-[60px] text-sm ${
                      ratingFilter === rating ? 'text-primary-600 font-medium' : 'text-gray-600'
                    }`}
                  >
                    {rating} <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </button>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 min-w-[40px] text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter className="h-4 w-4" />
            <span className="text-sm">Filtrar:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRatingFilter(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                ratingFilter === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                  ratingFilter === rating
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {rating} <Star className="h-3 w-3" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setRatingFilter(null)}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            Sem resposta
            <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs">
              {reviews.filter((r) => !r.reply).length}
            </span>
          </button>
        </div>
      </Card>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhuma avaliação encontrada</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card
              key={review.id}
              className={`p-6 ${!review.reply ? 'border-l-4 border-l-yellow-400' : ''}`}
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.customerName}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{review.orderNumber}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="text-sm font-medium text-gray-500">{review.rating}.0</span>
                </div>
              </div>

              {/* Review Content */}
              <p className="text-gray-700 mb-4">{review.comment}</p>

              {/* Quick Sentiment */}
              <div className="flex items-center gap-4 mb-4">
                {review.rating >= 4 ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <ThumbsUp className="h-4 w-4" />
                    Positiva
                  </span>
                ) : review.rating <= 2 ? (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <ThumbsDown className="h-4 w-4" />
                    Negativa
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-yellow-600">
                    Neutra
                  </span>
                )}
              </div>

              {/* Existing Reply */}
              {review.reply && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-primary-600" />
                    <span className="text-sm font-medium text-gray-900">Sua resposta</span>
                    {review.repliedAt && (
                      <span className="text-xs text-gray-400">
                        • {formatDate(review.repliedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{review.reply}</p>
                </div>
              )}

              {/* Reply Form */}
              {!review.reply && replyingTo !== review.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyingTo(review.id)}
                  className="mt-2"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Responder
                </Button>
              )}

              {replyingTo === review.id && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(review.id)}
                      isLoading={replyMutation.isPending}
                      disabled={!replyText.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Resposta
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Tips Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Dicas para responder avaliações</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Responda rapidamente, especialmente avaliações negativas</li>
          <li>• Seja educado e profissional, mesmo em críticas</li>
          <li>• Agradeça feedbacks positivos e incentive o cliente a voltar</li>
          <li>• Ofereça soluções concretas para problemas relatados</li>
        </ul>
      </Card>
    </div>
  );
}
