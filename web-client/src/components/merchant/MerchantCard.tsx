import Link from 'next/link';
import { Star, Clock, Store } from 'lucide-react';
import type { Merchant } from '@/types';
import Card from '@/components/ui/Card';

interface MerchantCardProps {
  merchant: Merchant;
}

export default function MerchantCard({ merchant }: MerchantCardProps) {
  return (
    <Link href={`/merchant/${merchant.id}`}>
      <Card
        variant="bordered"
        padding="none"
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      >
        {/* Image */}
        <div className="relative h-40 bg-gray-100">
          {merchant.logoUrl ? (
            <img
              src={merchant.logoUrl}
              alt={merchant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store className="h-12 w-12 text-gray-300" />
            </div>
          )}
          {!merchant.isOpen && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium px-3 py-1 bg-red-600 rounded-full text-sm">
                Fechado
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate">
            {merchant.name}
          </h3>

          {/* Category */}
          {merchant.category && (
            <p className="text-sm text-gray-500 mt-1">
              {merchant.category}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            {/* Rating */}
            {merchant.rating !== undefined && merchant.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="font-medium">{merchant.rating.toFixed(1)}</span>
              </div>
            )}

            {/* Delivery Time */}
            {merchant.deliveryTime && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{merchant.deliveryTime}</span>
              </div>
            )}

            {/* Delivery Fee */}
            {merchant.deliveryFee !== undefined && (
              <span className="text-gray-500">
                {merchant.deliveryFee === 0
                  ? 'Entrega grátis'
                  : `R$ ${merchant.deliveryFee.toFixed(2).replace('.', ',')}`}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
