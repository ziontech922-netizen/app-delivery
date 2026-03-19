'use client';

import Link from 'next/link';
import { ArrowLeft, Briefcase, Users, Rocket, Heart } from 'lucide-react';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Trabalhe Conosco</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Faça parte do time que está revolucionando o comércio local no Brasil.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Rocket className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Crescimento</h3>
            <p className="text-gray-600">Oportunidades reais de desenvolvimento profissional e pessoal.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Users className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Cultura</h3>
            <p className="text-gray-600">Ambiente colaborativo e diverso, onde todas as vozes são ouvidas.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Heart className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Benefícios</h3>
            <p className="text-gray-600">Pacote completo de benefícios pensado no seu bem-estar.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Briefcase className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Flexibilidade</h3>
            <p className="text-gray-600">Trabalho híbrido e horários flexíveis.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6">Vagas Abertas</h2>
          <p className="text-gray-600 mb-4">
            No momento não há vagas abertas, mas estamos sempre em busca de talentos!
          </p>
          <p className="text-gray-600">
            Envie seu currículo para <strong>carreiras@superapp.com.br</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
