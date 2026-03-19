'use client';

import Link from 'next/link';
import { ArrowLeft, Cookie, Settings, BarChart, Shield } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Política de Cookies</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Entenda como utilizamos cookies para melhorar sua experiência no SuperApp.
        </p>

        <div className="space-y-6">
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Cookie className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">O que são Cookies?</h2>
                <p className="text-gray-600">
                  Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você
                  visita nosso site. Eles nos ajudam a proporcionar uma experiência melhor e mais personalizada.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Cookies Essenciais</h2>
                <p className="text-gray-600">
                  Necessários para o funcionamento básico do site. Incluem cookies de autenticação
                  e segurança. Não podem ser desativados.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <BarChart className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Cookies de Análise</h2>
                <p className="text-gray-600">
                  Nos ajudam a entender como você usa o site, permitindo melhorias contínuas.
                  Coletam informações anônimas sobre navegação.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Settings className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Gerenciar Cookies</h2>
                <p className="text-gray-600">
                  Você pode gerenciar suas preferências de cookies a qualquer momento nas
                  configurações do seu navegador. Note que desativar alguns cookies pode
                  afetar a funcionalidade do site.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
