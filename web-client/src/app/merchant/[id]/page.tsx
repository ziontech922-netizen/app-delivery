'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Clock, MapPin, Phone, ArrowLeft, Store } from 'lucide-react';
import Link from 'next/link';
import { merchantService } from '@/services/merchant.service';
import { productService } from '@/services/product.service';
import ProductCard from '@/components/merchant/ProductCard';
import { PageSpinner } from '@/components/ui/Spinner';
import { ReviewsList } from '@/components/reviews';
import { RatingDisplay } from '@/components/ui/StarRating';
import type { Category, Product, Merchant } from '@/types';

interface MerchantPageProps {
  params: Promise<{ id: string }>;
}

export default function MerchantPage({ params }: MerchantPageProps) {
  const { id } = use(params);

  const { data: merchant, isLoading: loadingMerchant } = useQuery({
    queryKey: ['merchant', id],
    queryFn: () => merchantService.getById(id),
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productService.getByMerchant(id),
    enabled: !!id,
  });

  const products = productsData?.data || [];

  // Agrupar produtos por categoria
  const productsByCategory = products.reduce<Record<string, Product[]>>((acc, product) => {
    const categoryName = product.category?.name || 'Outros';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {});

  if (loadingMerchant || loadingProducts) {
    return <PageSpinner />;
  }

  if (!merchant) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Restaurante não encontrado
        </h1>
        <Link href="/" className="text-primary-600 hover:underline">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Hero Image */}
      <div className="relative h-48 md:h-64 bg-gray-200">
        {merchant.bannerUrl ? (
          <img
            src={merchant.bannerUrl}
            alt={merchant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
      </div>

      {/* Merchant Info */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-16 bg-white rounded-t-3xl px-6 pt-6 pb-4">
          {/* Logo */}
          <div className="absolute -top-10 left-6 w-20 h-20 bg-white rounded-xl shadow-lg overflow-hidden border-4 border-white">
            {merchant.logoUrl ? (
              <img
                src={merchant.logoUrl}
                alt={merchant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Store className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="ml-24 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{merchant.name}</h1>
                {merchant.category && (
                  <p className="text-gray-500 mt-1">{merchant.category}</p>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  merchant.isOpen
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {merchant.isOpen ? 'Aberto' : 'Fechado'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t text-sm">
            {merchant.rating !== undefined && merchant.rating > 0 ? (
              <RatingDisplay 
                rating={merchant.rating} 
                totalReviews={merchant.reviewCount || 0} 
                size="md" 
              />
            ) : (
              <RatingDisplay rating={null} totalReviews={0} size="md" />
            )}
            
            {merchant.deliveryTime && (
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{merchant.deliveryTime}</span>
              </div>
            )}

            {merchant.deliveryFee !== undefined && (
              <span className="text-gray-600">
                Taxa de entrega:{' '}
                <span className="font-medium">
                  {merchant.deliveryFee === 0
                    ? 'Grátis'
                    : `R$ ${merchant.deliveryFee.toFixed(2).replace('.', ',')}`}
                </span>
              </span>
            )}

            {merchant.minOrder !== undefined && merchant.minOrder > 0 && (
              <span className="text-gray-600">
                Pedido mínimo:{' '}
                <span className="font-medium">
                  R$ {merchant.minOrder.toFixed(2).replace('.', ',')}
                </span>
              </span>
            )}
          </div>

          {/* Description */}
          {merchant.description && (
            <p className="text-gray-600 mt-4">{merchant.description}</p>
          )}

          {/* Reviews Section */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Avaliações</h3>
            <ReviewsList merchantId={id} />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 mt-6">
        {Object.keys(productsByCategory).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">Nenhum produto disponível no momento</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
              <section key={categoryName}>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {categoryName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      merchant={merchant}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
