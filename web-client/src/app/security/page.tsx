'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, AlertTriangle } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Segurança</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Sua segurança é nossa prioridade. Conheça as medidas que adotamos para proteger você.
        </p>

        <div className="space-y-6">
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Lock className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Criptografia</h2>
                <p className="text-gray-600">
                  Todas as comunicações são protegidas com criptografia de ponta a ponta (TLS/SSL).
                  Seus dados de pagamento são processados com segurança PCI-DSS.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Autenticação Segura</h2>
                <p className="text-gray-600">
                  Oferecemos autenticação em dois fatores (2FA), login com biometria e
                  notificações de atividade suspeita na sua conta.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Eye className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Monitoramento</h2>
                <p className="text-gray-600">
                  Nossa equipe de segurança monitora a plataforma 24/7 para detectar e
                  prevenir atividades fraudulentas.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Relatar Problema</h2>
                <p className="text-gray-600">
                  Encontrou uma vulnerabilidade ou problema de segurança?
                  <strong className="block mt-2">seguranca@superapp.com.br</strong>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
