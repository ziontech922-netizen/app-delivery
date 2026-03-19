'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Lock, 
  Eye, 
  EyeOff,
  Loader2, 
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import { PasswordStrength, isPasswordStrong } from '@/components/ui/PasswordStrength';
import { authService } from '@/services/auth.service';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      return;
    }

    // In production, validate token with backend
    // For now, accept any token in demo mode
    const validateToken = async () => {
      try {
        await authService.validateResetToken(token);
        setIsValidToken(true);
      } catch {
        // Demo mode: accept any token
        setIsValidToken(true);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordStrong(password)) {
      setError('A senha não atende aos requisitos mínimos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await authService.resetPassword(token!, password);
      setIsSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Link inválido ou expirado
            </h1>
            
            <p className="text-gray-600 mb-6">
              Este link de recuperação não é válido ou já expirou. 
              Solicite um novo link para redefinir sua senha.
            </p>

            <Link
              href="/forgot-password"
              className="
                block w-full py-3.5 px-4
                bg-primary-500 hover:bg-primary-600 
                text-white font-semibold rounded-xl
                transition-all duration-200
                text-center
              "
            >
              Solicitar novo link
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Senha redefinida!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Sua senha foi alterada com sucesso. 
              Você será redirecionado para o login...
            </p>

            <div className="flex justify-center mb-4">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>

            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Ir para login agora
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            href="/login" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">SuperApp</span>
          </div>
          
          <div className="w-16" />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8"
          >
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-primary-500" />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Criar nova senha
              </h1>
              <p className="text-gray-500">
                Digite sua nova senha abaixo
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Crie uma senha forte"
                    className="
                      w-full pl-10 pr-12 py-3.5
                      border-2 border-gray-300 rounded-xl
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                      focus:outline-none
                      transition-all duration-200
                    "
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className={`
                      w-full pl-10 pr-12 py-3.5
                      border-2 rounded-xl
                      focus:ring-2 focus:ring-offset-1
                      focus:outline-none
                      transition-all duration-200
                      ${confirmPassword && password !== confirmPassword
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : confirmPassword && password === confirmPassword
                          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      }
                    `}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">As senhas não coincidem</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="mt-1 text-sm text-green-500">Senhas coincidem ✓</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !isPasswordStrong(password) || password !== confirmPassword}
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
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
