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
    label: 'Delivery', 
    description: 'Restaurantes e comida',
    icon: Utensils, 
    color: 'from-orange-500 to-red-500', 
    href: '/#restaurants',
    badge: '🔥',
  },
  { 
    id: 'products', 
    label: 'Produtos', 
    description: 'Compre e venda',
    icon: ShoppingBag, 
    color: 'from-blue-500 to-indigo-500', 
    href: '/listings?category=PRODUCTS',
    badge: null,
  },
  { 
    id: 'services', 
    label: 'Serviços', 
    description: 'Profissionais locais',
    icon: Wrench, 
    color: 'from-purple-500 to-pink-500', 
    href: '/listings?category=SERVICES',
    badge: null,
  },
  { 
    id: 'vehicles', 
    label: 'Veículos', 
    description: 'Carros e motos',
    icon: Car, 
    color: 'from-green-500 to-teal-500', 
    href: '/listings?category=VEHICLES',
    badge: null,
  },
  { 
    id: 'jobs', 
    label: 'Empregos', 
    description: 'Vagas e oportunidades',
    icon: Briefcase, 
    color: 'from-red-500 to-rose-500', 
    href: '/listings?category=JOBS',
    badge: '✨',
  },
  { 
    id: 'real_estate', 
    label: 'Imóveis', 
    description: 'Aluguel e venda',
    icon: HomeIcon, 
    color: 'from-amber-500 to-orange-500', 
    href: '/listings?category=REAL_ESTATE',
    badge: null,
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
    <div className="pb-24">
      {/* =================== HERO SECTION =================== */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
              <span className="text-orange-100 text-sm font-medium tracking-wide uppercase">
                Hub de Negócios Locais
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Tudo que você precisa,
              <br />
              <span className="text-yellow-300">em um só lugar</span>
            </h1>
            
            <p className="text-orange-100 text-lg md:text-xl mb-8 max-w-xl">
              Delivery, marketplace, serviços, chat e muito mais. 
              Conectamos você à sua comunidade local.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-2 shadow-2xl flex items-center gap-2 max-w-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos, serviços, restaurantes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none rounded-xl"
                />
              </div>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-xl font-semibold transition-colors flex items-center gap-2">
                <Search className="h-5 w-5" />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 mt-6 text-sm text-orange-100">
              <MapPin className="h-4 w-4" />
              <span>Sua localização: </span>
              <button className="underline font-medium text-white hover:text-yellow-300 transition-colors">
                Definir endereço
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <stat.icon className="h-5 w-5 text-yellow-300" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-orange-100">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================== MAIN CATEGORIES GRID =================== */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Explorar</h2>
          <Link 
            href="/listings" 
            className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            Ver tudo <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {MAIN_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative p-6 text-center">
                <div className={`mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <cat.icon className="h-7 w-7 text-white" />
                </div>
                
                {cat.badge && (
                  <span className="absolute top-2 right-2 text-lg">{cat.badge}</span>
                )}
                
                <h3 className="font-semibold text-gray-900 group-hover:text-white transition-colors">
                  {cat.label}
                </h3>
                <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors mt-1">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =================== SPONSORS CAROUSEL =================== */}
      <section className="container mx-auto px-4 py-6">
        <SponsorCarousel placement="HOME_BANNER" autoPlay interval={6000} />
      </section>

      {/* =================== CHAT BANNER =================== */}
      <section className="container mx-auto px-4 py-6">
        <Link href="/chat" className="block group">
          <div className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden hover:shadow-xl transition-shadow">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <span className="text-green-100 text-sm font-medium">Chat em Tempo Real</span>
                  <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">NOVO</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-2">Converse com vendedores</h3>
                <p className="text-green-100 text-sm md:text-base max-w-md">
                  Negocie diretamente pelo app, com segurança e praticidade. 
                  Tire dúvidas, combine entregas e feche negócios.
                </p>
              </div>
              <div className="hidden md:flex items-center justify-center w-20 h-20 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                <ArrowRight className="h-8 w-8 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* =================== MARKETPLACE SECTION =================== */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-blue-500" />
              Marketplace
            </h2>
            <p className="text-sm text-gray-500 mt-1">Encontre os melhores produtos e serviços</p>
          </div>
          <Link 
            href="/listings" 
            className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
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
      <section className="container mx-auto px-4 py-10 bg-gray-50 -mx-4 px-8 md:mx-0 md:px-4 md:bg-transparent md:rounded-none">
        <FeedSection limit={6} />
      </section>

      {/* =================== DELIVERY SECTION =================== */}
      <section className="container mx-auto px-4 py-10" id="restaurants">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Utensils className="h-6 w-6 text-orange-500" />
              Delivery de Comida
            </h2>
            <p className="text-sm text-gray-500 mt-1">Os melhores restaurantes da região</p>
          </div>
          <Link 
            href="/restaurants" 
            className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            Ver todos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Food Categories Filter */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-6">
          {FOOD_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedFoodCategory(category.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedFoodCategory === category.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:text-orange-600'
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
          <div className="text-center py-12 bg-white rounded-xl">
            <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {search
                ? `Nenhum restaurante encontrado para "${search}"`
                : selectedFoodCategory !== 'all'
                ? 'Nenhum restaurante nesta categoria'
                : 'Nenhum restaurante disponível no momento'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMerchants.slice(0, 8).map((merchant) => (
              <MerchantCard key={merchant.id} merchant={merchant} />
            ))}
          </div>
        )}

        {/* View More Button */}
        {filteredMerchants.length > 8 && (
          <div className="text-center mt-8">
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              Ver todos os restaurantes
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}
      </section>

      {/* =================== CTA SECTION =================== */}
      <section className="container mx-auto px-4 py-10">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Comece a vender hoje
              </h2>
              <p className="text-gray-300 mb-6 max-w-md">
                Anuncie seus produtos e serviços para milhares de pessoas na sua cidade. 
                É grátis para começar!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/listings/create"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <Zap className="h-5 w-5" />
                  Criar anúncio grátis
                </Link>
                <Link
                  href="/merchant/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20"
                >
                  Seja um parceiro
                </Link>
              </div>
            </div>
            
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-48 h-48 bg-orange-500/30 rounded-full flex items-center justify-center">
                  <div className="w-36 h-36 bg-orange-500/50 rounded-full flex items-center justify-center">
                    <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-12 w-12 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 px-3 py-1.5 bg-green-500 rounded-full text-sm font-bold shadow-lg">
                  +500 vendas/dia
                </div>
                <div className="absolute -bottom-2 -left-4 px-3 py-1.5 bg-blue-500 rounded-full text-sm font-bold shadow-lg">
                  Grátis!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
