'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, MapPin, Edit2, Trash2, Star, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store';
import { userService, type CreateAddressData } from '@/services/user.service';
import type { Address } from '@/types';

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreateAddressData>({
    label: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadAddresses();
  }, [isAuthenticated, router]);

  const loadAddresses = async () => {
    try {
      const data = await userService.getAddresses();
      setAddresses(data);
    } catch {
      setError('Erro ao carregar endereços');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ label: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', isDefault: false });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (addr: Address) => {
    setForm({
      label: addr.label || '',
      street: addr.street,
      number: addr.number,
      complement: addr.complement || '',
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) return;
    try {
      await userService.deleteAddress(id);
      setAddresses(addresses.filter(a => a.id !== id));
    } catch {
      setError('Erro ao excluir endereço');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      if (editingId) {
        const updated = await userService.updateAddress(editingId, form);
        setAddresses(addresses.map(a => a.id === editingId ? updated : (form.isDefault ? { ...a, isDefault: false } : a)));
      } else {
        const created = await userService.createAddress(form);
        if (form.isDefault) {
          setAddresses([...addresses.map(a => ({ ...a, isDefault: false })), created]);
        } else {
          setAddresses([...addresses, created]);
        }
      }
      resetForm();
    } catch {
      setError('Erro ao salvar endereço');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({
          ...f,
          street: data.logradouro || f.street,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }));
      }
    } catch { /* ignore */ }
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
          <h1 className="text-lg font-bold flex-1">Endereços salvos</h1>
          {!showForm && (
            <button onClick={() => { resetForm(); setShowForm(true); }} className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 space-y-3">
            <h3 className="font-semibold text-gray-900">{editingId ? 'Editar endereço' : 'Novo endereço'}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Apelido</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Casa, Trabalho..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CEP *</label>
                <input value={form.zipCode} onChange={e => { setForm({ ...form, zipCode: e.target.value }); if (e.target.value.replace(/\D/g,'').length === 8) fetchCep(e.target.value); }} placeholder="00000-000" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Rua *</label>
                <input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nº *</label>
                <input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
              <input value={form.complement} onChange={e => setForm({ ...form, complement: e.target.value })} placeholder="Apto, Bloco..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bairro *</label>
              <input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Cidade *</label>
                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">UF *</label>
                <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
              <span className="text-sm text-gray-700">Endereço padrão</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={resetForm} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {addresses.length === 0 && !showForm ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">Nenhum endereço cadastrado</p>
            <p className="text-sm text-gray-400">Adicione um endereço para facilitar seus pedidos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{addr.label || 'Endereço'}</span>
                      {addr.isDefault && (
                        <span className="flex items-center gap-0.5 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3" /> Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ''}
                    </p>
                    <p className="text-sm text-gray-400">
                      {addr.neighborhood} - {addr.city}/{addr.state}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(addr)} className="p-2 hover:bg-gray-100 rounded-full">
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(addr.id)} className="p-2 hover:bg-red-50 rounded-full">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
