'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Percent,
  DollarSign,
  Calendar,
  Tag,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  Copy,
  Check,
  AlertCircle,
  Users,
  ShoppingBag,
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { formatCurrency } from '@/utils/format';
import api from '@/services/api';

// Types
interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  usageLimitPerUser: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
}

interface CouponFormData {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  usageLimit: number;
  usageLimitPerUser: number;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
}

const initialFormData: CouponFormData = {
  code: '',
  type: 'PERCENT',
  value: 10,
  minOrderValue: 0,
  maxDiscount: 0,
  usageLimit: 0,
  usageLimitPerUser: 1,
  startDate: '',
  endDate: '',
  description: '',
  isActive: true,
};

// Service functions
const couponService = {
  async list() {
    const response = await api.get<Coupon[]>('/coupons');
    return response.data;
  },

  async create(data: Partial<CouponFormData>) {
    const response = await api.post<Coupon>('/coupons', {
      ...data,
      minOrderValue: data.minOrderValue || null,
      maxDiscount: data.maxDiscount || null,
      usageLimit: data.usageLimit || null,
      usageLimitPerUser: data.usageLimitPerUser || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
    });
    return response.data;
  },

  async update(id: string, data: Partial<CouponFormData>) {
    const response = await api.put<Coupon>(`/coupons/${id}`, {
      ...data,
      minOrderValue: data.minOrderValue || null,
      maxDiscount: data.maxDiscount || null,
      usageLimit: data.usageLimit || null,
      usageLimitPerUser: data.usageLimitPerUser || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
    });
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/coupons/${id}`);
  },

  async toggle(id: string, isActive: boolean) {
    const response = await api.put<Coupon>(`/coupons/${id}`, { isActive });
    return response.data;
  },
};

export default function MerchantCouponsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(initialFormData);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch coupons
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['merchant', 'coupons'],
    queryFn: couponService.list,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: couponService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'coupons'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CouponFormData> }) =>
      couponService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'coupons'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: couponService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'coupons'] });
      setShowDeleteModal(false);
      setDeletingCoupon(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      couponService.toggle(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'coupons'] });
    },
  });

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscount: coupon.maxDiscount || 0,
      usageLimit: coupon.usageLimit || 0,
      usageLimitPerUser: coupon.usageLimitPerUser || 1,
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
      endDate: coupon.endDate ? coupon.endDate.split('T')[0] : '',
      description: coupon.description || '',
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      code: formData.code.toUpperCase().replace(/\s/g, ''),
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.isActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Inativo</span>;
    }
    if (isExpired(coupon.endDate)) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full">Expirado</span>;
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-600 rounded-full">Esgotado</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-600 rounded-full">Ativo</span>;
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cupons de Desconto</h1>
          <p className="text-gray-500 mt-1">Gerencie seus cupons promocionais</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Tag className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cupons Ativos</p>
              <p className="text-xl font-bold text-gray-900">
                {coupons.filter(c => c.isActive && !isExpired(c.endDate)).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Usos</p>
              <p className="text-xl font-bold text-gray-900">
                {coupons.reduce((acc, c) => acc + c.usageCount, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Cupons</p>
              <p className="text-xl font-bold text-gray-900">{coupons.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Coupons List */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-500 mt-2">Carregando cupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum cupom criado ainda</p>
            <Button variant="outline" className="mt-4" onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro cupom
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desconto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono font-semibold">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copiar código"
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {coupon.type === 'PERCENT' ? (
                          <>
                            <Percent className="h-4 w-4 text-purple-500" />
                            <span className="font-semibold">{coupon.value}%</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="font-semibold">{formatCurrency(coupon.value)}</span>
                          </>
                        )}
                      </div>
                      {coupon.minOrderValue && coupon.minOrderValue > 0 && (
                        <p className="text-xs text-gray-500">
                          Mínimo: {formatCurrency(coupon.minOrderValue)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {coupon.startDate || coupon.endDate ? (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sem limite</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {coupon.usageCount}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(coupon)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                          title={coupon.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {coupon.isActive ? (
                            <ToggleRight className="h-5 w-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(coupon)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingCoupon(coupon);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código do Cupom *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: DESCONTO10"
                  required
                  className="uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Use letras e números sem espaços</p>
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Desconto *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PERCENT' | 'FIXED' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    title="Tipo de Desconto"
                  >
                    <option value="PERCENT">Porcentagem (%)</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {formData.type === 'PERCENT' ? '%' : 'R$'}
                    </span>
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                      min={0}
                      max={formData.type === 'PERCENT' ? 100 : undefined}
                      step={formData.type === 'PERCENT' ? 1 : 0.01}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Min Order and Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pedido Mínimo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      type="number"
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                      min={0}
                      step={0.01}
                      className="pl-10"
                    />
                  </div>
                </div>
                {formData.type === 'PERCENT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desconto Máximo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                      <Input
                        type="number"
                        value={formData.maxDiscount}
                        onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                        min={0}
                        step={0.01}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite Total de Usos
                  </label>
                  <Input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    min={0}
                    placeholder="0 = ilimitado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usos por Usuário
                  </label>
                  <Input
                    type="number"
                    value={formData.usageLimitPerUser}
                    onChange={(e) => setFormData({ ...formData, usageLimitPerUser: Number(e.target.value) })}
                    min={0}
                    placeholder="0 = ilimitado"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Início
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Fim
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Desconto de 10% em todos os pedidos"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Cupom Ativo</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  title={formData.isActive ? 'Desativar cupom' : 'Ativar cupom'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingCoupon ? 'Salvar' : 'Criar Cupom'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Excluir Cupom</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o cupom <strong>{deletingCoupon.code}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => deleteMutation.mutate(deletingCoupon.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
