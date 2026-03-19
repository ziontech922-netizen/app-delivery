'use client';

import Link from 'next/link';
import { ArrowLeft, Eye, Ear, Hand, Monitor } from 'lucide-react';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Acessibilidade</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Estamos comprometidos em tornar o SuperApp acessível para todos os usuários.
        </p>

        <div className="space-y-6">
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Eye className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Visual</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Alto contraste entre texto e fundo</li>
                  <li>Textos redimensionáveis</li>
                  <li>Compatibilidade com leitores de tela</li>
                  <li>Descrições em imagens</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Hand className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Motor</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Navegação completa por teclado</li>
                  <li>Áreas de clique adequadas</li>
                  <li>Sem limite de tempo para ações</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Monitor className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Tecnologias Assistivas</h2>
                <p className="text-gray-600">
                  Nosso site é compatível com as principais tecnologias assistivas do mercado,
                  incluindo NVDA, JAWS e VoiceOver.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Ear className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Feedback</h2>
                <p className="text-gray-600">
                  Encontrou alguma barreira de acessibilidade? Entre em contato:
                  <strong className="block mt-2">acessibilidade@superapp.com.br</strong>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
