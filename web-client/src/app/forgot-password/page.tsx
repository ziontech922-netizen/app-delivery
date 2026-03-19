'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      setError('Digite um email válido');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setIsSuccess(true);
    } catch (err: any) {
      // Always show success to prevent email enumeration
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

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
              Email enviado!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Se existe uma conta com o email <strong>{email}</strong>, 
              você receberá um link para redefinir sua senha.
            </p>

            <div className="space-y-3">
              <Link
                href="/login"
                className="
                  block w-full py-3.5 px-4
                  bg-primary-500 hover:bg-primary-600 
                  text-white font-semibold rounded-xl
                  transition-all duration-200
                  text-center
                "
              >
                Voltar ao login
              </Link>
              
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="
                  w-full py-3 px-4
                  text-gray-600 hover:text-gray-900
                  font-medium text-sm
                  transition-colors duration-200
                "
              >
                Tentar outro email
              </button>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              Não recebeu? Verifique sua pasta de spam ou aguarde alguns minutos.
            </p>
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
                Esqueceu sua senha?
              </h1>
              <p className="text-gray-500">
                Digite seu email e enviaremos um link para criar uma nova senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="
                      w-full pl-10 pr-4 py-3.5
                      border-2 border-gray-300 rounded-xl
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                      focus:outline-none
                      transition-all duration-200
                    "
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
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
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperação'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Lembrou a senha?{' '}
              <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                Fazer login
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
