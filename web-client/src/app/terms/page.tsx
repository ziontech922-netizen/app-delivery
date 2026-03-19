'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Termos de Uso</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <p className="text-sm text-gray-500 mb-6">Última atualização: 15 de março de 2026</p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
            <p className="text-gray-600 leading-relaxed">
              Ao utilizar o SuperApp, você concorda com estes Termos de Uso. Se não concordar, 
              por favor não utilize nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Descrição do Serviço</h2>
            <p className="text-gray-600 leading-relaxed">
              O SuperApp é uma plataforma que conecta usuários a restaurantes, mercados e prestadores 
              de serviços locais, oferecendo delivery, marketplace e outros serviços integrados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Cadastro e Conta</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Você deve fornecer informações precisas e atualizadas</li>
              <li>É responsável por manter a segurança da sua conta</li>
              <li>Deve ter pelo menos 18 anos para criar uma conta</li>
              <li>Não deve compartilhar suas credenciais de acesso</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Pedidos e Pagamentos</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Os preços são definidos pelos estabelecimentos parceiros</li>
              <li>Taxa de entrega pode variar conforme distância e demanda</li>
              <li>Pagamentos são processados de forma segura</li>
              <li>Cancelamentos estão sujeitos à política de cada estabelecimento</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Entregas</h2>
            <p className="text-gray-600 leading-relaxed">
              O tempo de entrega é uma estimativa e pode variar. O SuperApp não é responsável 
              pelo conteúdo ou qualidade dos produtos dos estabelecimentos parceiros.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Uso Aceitável</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Você concorda em não:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Usar o serviço para fins ilegais</li>
              <li>Interferir no funcionamento da plataforma</li>
              <li>Criar contas falsas ou fraudulentas</li>
              <li>Assediar entregadores ou funcionários de parceiros</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Propriedade Intelectual</h2>
            <p className="text-gray-600 leading-relaxed">
              Todo o conteúdo do SuperApp, incluindo marca, design e código, é protegido por 
              direitos autorais e não pode ser reproduzido sem autorização.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Limitação de Responsabilidade</h2>
            <p className="text-gray-600 leading-relaxed">
              O SuperApp atua como intermediário e não se responsabiliza por danos diretos 
              ou indiretos decorrentes do uso dos serviços dos parceiros.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Alterações nos Termos</h2>
            <p className="text-gray-600 leading-relaxed">
              Podemos alterar estes termos a qualquer momento. Alterações significativas serão 
              comunicadas por email ou notificação no aplicativo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contato</h2>
            <p className="text-gray-600 leading-relaxed">
              Para dúvidas sobre estes termos: 
              <a href="mailto:suporte@superapp.com" className="text-primary-600 hover:underline ml-1">
                suporte@superapp.com
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
