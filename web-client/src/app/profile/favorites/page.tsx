'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Store } from 'lucide-react';
import { useAuthStore } from '@/store';

export default function FavoritesPage() {
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Favoritos</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-red-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Nenhum favorito ainda</h2>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            Explore restaurantes e lojas e toque no coração para salvar seus favoritos aqui.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            Explorar restaurantes
          </button>
        </div>
      </div>
    </div>
  );
}
