'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Política de Privacidade</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <p className="text-sm text-gray-500 mb-6">Última atualização: 15 de março de 2026</p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Introdução</h2>
            <p className="text-gray-600 leading-relaxed">
              A SuperApp valoriza a privacidade dos nossos usuários. Esta Política de Privacidade descreve como coletamos, 
              usamos, compartilhamos e protegemos suas informações pessoais quando você utiliza nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Informações que Coletamos</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Informações de Cadastro:</strong> Nome, email, telefone, endereço</li>
              <li><strong>Informações de Localização:</strong> Para entrega de pedidos e serviços baseados em localização</li>
              <li><strong>Histórico de Pedidos:</strong> Pedidos realizados, restaurantes favoritos, preferências</li>
              <li><strong>Informações de Pagamento:</strong> Dados de cartão (processados de forma segura por nossos parceiros)</li>
              <li><strong>Dados de Uso:</strong> Como você interage com o aplicativo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Como Usamos Suas Informações</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Processar e entregar seus pedidos</li>
              <li>Melhorar a experiência do usuário</li>
              <li>Enviar notificações sobre pedidos e promoções</li>
              <li>Prevenir fraudes e garantir segurança</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Compartilhamento de Dados</h2>
            <p className="text-gray-600 leading-relaxed">
              Compartilhamos suas informações apenas com: restaurantes parceiros (para preparar pedidos), 
              entregadores (para realizar entregas), processadores de pagamento e quando exigido por lei.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Segurança</h2>
            <p className="text-gray-600 leading-relaxed">
              Utilizamos criptografia SSL/TLS, autenticação de dois fatores e outras medidas de segurança 
              para proteger suas informações pessoais.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Seus Direitos (LGPD)</h2>
            <p className="text-gray-600 leading-relaxed mb-3">De acordo com a LGPD, você tem direito a:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão dos seus dados</li>
              <li>Revogar consentimento para uso de dados</li>
              <li>Solicitar portabilidade dos dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Contato</h2>
            <p className="text-gray-600 leading-relaxed">
              Para dúvidas sobre privacidade ou exercer seus direitos, entre em contato: 
              <a href="mailto:privacidade@superapp.com" className="text-primary-600 hover:underline ml-1">
                privacidade@superapp.com
              </a>
            </p>
          </section>

          <div className="pt-6 border-t border-gray-200">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
