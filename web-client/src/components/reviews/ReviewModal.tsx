'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { RatingInput, StarRating } from '@/components/ui/StarRating';
import { useCreateReview } from '@/hooks/useReviews';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  merchantName: string;
  driverName?: string | null;
  hasDriver: boolean;
}

export function ReviewModal({
  isOpen,
  onClose,
  orderId,
  merchantName,
  driverName,
  hasDriver,
}: ReviewModalProps) {
  const [merchantRating, setMerchantRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [merchantComment, setMerchantComment] = useState('');
  const [driverComment, setDriverComment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createReview = useCreateReview();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (merchantRating === 0) {
      newErrors.merchantRating = 'Avalie o estabelecimento';
    }

    if (hasDriver && driverRating === 0) {
      newErrors.driverRating = 'Avalie o entregador';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await createReview.mutateAsync({
        orderId,
        merchantRating,
        driverRating: hasDriver ? driverRating : undefined,
        merchantComment: merchantComment.trim() || undefined,
        driverComment: hasDriver && driverComment.trim() ? driverComment.trim() : undefined,
      });

      onClose();
    } catch (error) {
      console.error('Failed to create review:', error);
    }
  };

  const handleClose = () => {
    setMerchantRating(0);
    setDriverRating(0);
    setMerchantComment('');
    setDriverComment('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Avaliar Pedido
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Merchant Rating */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">{merchantName}</h3>
            <RatingInput
              value={merchantRating}
              onChange={setMerchantRating}
              label="Como foi a comida?"
              required
              error={errors.merchantRating}
            />
            <textarea
              value={merchantComment}
              onChange={(e) => setMerchantComment(e.target.value)}
              placeholder="Deixe um comentário (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Driver Rating */}
          {hasDriver && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-medium text-gray-900">
                Entregador{driverName ? `: ${driverName}` : ''}
              </h3>
              <RatingInput
                value={driverRating}
                onChange={setDriverRating}
                label="Como foi a entrega?"
                required
                error={errors.driverRating}
              />
              <textarea
                value={driverComment}
                onChange={(e) => setDriverComment(e.target.value)}
                placeholder="Deixe um comentário (opcional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                  resize-none"
                rows={3}
                maxLength={500}
              />
            </div>
          )}

          {/* Error message */}
          {createReview.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              Erro ao enviar avaliação. Tente novamente.
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg
                hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createReview.isPending}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg
                hover:bg-orange-600 transition-colors font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {createReview.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Avaliação'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
