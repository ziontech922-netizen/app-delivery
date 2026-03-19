'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store';
import { authService } from '@/services/auth.service';
import { Button, Input } from '@/components/ui';
import { SocialButtonsGroup, AuthDivider } from '@/components/ui/SocialButtons';
import { 
  signInWithGoogle, 
  signInWithFacebook, 
  signInWithApple,
  isOAuthConfigured 
} from '@/lib/oauth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [socialLoadingProvider, setSocialLoadingProvider] = useState<'google' | 'apple' | 'facebook' | null>(null);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const handleAuthSuccess = (data: any) => {
    if (data.user.role !== 'ADMIN') {
      setError('Acesso negado. Apenas administradores podem acessar.');
      return;
    }
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    setUser(data.user);
    router.push('/admin/dashboard');
  };

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: handleAuthSuccess,
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Credenciais inválidas');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password });
  };

  const handleSocialAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    setSocialLoadingProvider(provider);
    setError(null);

    try {
      if (!isOAuthConfigured(provider)) {
        setError(`Login com ${provider} não está configurado.`);
        return;
      }

      let idToken: string;
      let userData: { firstName?: string; lastName?: string } | undefined;

      switch (provider) {
        case 'google': {
          const result = await signInWithGoogle();
          idToken = result.idToken;
          break;
        }
        case 'facebook': {
          const result = await signInWithFacebook();
          idToken = result.accessToken;
          break;
        }
        case 'apple': {
          const result = await signInWithApple();
          idToken = result.idToken;
          userData = result.userData;
          break;
        }
        default:
          throw new Error('Provider não suportado');
      }

      const response = await authService.socialAuth({ provider, idToken, userData });
      handleAuthSuccess(response);
    } catch (err: any) {
      if (err.message?.includes('cancelado')) return;
      setError(err.response?.data?.message || err.message || `Erro ao fazer login com ${provider}`);
    } finally {
      setSocialLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mb-4">
            <span className="text-white font-bold text-3xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">Entre com suas credenciais de administrador</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Social Login */}
          <SocialButtonsGroup
            onGoogleClick={() => handleSocialAuth('google')}
            onAppleClick={() => handleSocialAuth('apple')}
            onFacebookClick={() => handleSocialAuth('facebook')}
            loadingProvider={socialLoadingProvider}
            disabled={loginMutation.isPending}
          />

          <AuthDivider />

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="admin@delivery.com"
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loginMutation.isPending}
            >
              Entrar com Email
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          &copy; {new Date().getFullYear()} Delivery Platform. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
