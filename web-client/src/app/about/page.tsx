'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, Target, Users, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Sobre o SuperApp</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            O SuperApp é o hub de negócios locais que conecta você a tudo que sua cidade tem de melhor.
            Delivery, marketplace, serviços e muito mais em um só lugar.
          </p>

          <div className="grid md:grid-cols-2 gap-6 my-12">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Building2 className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nossa Missão</h3>
              <p className="text-gray-600">
                Facilitar a conexão entre consumidores e negócios locais, impulsionando a economia da sua região.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Target className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nossa Visão</h3>
              <p className="text-gray-600">
                Ser o aplicativo essencial para todas as necessidades do dia a dia em cada cidade do Brasil.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Users className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nossa Equipe</h3>
              <p className="text-gray-600">
                Profissionais dedicados a criar a melhor experiência para você e para os comerciantes parceiros.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Heart className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nossos Valores</h3>
              <p className="text-gray-600">
                Transparência, inovação, compromisso com a qualidade e respeito aos nossos parceiros e clientes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
