'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Store, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui';

export default function MerchantLoginPage() {
  const router = useRouter();
  const { setUser, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in as merchant
  useEffect(() => {
    if (isAuthenticated && user?.role === 'MERCHANT') {
      router.push('/merchant/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      if (data.user.role !== 'MERCHANT') {
        setError('Acesso negado. Esta área é exclusiva para estabelecimentos.');
        return;
      }
      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      router.push('/merchant/dashboard');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Credenciais inválidas');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
            <Store className="h-10 w-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Portal do Parceiro</h1>
          <p className="text-primary-100 mt-2">Gerencie seu estabelecimento</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600">Lembrar de mim</span>
              </label>
              <a href="#" className="text-sm text-primary-600 hover:underline">
                Esqueceu a senha?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full py-3"
              isLoading={loginMutation.isPending}
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Quer ser um parceiro?{' '}
              <a href="#" className="text-primary-600 hover:underline font-medium">
                Cadastre-se aqui
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-primary-100 text-sm">
          © 2026 Delivery Platform. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
