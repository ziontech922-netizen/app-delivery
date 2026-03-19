'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Grid,
  List,
  MapPin,
  Package,
  Car,
  Home,
  Briefcase,
  Wrench,
  Smartphone,
  Shirt,
  Dumbbell,
  PawPrint,
  UtensilsCrossed,
  Flower2,
  MoreHorizontal,
} from 'lucide-react';
import { listingService, Listing, ListingCategory, CATEGORY_INFO } from '@/services/listing.service';
import { PageSpinner } from '@/components/ui/Spinner';

// Icon mapping
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Car,
  Home,
  Briefcase,
  Wrench,
  Smartphone,
  Shirt,
  Dumbbell,
  PawPrint,
  UtensilsCrossed,
  Flower2,
  MoreHorizontal,
};

// Listing Card Component
function ListingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const categoryInfo = CATEGORY_INFO[listing.category];
  const IconComponent = CATEGORY_ICONS[categoryInfo?.icon] || Package;

  const formatPrice = (price?: number, priceType?: string) => {
    if (priceType === 'FREE') return 'Grátis';
    if (priceType === 'CONTACT') return 'A combinar';
    if (!price) return 'Consulte';
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
      onClick={() => router.push(`/listings/${listing.id}`)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IconComponent className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Category Badge */}
        <div
          className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: categoryInfo?.color || '#6B7280' }}
        >
          {categoryInfo?.label || 'Outro'}
        </div>

        {/* Featured Badge */}
        {listing.isFeatured && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-medium">
            Destaque
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {listing.title}
        </h3>

        <p className="mt-2 text-lg font-bold text-primary-600">
          {formatPrice(listing.price, listing.priceType)}
        </p>

        {listing.city && (
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>
              {listing.neighborhood ? `${listing.neighborhood}, ` : ''}
              {listing.city}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span>{listing.viewCount} visualizações</span>
          <span>{listing.favoriteCount} favoritos</span>
        </div>
      </div>
    </div>
  );
}

// Categories Filter
function CategoryFilter({
  selected,
  onSelect,
}: {
  selected: ListingCategory | null;
  onSelect: (category: ListingCategory | null) => void;
}) {
  const categories: (ListingCategory | null)[] = [
    null,
    'PRODUCTS',
    'VEHICLES',
    'REAL_ESTATE',
    'ELECTRONICS',
    'SERVICES',
    'JOBS',
    'FASHION',
    'HOME_GARDEN',
    'SPORTS',
    'PETS',
    'FOOD',
    'OTHER',
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => {
        const info = cat ? CATEGORY_INFO[cat] : { label: 'Todos', icon: 'Grid', color: '#6B7280' };
        const IconComponent = CATEGORY_ICONS[info.icon] || Grid;
        const isSelected = selected === cat;

        return (
          <button
            key={cat || 'all'}
            onClick={() => onSelect(cat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              isSelected
                ? 'text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
            }`}
            style={isSelected ? { backgroundColor: info.color } : undefined}
          >
            <IconComponent className="w-4 h-4" />
            {info.label}
          </button>
        );
      })}
    </div>
  );
}

// Main Page Component
export default function ListingsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ListingCategory | null>(null);
  const [sortBy, setSortBy] = useState<'createdAt' | 'price'>('createdAt');

  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', { category, search, sortBy }],
    queryFn: () =>
      listingService.list({
        category: category || undefined,
        search: search || undefined,
        sortBy,
        sortOrder: sortBy === 'price' ? 'asc' : 'desc',
        limit: 24,
      }),
  });

  const listings = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Marketplace Local</h1>
              <p className="text-primary-100">Compre e venda de tudo na sua cidade</p>
            </div>
            <button
              onClick={() => router.push('/listings/create')}
              className="flex items-center gap-2 bg-white text-primary-600 px-5 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Publicar
            </button>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="container mx-auto px-4 -mt-5">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar anúncios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'price')}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="createdAt">Mais recentes</option>
              <option value="price">Menor preço</option>
            </select>
          </div>

          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>
      </section>

      {/* Listings Grid */}
      <section className="container mx-auto px-4 py-8">
        {isLoading ? (
          <PageSpinner />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Erro ao carregar anúncios</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum anúncio encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              Seja o primeiro a publicar nesta categoria!
            </p>
            <button
              onClick={() => router.push('/listings/create')}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Publicar agora
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500">
                {data?.meta.total || 0} anúncios encontrados
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {data && data.meta.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: Math.min(data.meta.totalPages, 5) }).map((_, i) => (
                  <button
                    key={i}
                    className={`w-10 h-10 rounded-lg font-medium ${
                      data.meta.page === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
