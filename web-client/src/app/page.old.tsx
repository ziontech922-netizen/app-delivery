'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Utensils, ShoppingBag, Wrench, Car, Briefcase, Home, MessageCircle, Sparkles, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { merchantService } from '@/services/merchant.service';
import MerchantCard from '@/components/merchant/MerchantCard';
import { PageSpinner } from '@/components/ui/Spinner';

const SUPER_APP_CATEGORIES = [
  { id: 'food', label: 'Comida', icon: Utensils, color: 'bg-orange-500', href: '/#restaurants' },
  { id: 'products', label: 'Produtos', icon: ShoppingBag, color: 'bg-blue-500', href: '/listings?category=PRODUCTS' },
  { id: 'services', label: 'Serviços', icon: Wrench, color: 'bg-purple-500', href: '/listings?category=SERVICES' },
  { id: 'vehicles', label: 'Veículos', icon: Car, color: 'bg-green-500', href: '/listings?category=VEHICLES' },
  { id: 'jobs', label: 'Empregos', icon: Briefcase, color: 'bg-red-500', href: '/listings?category=JOBS' },
  { id: 'real_estate', label: 'Imóveis', icon: Home, color: 'bg-amber-500', href: '/listings?category=REAL_ESTATE' },
];

export default function HomePage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => merchantService.list(),
  });

  const merchants = data?.data || [];
  
  const filteredMerchants = merchants.filter((merchant) =>
    (merchant.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (merchant.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-20">
      {/* Hero Section - Super App */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <span className="text-orange-100 text-sm font-medium">Hub de Negócios Locais</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa,<br />em um só lugar
            </h1>
            <p className="text-orange-100 text-lg mb-8">
              Delivery, marketplace, serviços, chat e muito mais. Explore sua cidade!
            </p>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-orange-100">
              <MapPin className="h-4 w-4" />
              <span>Sua localização: </span>
              <button className="underline font-medium text-white hover:text-orange-100">
                Definir endereço
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos, serviços, restaurantes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Super App Categories Grid */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Explorar</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {SUPER_APP_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className={`${cat.color} p-4 rounded-full mb-3 group-hover:scale-110 transition-transform`}>
                <cat.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Marketplace Banner */}
      <section className="container mx-auto px-4 py-4">
        <Link href="/listings" className="block">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white hover:opacity-95 transition-opacity">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="text-blue-100 text-sm font-medium">Novo!</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Marketplace</h3>
                <p className="text-blue-100">Compre e venda produtos, serviços e muito mais</p>
              </div>
              <ChevronRight className="h-8 w-8 text-blue-200" />
            </div>
          </div>
        </Link>
      </section>

      {/* Chat Banner */}
      <section className="container mx-auto px-4 py-4">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-5 w-5" />
                <span className="text-green-100 text-sm font-medium">Chat em Tempo Real</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Converse com vendedores</h3>
              <p className="text-green-100 text-sm">Negocie diretamente pelo app, com segurança</p>
            </div>
          </div>
        </div>
      </section>

      {/* Food Categories */}
      <section className="container mx-auto px-4 py-8" id="restaurants">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">🍔 Delivery de Comida</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {['Todos', 'Pizzaria', 'Hambúrguer', 'Japonês', 'Brasileira', 'Saudável', 'Doces'].map(
            (category) => (
              <button
                key={category}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === 'Todos'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                {category}
              </button>
            )
          )}
        </div>
      </section>

      {/* Merchants Grid */}
      <section className="container mx-auto px-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Restaurantes
        </h3>

        {isLoading ? (
          <PageSpinner />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Erro ao carregar restaurantes</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary-600 underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredMerchants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {search
                ? `Nenhum restaurante encontrado para "${search}"`
                : 'Nenhum restaurante disponível no momento'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMerchants.map((merchant) => (
              <MerchantCard key={merchant.id} merchant={merchant} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
