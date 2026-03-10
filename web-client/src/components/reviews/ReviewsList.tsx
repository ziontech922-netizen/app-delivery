'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, User } from 'lucide-react';
import { StarRating, RatingDisplay } from '@/components/ui/StarRating';
import { useMerchantReviews } from '@/hooks/useReviews';
import { Review, RatingDistribution } from '@/services/reviews.service';

interface ReviewsListProps {
  merchantId: string;
  initialOpen?: boolean;
}

export function ReviewsList({ merchantId, initialOpen = false }: ReviewsListProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [page, setPage] = useState(1);
  const limit = 5;

  const { data, isLoading, isError } = useMerchantReviews(merchantId, page, limit);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-sm text-gray-500">
        Erro ao carregar avaliações
      </div>
    );
  }

  const { reviews, averageRating, totalReviews, distribution } = data;

  if (totalReviews === 0) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        Ainda não há avaliações para este estabelecimento
      </div>
    );
  }

  const totalPages = Math.ceil(totalReviews / limit);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg
          hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <RatingDisplay rating={averageRating} totalReviews={totalReviews} size="md" />
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="space-y-4">
          {/* Distribution */}
          <RatingDistributionBars distribution={distribution} total={totalReviews} />

          {/* Reviews List */}
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:bg-gray-50"
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  const customerName = review.customer
    ? `${review.customer.firstName} ${review.customer.lastName.charAt(0)}.`
    : 'Cliente';

  const date = new Date(review.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="p-3 bg-white border rounded-lg space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{customerName}</p>
            <p className="text-xs text-gray-500">{date}</p>
          </div>
        </div>
        <StarRating rating={review.merchantRating} size="sm" />
      </div>

      {/* Comment */}
      {review.merchantComment && (
        <p className="text-sm text-gray-600 leading-relaxed">
          {review.merchantComment}
        </p>
      )}
    </div>
  );
}

interface RatingDistributionBarsProps {
  distribution: RatingDistribution;
  total: number;
}

function RatingDistributionBars({ distribution, total }: RatingDistributionBarsProps) {
  const ratings = [5, 4, 3, 2, 1] as const;

  return (
    <div className="space-y-1.5">
      {ratings.map((rating) => {
        const count = distribution[rating];
        const percentage = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-3">{rating}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
