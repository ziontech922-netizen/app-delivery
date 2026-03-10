'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tag,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  X,
  Percent,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { adminService, AdminCoupon } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/utils/format';

interface CouponFormData {
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

const initialFormData: CouponFormData = {
  code: '',
  description: '',
  type: 'PERCENTAGE',
  value: 10,
  minOrderAmount: null,
  maxDiscountAmount: null,
  usageLimit: null,
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<AdminCoupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(initialFormData);

  // Fetch coupons
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'coupons', statusFilter],
    queryFn: () => adminService.getCoupons({
      isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    }),
    placeholderData: {
      data: [
        {
          id: '1',
          code: 'BEMVINDO10',
          description: '10% de desconto para novos usuários',
          type: 'PERCENTAGE' as const,
          value: 10,
          minOrderAmount: 30,
          maxDiscountAmount: 20,
          usageLimit: 1000,
          usageCount: 245,
          startsAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-12-31T23:59:59Z',
          isActive: true,
          createdAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          code: 'FRETE5',
          description: 'R$5 de desconto no frete',
          type: 'FIXED' as const,
          value: 5,
          minOrderAmount: null,
          maxDiscountAmount: null,
          usageLimit: null,
          usageCount: 89,
          startsAt: '2024-03-01T00:00:00Z',
          expiresAt: '2024-03-31T23:59:59Z',
          isActive: true,
          createdAt: '2024-03-01T12:00:00Z',
        },
        {
          id: '3',
          code: 'PROMO20',
          description: '20% de desconto promocional',
          type: 'PERCENTAGE' as const,
          value: 20,
          minOrderAmount: 50,
          maxDiscountAmount: 30,
          usageLimit: 500,
          usageCount: 500,
          startsAt: '2024-02-01T00:00:00Z',
          expiresAt: '2024-02-29T23:59:59Z',
          isActive: false,
          createdAt: '2024-02-01T08:00:00Z',
        },
      ],
      total: 3,
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Omit<CouponFormData, 'isActive'>) => adminService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      closeFormModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CouponFormData> }) =>
      adminService.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      closeFormModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      setShowDeleteModal(false);
      setDeletingCoupon(null);
    },
  });

  const coupons = data?.data || [];
  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData(initialFormData);
    setShowFormModal(true);
  };

  const openEditModal = (coupon: AdminCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      usageLimit: coupon.usageLimit,
      startsAt: coupon.startsAt.split('T')[0],
      expiresAt: coupon.expiresAt.split('T')[0],
      isActive: coupon.isActive,
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingCoupon(null);
    setFormData(initialFormData);
  };

  const openDeleteModal = (coupon: AdminCoupon) => {
    setDeletingCoupon(coupon);
    setShowDeleteModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      startsAt: new Date(formData.startsAt).toISOString(),
      expiresAt: new Date(formData.expiresAt).toISOString(),
    };
    
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cupons</h1>
          <p className="text-gray-500 mt-1">Gerenciar cupons de desconto</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Novo Cupom
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cupom
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Desconto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Uso
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Validade
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum cupom encontrado
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Tag className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 font-mono">
                            {coupon.code}
                          </p>
                          <p className="text-xs text-gray-500 max-w-[200px] truncate">
                            {coupon.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {coupon.type === 'PERCENTAGE' ? (
                          <>
                            <Percent className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{coupon.value}%</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              {formatCurrency(coupon.value)}
                            </span>
                          </>
                        )}
                      </div>
                      {coupon.minOrderAmount && (
                        <p className="text-xs text-gray-500 mt-1">
                          Mín: {formatCurrency(coupon.minOrderAmount)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {coupon.usageCount}
                          {coupon.usageLimit && (
                            <span className="text-gray-400">
                              /{coupon.usageLimit}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          {formatDate(new Date(coupon.expiresAt))}
                        </span>
                      </div>
                      {isExpired(coupon.expiresAt) && (
                        <span className="text-xs text-red-500">Expirado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {coupon.isActive && !isExpired(coupon.expiresAt) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle className="h-3 w-3" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(coupon)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(coupon)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
                </h3>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="Ex: DESCONTO10"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono uppercase"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Ex: 10% de desconto em pedidos acima de R$50"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as 'PERCENTAGE' | 'FIXED',
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="PERCENTAGE">Porcentagem</option>
                      <option value="FIXED">Valor Fixo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {formData.type === 'PERCENTAGE' ? '%' : 'R$'}
                      </span>
                      <input
                        type="number"
                        value={formData.value}
                        onChange={(e) =>
                          setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Min Order & Max Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pedido Mínimo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        R$
                      </span>
                      <input
                        type="number"
                        value={formData.minOrderAmount || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minOrderAmount: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder="Opcional"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desconto Máximo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        R$
                      </span>
                      <input
                        type="number"
                        value={formData.maxDiscountAmount || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder="Opcional"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite de Uso
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageLimit: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Ilimitado"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Início *
                    </label>
                    <input
                      type="date"
                      value={formData.startsAt}
                      onChange={(e) =>
                        setFormData({ ...formData, startsAt: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiração *
                    </label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) =>
                        setFormData({ ...formData, expiresAt: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>

                {/* Active */}
                {editingCoupon && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Cupom ativo
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeFormModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingCoupon ? 'Salvar' : 'Criar Cupom'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Excluir Cupom</h3>
            <p className="text-gray-500 mb-6">
              Tem certeza que deseja excluir o cupom{' '}
              <span className="font-medium text-gray-900 font-mono">
                {deletingCoupon.code}
              </span>
              ? Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCoupon(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => deleteMutation.mutate(deletingCoupon.id)}
                isLoading={deleteMutation.isPending}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
