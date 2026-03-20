'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  MapPin, 
  Utensils, 
  ShoppingBag, 
  Wrench, 
  Car, 
  Briefcase, 
  Home as HomeIcon,
  MessageCircle, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  Star,
  Clock,
  Smartphone,
  Laptop,
  Shirt,
  Sofa,
  Dumbbell,
  PawPrint,
  Gift,
  Zap,
  Trophy,
  Users,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { merchantService } from '@/services/merchant.service';
import { listingService, type ListingCategory } from '@/services/listing.service';
import MerchantCard from '@/components/merchant/MerchantCard';
import SponsorCarousel from '@/components/sponsor/SponsorCarousel';
import FeedSection from '@/components/feed/FeedSection';
import { PageSpinner } from '@/components/ui/Spinner';

// ===========================================
// SUPER APP CATEGORIES (GRID PRINCIPAL)
// ===========================================

const MAIN_CATEGORIES = [
  { 
    id: 'food', 
    label: 'Comida', 
    icon: Utensils, 
    color: 'bg-orange-500', 
    href: '/#restaurants',
  },
  { 
    id: 'products', 
    label: 'Produtos', 
    icon: ShoppingBag, 
    color: 'bg-blue-500', 
    href: '/listings?category=PRODUCTS',
  },
  { 
    id: 'services', 
    label: 'Serviços', 
    icon: Wrench, 
    color: 'bg-purple-500', 
    href: '/listings?category=SERVICES',
  },
  { 
    id: 'vehicles', 
    label: 'Veículos', 
    icon: Car, 
    color: 'bg-green-500', 
    href: '/listings?category=VEHICLES',
  },
  { 
    id: 'jobs', 
    label: 'Empregos', 
    icon: Briefcase, 
    color: 'bg-red-500', 
    href: '/listings?category=JOBS',
  },
  { 
    id: 'real_estate', 
    label: 'Imóveis', 
    icon: HomeIcon, 
    color: 'bg-amber-500', 
    href: '/listings?category=REAL_ESTATE',
  },
];

// ===========================================
// MARKETPLACE SUB-CATEGORIES
// ===========================================

const MARKETPLACE_CATEGORIES: { 
  category: ListingCategory; 
  label: string; 
  icon: typeof Smartphone 
}[] = [
  { category: 'ELECTRONICS', label: 'Eletrônicos', icon: Smartphone },
  { category: 'FASHION', label: 'Moda', icon: Shirt },
  { category: 'HOME_GARDEN', label: 'Casa', icon: Sofa },
  { category: 'SPORTS', label: 'Esportes', icon: Dumbbell },
  { category: 'PETS', label: 'Pets', icon: PawPrint },
  { category: 'OTHER', label: 'Outros', icon: Gift },
];

// ===========================================
// FOOD CATEGORIES (DELIVERY)
// ===========================================

const FOOD_CATEGORIES = [
  { id: 'all', label: 'Todos', emoji: '🍽️' },
  { id: 'pizza', label: 'Pizzaria', emoji: '🍕' },
  { id: 'burger', label: 'Hambúrguer', emoji: '🍔' },
  { id: 'japanese', label: 'Japonês', emoji: '🍣' },
  { id: 'brazilian', label: 'Brasileira', emoji: '🍛' },
  { id: 'healthy', label: 'Saudável', emoji: '🥗' },
  { id: 'dessert', label: 'Doces', emoji: '🍰' },
  { id: 'drinks', label: 'Bebidas', emoji: '🥤' },
];

// ===========================================
// STATS
// ===========================================

const STATS = [
  { icon: Users, value: '50K+', label: 'Usuários ativos' },
  { icon: ShoppingBag, value: '10K+', label: 'Anúncios' },
  { icon: Trophy, value: '500+', label: 'Parceiros' },
  { icon: Star, value: '4.9', label: 'Avaliação média' },
];

