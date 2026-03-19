'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Lock, FileText } from 'lucide-react';

export default function LGPDPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">LGPD - Proteção de Dados</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Conheça seus direitos e como tratamos seus dados pessoais de acordo com a Lei Geral de Proteção de Dados.
        </p>

        <div className="space-y-8">
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Seus Direitos</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Confirmação da existência de tratamento de dados</li>
                  <li>Acesso aos seus dados pessoais</li>
                  <li>Correção de dados incompletos ou desatualizados</li>
                  <li>Exclusão de dados desnecessários</li>
                  <li>Portabilidade dos dados</li>
                  <li>Revogação do consentimento</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Eye className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Transparência</h2>
                <p className="text-gray-600">
                  Informamos de forma clara como seus dados são coletados, utilizados e armazenados.
                  Você sempre terá acesso às informações sobre o tratamento dos seus dados.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Lock className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Segurança</h2>
                <p className="text-gray-600">
                  Utilizamos medidas técnicas e organizacionais para proteger seus dados contra
                  acessos não autorizados, destruição, perda ou alteração.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <FileText className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Solicitações</h2>
                <p className="text-gray-600">
                  Para exercer seus direitos ou tirar dúvidas sobre o tratamento dos seus dados,
                  entre em contato: <strong>privacidade@superapp.com.br</strong>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
