'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Package, Tag, Megaphone } from 'lucide-react';
import { useAuthStore } from '@/store';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    orderUpdates: true,
    promotions: true,
    newRestaurants: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setIsLoading(false);
  }, [isAuthenticated, router]);

  const toggle = (key: keyof typeof settings) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Notificações</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Tipos de notificação */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Tipo de notificação</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <ToggleItem icon={Package} label="Atualizações de pedido" description="Status do pedido, entrega, etc." checked={settings.orderUpdates} onChange={() => toggle('orderUpdates')} />
            <ToggleItem icon={Tag} label="Promoções e cupons" description="Ofertas especiais e descontos" checked={settings.promotions} onChange={() => toggle('promotions')} border />
            <ToggleItem icon={Megaphone} label="Novos restaurantes" description="Quando restaurantes abrirem perto de você" checked={settings.newRestaurants} onChange={() => toggle('newRestaurants')} border />
          </div>
        </div>

        {/* Canais */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Canais</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <ToggleItem icon={Bell} label="Push (App)" description="Notificações no dispositivo" checked={settings.pushNotifications} onChange={() => toggle('pushNotifications')} />
            <ToggleItem icon={Bell} label="E-mail" description="Receber por e-mail" checked={settings.emailNotifications} onChange={() => toggle('emailNotifications')} border />
            <ToggleItem icon={Bell} label="SMS" description="Receber por mensagem de texto" checked={settings.smsNotifications} onChange={() => toggle('smsNotifications')} border />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({ icon: Icon, label, description, checked, onChange, border }: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  border?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${border ? 'border-t border-gray-100' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
