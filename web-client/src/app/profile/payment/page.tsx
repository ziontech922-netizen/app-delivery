'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Plus, Smartphone, QrCode } from 'lucide-react';
import { useAuthStore } from '@/store';

export default function PaymentPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setIsLoading(false);
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const paymentMethods = [
    {
      type: 'pix',
      icon: QrCode,
      title: 'PIX',
      description: 'Pagamento instantâneo via PIX',
      available: true,
    },
    {
      type: 'credit',
      icon: CreditCard,
      title: 'Cartão de Crédito',
      description: 'Visa, Mastercard, Elo',
      available: false,
    },
    {
      type: 'debit',
      icon: CreditCard,
      title: 'Cartão de Débito',
      description: 'Visa, Mastercard, Elo',
      available: false,
    },
    {
      type: 'wallet',
      icon: Smartphone,
      title: 'Carteira Digital',
      description: 'Google Pay, Apple Pay',
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Formas de pagamento</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {paymentMethods.map((method, index) => (
            <div
              key={method.type}
              className={`flex items-center gap-3 px-4 py-4 ${index !== paymentMethods.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method.available ? 'bg-primary-50' : 'bg-gray-100'}`}>
                <method.icon className={`w-5 h-5 ${method.available ? 'text-primary-600' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${method.available ? 'text-gray-900' : 'text-gray-400'}`}>{method.title}</span>
                  {!method.available && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Em breve</span>
                  )}
                </div>
                <p className="text-sm text-gray-400">{method.description}</p>
              </div>
              {method.available && (
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Ativo</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-1">Pagamento na entrega</h3>
          <p className="text-sm text-blue-700">
            Você pode escolher a forma de pagamento no momento do pedido. 
            Aceitamos PIX e dinheiro na entrega. Em breve, cartões de crédito e débito.
          </p>
        </div>
      </div>
    </div>
  );
}
