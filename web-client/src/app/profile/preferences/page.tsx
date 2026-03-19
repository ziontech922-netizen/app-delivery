'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Sun, Globe, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store';

export default function PreferencesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    darkMode: false,
    language: 'pt-BR',
    autoLocation: true,
    distanceUnit: 'km',
  });

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Preferências</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Aparência */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Aparência</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                {preferences.darkMode ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-yellow-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Modo escuro</p>
                <p className="text-xs text-gray-400">Em breve</p>
              </div>
              <button
                disabled
                className="relative w-11 h-6 rounded-full bg-gray-200 cursor-not-allowed"
              >
                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
              </button>
            </div>
          </div>
        </div>

        {/* Idioma */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Idioma</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Idioma do app</p>
              </div>
              <select
                value={preferences.language}
                onChange={e => setPreferences({ ...preferences, language: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="pt-BR">Português (BR)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>

        {/* Localização */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Localização</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Localização automática</p>
                <p className="text-xs text-gray-400">Usar GPS para detectar endereço</p>
              </div>
              <button
                onClick={() => setPreferences(p => ({ ...p, autoLocation: !p.autoLocation }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${preferences.autoLocation ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences.autoLocation ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
