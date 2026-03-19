'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, CheckCircle, Clock, Mail, ArrowRight, FileCheck, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store';
import { authService } from '@/services/auth.service';

export default function MerchantRegisterSuccessPage() {
  const { user } = useAuthStore();
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    const checkPassword = async () => {
      try {
        const me = await authService.getMe();
        if (me.hasPassword === false) {
          setNeedsPassword(true);
        }
      } catch {
        // ignore
      }
    };
    checkPassword();
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (password.length < 8) {
      setPasswordError('Senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordError('Senha deve ter maiúscula, minúscula e número');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Senhas não conferem');
      return;
    }

    setIsSettingPassword(true);
    try {
      await authService.setPassword(password);
      setPasswordSuccess(true);
      setNeedsPassword(false);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Erro ao definir senha');
    } finally {
      setIsSettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
            <Store className="h-10 w-10 text-primary-600" />
          </div>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center border-4 border-white">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Cadastro Realizado!
          </h1>
          <p className="text-gray-600 mb-8">
            Seu estabelecimento foi cadastrado com sucesso e está em análise.
          </p>

          {/* Status Steps */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary-600" />
              Próximos passos
            </h2>
            
            <div className="space-y-4">
              {/* Step 1 - Complete */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Cadastro realizado</p>
                  <p className="text-sm text-gray-500">Seus dados foram enviados</p>
                </div>
              </div>

              {/* Step 2 - In Progress */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Em análise</p>
                  <p className="text-sm text-gray-500">Nossa equipe está verificando seus dados</p>
                </div>
              </div>

              {/* Step 3 - Pending */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-400">Notificação por e-mail</p>
                  <p className="text-sm text-gray-400">Você receberá um e-mail quando aprovado</p>
                </div>
              </div>
            </div>
          </div>

          {/* Password Creation for OAuth Users */}
          {needsPassword && !passwordSuccess && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-600" />
                Criar senha para o portal
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Você entrou com login social. Crie uma senha para acessar o portal do parceiro com email e senha também.
              </p>

              <form onSubmit={handleSetPassword} className="space-y-3">
                {passwordError && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {passwordError}
                  </div>
                )}
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nova senha (mín. 8 caracteres)"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar senha"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  required
                />
                <p className="text-xs text-gray-400">Deve conter maiúscula, minúscula e número</p>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 text-sm py-2"
                    isLoading={isSettingPassword}
                  >
                    Criar Senha
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-sm py-2"
                    onClick={() => setNeedsPassword(false)}
                  >
                    Pular
                  </Button>
                </div>
              </form>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Senha criada com sucesso! Agora você pode usar email e senha para acessar o portal.
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-700">
              <strong>Tempo estimado:</strong> A análise do cadastro leva em média 24 horas úteis. 
              Fique atento ao seu e-mail!
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/merchant/login" className="block">
              <Button className="w-full gap-2">
                Ir para o Login
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-primary-100 text-sm">
          Dúvidas? Entre em contato:{' '}
          <a href="mailto:suporte@superapp.com" className="underline">
            suporte@superapp.com
          </a>
        </p>
      </div>
    </div>
  );
}
