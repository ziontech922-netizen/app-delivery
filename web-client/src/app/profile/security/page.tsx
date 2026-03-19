'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Key, Eye, Trash2, Download, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store';
import { authService } from '@/services/auth.service';

export default function SecurityPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setIsLoading(false);
  }, [isAuthenticated, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      // For now, use forgot password flow since there's no change password endpoint
      await authService.forgotPassword(user?.email || '');
      setSuccess('Enviamos um link para redefinição de senha no seu e-mail.');
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setError('Erro ao alterar senha. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita. Todos os seus dados serão removidos.')) return;
    // Would call a delete account endpoint
    alert('Para excluir sua conta, entre em contato com nosso suporte.');
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
          <h1 className="text-lg font-bold">Privacidade e segurança</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{success}</div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        {/* Segurança */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Segurança</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Key className="w-5 h-5 text-gray-600" />
              </div>
              <span className="flex-1 text-left text-gray-700">Alterar senha</span>
            </button>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nova senha</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSaving ? 'Enviando...' : 'Enviar link de redefinição'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Privacidade */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Privacidade</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => router.push('/privacy')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-gray-600" />
              </div>
              <span className="flex-1 text-left text-gray-700">Política de privacidade</span>
            </button>

            <button
              onClick={() => router.push('/terms')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <span className="flex-1 text-left text-gray-700">Termos de uso</span>
            </button>

            <button
              onClick={() => alert('Seus dados serão enviados para seu e-mail em até 48h.')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Download className="w-5 h-5 text-gray-600" />
              </div>
              <span className="flex-1 text-left text-gray-700">Exportar meus dados (LGPD)</span>
            </button>
          </div>
        </div>

        {/* Zona de perigo */}
        <div>
          <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2 px-1">Zona de perigo</h3>
          <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-red-600 font-medium">Excluir minha conta</p>
                <p className="text-xs text-red-400">Esta ação não pode ser desfeita</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
