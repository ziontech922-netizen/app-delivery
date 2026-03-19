'use client';

import Link from 'next/link';
import { ArrowLeft, Newspaper, Download, Mail } from 'lucide-react';

export default function PressPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Imprensa</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Recursos e informações para jornalistas e veículos de comunicação.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Newspaper className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Releases</h3>
            <p className="text-gray-600 mb-4">
              Acesse nossos comunicados de imprensa e novidades.
            </p>
            <a href="mailto:imprensa@superapp.com.br" className="text-orange-600 font-medium hover:underline">
              Solicitar releases
            </a>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Download className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Kit de Mídia</h3>
            <p className="text-gray-600 mb-4">
              Baixe logos, imagens e materiais oficiais.
            </p>
            <a href="mailto:imprensa@superapp.com.br" className="text-orange-600 font-medium hover:underline">
              Solicitar kit
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <Mail className="w-8 h-8 text-orange-500 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Contato para Imprensa</h2>
              <p className="text-gray-600 mb-4">
                Para entrevistas, informações ou solicitações de imprensa, entre em contato:
              </p>
              <p className="font-medium text-gray-900">imprensa@superapp.com.br</p>
              <p className="text-gray-600 mt-2">Respondemos em até 24 horas úteis.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