// ===========================================
// HOME PAGE COMPONENT
// ===========================================

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [selectedFoodCategory, setSelectedFoodCategory] = useState('all');

  // Fetch merchants (restaurants)
  const { data: merchantsData, isLoading: merchantsLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => merchantService.list(),
  });

  // Fetch featured listings
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: () => listingService.getListings({ limit: 8, status: 'ACTIVE' }),
  });

  const merchants = merchantsData?.data || [];
  const listings = listingsData?.data || [];
  
  const filteredMerchants = merchants.filter((merchant) => {
    const matchesSearch = 
      (merchant.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (merchant.category || '').toLowerCase().includes(search.toLowerCase());
    
    if (selectedFoodCategory === 'all') return matchesSearch;
    
    // Map categories to merchant types
    const categoryMap: Record<string, string[]> = {
      pizza: ['pizza', 'pizzaria'],
      burger: ['hamburguer', 'hamburger', 'burger', 'lanche'],
      japanese: ['japones', 'japonesa', 'sushi', 'japa'],
      brazilian: ['brasileira', 'comida caseira', 'regional'],
      healthy: ['saudavel', 'fit', 'salada', 'natural'],
      dessert: ['doce', 'sobremesa', 'confeitaria', 'açaí'],
      drinks: ['bebida', 'bar', 'juice'],
    };

    const keywords = categoryMap[selectedFoodCategory] || [];
    return matchesSearch && keywords.some(k => 
      (merchant.category || '').toLowerCase().includes(k) ||
      (merchant.name || '').toLowerCase().includes(k)
    );
  });

  return (
    <div className="pb-20 md:pb-24">
      {/* =================== HERO SECTION =================== */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="text-orange-100 text-xs md:text-sm font-medium tracking-wide uppercase">
                Hub de Negócios Locais
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
              Tudo que você precisa,
              <span className="text-yellow-300"> em um só lugar</span>
            </h1>
            
            <p className="text-orange-100 text-sm md:text-base lg:text-lg mb-6 max-w-xl">
              Delivery, marketplace, serviços, chat e muito mais. Explore sua cidade!
            </p>

            {/* Location - Mobile first */}
            <div className="flex items-center gap-2 text-xs md:text-sm text-orange-100 mb-4">
              <MapPin className="h-4 w-4" />
              <span>Sua localização: </span>
              <button className="underline font-medium text-white hover:text-yellow-300 transition-colors">
                Definir endereço
              </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl md:rounded-2xl p-1.5 md:p-2 shadow-xl flex items-center gap-1 md:gap-2 max-w-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos, serviços, restaurantes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 md:pl-12 pr-2 md:pr-4 py-2.5 md:py-3 text-sm md:text-base text-gray-900 placeholder-gray-400 focus:outline-none rounded-lg md:rounded-xl"
                />
              </div>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 md:px-5 py-2.5 md:py-3 rounded-lg md:rounded-xl font-medium transition-colors flex items-center gap-1 md:gap-2 text-sm md:text-base">
                <Search className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =================== MAIN CATEGORIES GRID =================== */}
      <section className="container mx-auto px-4 py-6 md:py-8">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Explorar</h2>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {MAIN_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="flex flex-col items-center p-3 md:p-4 bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${cat.color} flex items-center justify-center mb-2 md:mb-3`}>
                <cat.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-700 text-center">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* =================== SPONSORS CAROUSEL =================== */}
      <section className="container mx-auto px-4 py-4 md:py-6">
        <SponsorCarousel placement="HOME_BANNER" autoPlay interval={6000} />
      </section>

      {/* =================== CHAT BANNER =================== */}
      <section className="container mx-auto px-4 py-3 md:py-6">
        <Link href="/chat" className="block group">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2.5 md:p-3 bg-white/20 rounded-xl">
                <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-base md:text-lg font-bold truncate">Chat com vendedores</h3>
                  <span className="px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] md:text-xs font-bold rounded">NOVO</span>
                </div>
                <p className="text-green-100 text-xs md:text-sm truncate">
                  Negocie direto pelo app com segurança
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          </div>
        </Link>
      </section>

      {/* =================== MARKETPLACE SECTION =================== */}
      <section className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-500" />
            Marketplace
          </h2>
          <Link 
            href="/listings" 
            className="text-xs md:text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center"
          >
            Ver mais <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Marketplace Categories */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-6">
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <Link
              key={cat.category}
              href={`/listings?category=${cat.category}`}
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all whitespace-nowrap group"
            >
              <cat.icon className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Featured Listings Grid */}
        {listingsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {listings.slice(0, 4).map((listing) => (
              <Link 
                key={listing.id} 
                href={`/listings/${listing.id}`}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative h-40 bg-gray-100">
                  {listing.images?.[0] ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  {listing.isFeatured && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Destaque
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <MapPin className="h-3 w-3" />
                    {listing.city || 'Brasil'}
                  </div>
                  {listing.price && (
                    <div className="text-lg font-bold text-orange-600 mt-2">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(listing.price)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-xl">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum anúncio disponível</p>
            <Link href="/listings/create" className="text-orange-600 font-medium hover:underline">
              Seja o primeiro a anunciar
            </Link>
          </div>
        )}
      </section>

      {/* =================== COMMUNITY FEED =================== */}
      <section className="container mx-auto px-4 py-4 md:py-8 bg-gray-50 -mx-4 px-8 md:mx-0 md:px-4 md:bg-transparent md:rounded-none">
        <FeedSection limit={6} />
      </section>

      {/* =================== DELIVERY SECTION =================== */}
      <section className="container mx-auto px-4 py-4 md:py-8" id="restaurants">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-500" />
            Delivery
          </h2>
          <Link 
            href="/restaurants" 
            className="text-xs md:text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center"
          >
            Ver todos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Food Categories Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
          {FOOD_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedFoodCategory(category.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all ${
                selectedFoodCategory === category.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
              }`}
            >
              <span>{category.emoji}</span>
              {category.label}
            </button>
          ))}
        </div>

        {/* Merchants Grid */}
        {merchantsLoading ? (
          <PageSpinner />
        ) : filteredMerchants.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl">
            <Utensils className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              {search
                ? `Nenhum resultado para "${search}"`
                : 'Nenhum restaurante disponível'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filteredMerchants.slice(0, 8).map((merchant) => (
              <MerchantCard key={merchant.id} merchant={merchant} />
            ))}
          </div>
        )}

        {/* View More Button */}
        {filteredMerchants.length > 8 && (
          <div className="text-center mt-6">
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* =================== CTA SECTION =================== */}
      <section className="container mx-auto px-4 py-6 md:py-10">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl md:rounded-2xl p-5 md:p-8 text-white relative overflow-hidden">
          <div className="relative">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              Comece a vender hoje
            </h2>
            <p className="text-gray-300 text-sm mb-4 max-w-md">
              Anuncie grátis para milhares de pessoas na sua cidade.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/listings/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Zap className="h-4 w-4" />
                Criar anúncio
              </Link>
              <Link
                href="/merchant/register"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors border border-white/20"
              >
                Seja parceiro
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
