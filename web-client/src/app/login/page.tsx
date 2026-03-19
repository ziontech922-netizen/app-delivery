'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store';
import { SocialButtonsGroup, AuthDivider } from '@/components/ui/SocialButtons';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { 
  signInWithGoogle, 
  signInWithFacebook, 
  signInWithApple,
  isOAuthConfigured 
} from '@/lib/oauth';

type LoginMethod = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [socialLoadingProvider, setSocialLoadingProvider] = useState<'google' | 'apple' | 'facebook' | null>(null);

  // Email login state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Phone login state
  const [phone, setPhone] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async () => {
      const user = await authService.getMe();
      setUser(user);
      router.push('/');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Credenciais inválidas. Verifique seu email e senha.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate(formData);
  };

  const handleSocialAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    setSocialLoadingProvider(provider);
    setError('');
    
    try {
      // Check if provider is configured
      if (!isOAuthConfigured(provider)) {
        setError(`Login com ${provider} ainda não está configurado. Configure as variáveis de ambiente.`);
        return;
      }

      let idToken: string;
      let userData: { firstName?: string; lastName?: string } | undefined;

      // Get token from OAuth provider
      switch (provider) {
        case 'google':
          const googleResult = await signInWithGoogle();
          idToken = googleResult.idToken;
          break;
        case 'facebook':
          const fbResult = await signInWithFacebook();
          idToken = fbResult.accessToken;
          break;
        case 'apple':
          const appleResult = await signInWithApple();
          idToken = appleResult.idToken;
          userData = appleResult.userData;
          break;
        default:
          throw new Error('Provider não suportado');
      }

      // Send to backend for verification and login
      const response = await authService.socialAuth({ provider, idToken, userData });
      
      // Set user in store
      setUser(response.user);
      
      // Redirect to home
      router.push('/');
    } catch (err: any) {
      console.error('Social auth error:', err);
      if (err.message?.includes('cancelado')) {
        // User cancelled, no need to show error
        return;
      }
      setError(err.response?.data?.message || err.message || `Erro ao fazer login com ${provider}`);
    } finally {
      setSocialLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">SuperApp</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-lg">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Bem-vindo de volta!
              </h1>
              <p className="text-gray-500">
                Entre na sua conta para continuar
              </p>
            </div>

            {/* Social Login */}
            <SocialButtonsGroup
              onGoogleClick={() => handleSocialAuth('google')}
              onAppleClick={() => handleSocialAuth('apple')}
              onFacebookClick={() => handleSocialAuth('facebook')}
              loadingProvider={socialLoadingProvider}
            />

            <AuthDivider />

            {/* Login Method Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  loginMethod === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  loginMethod === 'phone'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Telefone
              </button>
            </div>

            {/* Email Login Form */}
            {loginMethod === 'email' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="
                        w-full pl-10 pr-4 py-3.5
                        border-2 border-gray-300 rounded-xl
                        focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                        focus:outline-none
                        transition-all duration-200
                      "
                      required
                      disabled={loginMutation.isPending}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Sua senha"
                      className="
                        w-full pl-10 pr-12 py-3.5
                        border-2 border-gray-300 rounded-xl
                        focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                        focus:outline-none
                        transition-all duration-200
                      "
                      required
                      disabled={loginMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-gray-600">Lembrar-me</span>
                  </label>
                  <Link 
                    href="/forgot-password" 
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending || !formData.email || !formData.password}
                  className="
                    w-full py-3.5 px-4 mt-2
                    bg-primary-500 hover:bg-primary-600 
                    text-white font-semibold rounded-xl
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                    shadow-lg shadow-primary-500/25
                  "
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Phone Login */}
            {loginMethod === 'phone' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Número de telefone
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={(value, isValid) => {
                      setPhone(value);
                      setIsPhoneValid(isValid);
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    alert('Login por telefone estará disponível em breve!');
                  }}
                  disabled={!isPhoneValid}
                  className="
                    w-full py-3.5 px-4
                    bg-primary-500 hover:bg-primary-600 
                    text-white font-semibold rounded-xl
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                    shadow-lg shadow-primary-500/25
                  "
                >
                  Enviar código SMS
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-center text-xs text-gray-500">
                  Enviaremos um código de verificação para seu telefone
                </p>
              </div>
            )}
          </div>

          {/* Register Link */}
          <p className="mt-6 text-center text-gray-600">
            Não tem uma conta?{' '}
            <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Criar conta
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
