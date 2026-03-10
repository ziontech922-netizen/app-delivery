'use client';

import { Plus, ImageOff } from 'lucide-react';
import type { Product, Merchant } from '@/types';
import { useCartStore } from '@/store';
import { formatCurrency } from '@/utils/format';
import Card from '@/components/ui/Card';

interface ProductCardProps {
  product: Product;
  merchant?: Merchant;
}

export default function ProductCard({ product, merchant }: ProductCardProps) {
  const { addItem, setMerchant } = useCartStore();

  const handleAddToCart = () => {
    if (merchant) {
      setMerchant(merchant);
    }
    addItem(product, 1);
  };

  const isAvailable = product.isAvailable !== false;

  return (
    <Card
      variant="bordered"
      padding="none"
      className={`overflow-hidden ${!isAvailable ? 'opacity-60' : ''}`}
    >
      <div className="flex">
        {/* Content */}
        <div className="flex-1 p-4">
          <h4 className="font-medium text-gray-900 line-clamp-1">
            {product.name}
          </h4>
          {product.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <p className="font-semibold text-primary-600">
              {formatCurrency(product.price)}
            </p>
            {isAvailable ? (
              <button
                onClick={handleAddToCart}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            ) : (
              <span className="text-xs text-red-600 font-medium">
                Indisponível
              </span>
            )}
          </div>
        </div>

        {/* Image */}
        <div className="w-28 h-28 flex-shrink-0 bg-gray-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="h-8 w-8 text-gray-300" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
