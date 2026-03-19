'use client';

import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, Target, BarChart } from 'lucide-react';

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Anuncie no SuperApp</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Alcance milhares de clientes na sua região com anúncios no SuperApp.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Users className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Audiência Local</h3>
            <p className="text-gray-600">Alcance clientes ativos na sua região que estão prontos para comprar.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Target className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Segmentação</h3>
            <p className="text-gray-600">Direcione seus anúncios por localização, interesses e comportamento.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <TrendingUp className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Resultados</h3>
            <p className="text-gray-600">Aumente suas vendas e visibilidade com campanhas eficientes.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <BarChart className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Métricas</h3>
            <p className="text-gray-600">Acompanhe o desempenho em tempo real com relatórios detalhados.</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Comece a anunciar hoje</h2>
          <p className="mb-6">Entre em contato com nossa equipe comercial para criar sua campanha.</p>
          <a href="mailto:comercial@superapp.com.br" className="inline-block bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100">
            Falar com vendas
          </a>
        </div>
      </div>
    </div>
  );
}
