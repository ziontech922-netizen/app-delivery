'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store';
import { userService, type ReviewData } from '@/services/user.service';

export default function ReviewsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadReviews();
  }, [isAuthenticated, router]);

  const loadReviews = async () => {
    try {
      const data = await userService.getReviews();
      setReviews(data);
    } catch {
      // No reviews yet is OK
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Minhas avaliações</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-yellow-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma avaliação</h2>
            <p className="text-gray-500 max-w-xs mx-auto">
              Após receber um pedido, você poderá avaliar o restaurante e o entregador.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start gap-3 mb-3">
                  {review.merchant.logoUrl ? (
                    <img src={review.merchant.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-600">{review.merchant.businessName.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{review.merchant.tradeName || review.merchant.businessName}</p>
                    <p className="text-xs text-gray-400">Pedido #{review.order.orderNumber}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-24">Restaurante:</span>
                    {renderStars(review.merchantRating)}
                  </div>
                  {review.driverRating && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 w-24">Entregador:</span>
                      {renderStars(review.driverRating)}
                    </div>
                  )}
                </div>
                {review.merchantComment && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                    &quot;{review.merchantComment}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
