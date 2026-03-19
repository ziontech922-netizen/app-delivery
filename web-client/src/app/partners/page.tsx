'use client';

import Link from 'next/link';
import { ArrowLeft, Store, Truck, Handshake, ChevronRight } from 'lucide-react';

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Seja Parceiro</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Junte-se ao SuperApp e faça parte da maior plataforma de negócios locais do Brasil.
        </p>

        <div className="space-y-6 mb-12">
          <Link href="/become-merchant" className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <Store className="w-10 h-10 text-orange-500" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Comerciantes</h3>
                  <p className="text-gray-600">Restaurantes, lojas, prestadores de serviços. Venda mais com o SuperApp.</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </Link>

          <Link href="/driver/register" className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <Truck className="w-10 h-10 text-orange-500" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Entregadores</h3>
                  <p className="text-gray-600">Ganhe dinheiro fazendo entregas com horários flexíveis.</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </Link>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Handshake className="w-10 h-10 text-orange-500" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Parcerias Corporativas</h3>
                <p className="text-gray-600 mb-4">Interessado em parcerias estratégicas ou integração de APIs?</p>
                <a href="mailto:parcerias@superapp.com.br" className="text-orange-600 font-medium hover:underline">
                  parcerias@superapp.com.br
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
