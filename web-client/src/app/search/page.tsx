'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSearch } from '@/hooks/useSearch';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchMerchantResult, SearchProductResult } from '@/types/search';
import Image from 'next/image';
import Link from 'next/link';
import { PageSpinner } from '@/components/ui/Spinner';
import { useState, useEffect } from 'react';

// Separate component for search results content
function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<'all' | 'merchants' | 'products'>('all');

  // Build search params
  const searchQuery = query ? { q: query, page: 1, limit: 50 } : null;
  const { data, isLoading, error } = useSearch(searchQuery);

  // Handle search from SearchBar
  const handleSearch = (newQuery: string) => {
    router.push(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Search */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <SearchBar
            initialValue={query}
            onSearch={handleSearch}
            placeholder="Buscar restaurantes e pratos..."
            size="md"
            className="max-w-2xl mx-auto"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* No query state */}
        {!query && (
          <div className="text-center py-16">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              O que você está procurando?
            </h2>
            <p className="text-gray-500">
              Digite o nome de um restaurante ou prato acima
            </p>
          </div>
        )}

        {/* Loading */}
        {query && isLoading && (
          <div className="py-16">
            <PageSpinner />
          </div>
        )}

        {/* Error */}
        {query && error && (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto text-red-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Erro ao buscar
            </h2>
            <p className="text-gray-500">
              Não foi possível realizar a busca. Tente novamente.
            </p>
          </div>
        )}

        {/* Results */}
        {query && data && !isLoading && (
          <>
            {/* Results Summary */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Resultados para &quot;{data.query}&quot;
              </h1>
              <p className="text-gray-500">
                {data.totalMerchants} restaurantes e {data.totalProducts} pratos encontrados
              </p>
            </div>

            {/* No results */}
            {data.totalMerchants === 0 && data.totalProducts === 0 && (
              <div className="text-center py-16">
                <svg
                  className="w-24 h-24 mx-auto text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum resultado encontrado
                </h2>
                <p className="text-gray-500">
                  Tente buscar por outros termos ou categorias
                </p>
              </div>
            )}

            {/* Tabs */}
            {(data.totalMerchants > 0 || data.totalProducts > 0) && (
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
                    activeTab === 'all'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Todos ({data.totalMerchants + data.totalProducts})
                </button>
                <button
                  onClick={() => setActiveTab('merchants')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
                    activeTab === 'merchants'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Restaurantes ({data.totalMerchants})
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
                    activeTab === 'products'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pratos ({data.totalProducts})
                </button>
              </div>
            )}

            {/* Merchants Section */}
            {(activeTab === 'all' || activeTab === 'merchants') && data.merchants.length > 0 && (
              <section className="mb-8">
                {activeTab === 'all' && (
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Restaurantes</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.merchants.map((merchant) => (
                    <MerchantResultCard key={merchant.id} merchant={merchant} />
                  ))}
                </div>
              </section>
            )}

            {/* Products Section */}
            {(activeTab === 'all' || activeTab === 'products') && data.products.length > 0 && (
              <section>
                {activeTab === 'all' && (
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Pratos</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data.products.map((product) => (
                    <ProductResultCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Merchant Result Card
function MerchantResultCard({ merchant }: { merchant: SearchMerchantResult }) {
  return (
    <Link
      href={`/merchant/${merchant.id}`}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4 p-4">
        {/* Logo */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {merchant.logoUrl ? (
            <Image
              src={merchant.logoUrl}
              alt={merchant.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {merchant.name}
            </h3>
            {merchant.isOpen !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                merchant.isOpen 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {merchant.isOpen ? 'Aberto' : 'Fechado'}
              </span>
            )}
          </div>

          {/* Rating */}
          {merchant.rating && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
              <span>{Number(merchant.rating).toFixed(1)}</span>
              {merchant.reviewCount > 0 && (
                <span className="text-gray-400">({merchant.reviewCount})</span>
              )}
            </div>
          )}

          {/* Delivery info */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
            {merchant.estimatedTime && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {merchant.estimatedTime}
              </span>
            )}
            {merchant.deliveryFee !== undefined && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {Number(merchant.deliveryFee) === 0 ? 'Grátis' : `R$ ${Number(merchant.deliveryFee).toFixed(2)}`}
              </span>
            )}
            {merchant.distance && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {Number(merchant.distance).toFixed(1)} km
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Product Result Card
function ProductResultCard({ product }: { product: SearchProductResult }) {
  return (
    <Link
      href={`/merchant/${product.merchantId}`}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Product Image */}
      <div className="relative h-40 bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-medium text-sm">Indisponível</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate mb-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary-600">
            R$ {Number(product.price).toFixed(2)}
          </span>
          {/* Merchant info */}
          <div className="flex items-center gap-2">
            {product.merchantLogoUrl && (
              <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-100">
                <Image
                  src={product.merchantLogoUrl}
                  alt={product.merchantName}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <span className="text-xs text-gray-500 truncate max-w-[100px]">
              {product.merchantName}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Main page component with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <SearchResultsContent />
    </Suspense>
  );
}
