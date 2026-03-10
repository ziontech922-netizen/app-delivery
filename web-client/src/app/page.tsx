'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { merchantService } from '@/services/merchant.service';
import MerchantCard from '@/components/merchant/MerchantCard';
import { PageSpinner } from '@/components/ui/Spinner';

export default function HomePage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => merchantService.list(),
  });

  const merchants = data?.data || [];
  
  const filteredMerchants = merchants.filter((merchant) =>
    merchant.name.toLowerCase().includes(search.toLowerCase()) ||
    merchant.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Sua comida favorita, entregue rapidamente
            </h1>
            <p className="text-primary-100 text-lg mb-8">
              Escolha entre centenas de restaurantes e receba em casa ou no trabalho
            </p>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-primary-100">
              <MapPin className="h-4 w-4" />
              <span>Entregar em: </span>
              <button className="underline font-medium text-white hover:text-primary-100">
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
              placeholder="Buscar restaurantes ou categorias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <SlidersHorizontal className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {['Todos', 'Pizzaria', 'Hambúrguer', 'Japonês', 'Brasileira', 'Saudável', 'Doces'].map(
            (category) => (
              <button
                key={category}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === 'Todos'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
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
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Restaurantes
        </h2>

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
