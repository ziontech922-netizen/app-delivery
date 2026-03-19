'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Coins,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Percent,
  DollarSign,
  CheckCircle,
  XCircle,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import {
  platformFeeService,
  PlatformFee,
  CreatePlatformFeeDto,
} from '@/services/platformFee.service';
import { formatCurrency } from '@/utils/format';

interface FeeFormData {
  name: string;
  description: string;
  percentage: number | null;
  fixedFee: number | null;
  deliveryFee: number | null;
  merchantId: string | null;
  minOrderValue: number | null;
  maxFee: number | null;
  isActive: boolean;
  priority: number;
}

const initialFormData: FeeFormData = {
  name: '',
  description: '',
  percentage: null,
  fixedFee: null,
  deliveryFee: null,
  merchantId: null,
  minOrderValue: null,
  maxFee: null,
  isActive: true,
  priority: 0,
};

export default function AdminPlatformFeesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFee, setEditingFee] = useState<PlatformFee | null>(null);
  const [deletingFee, setDeletingFee] = useState<PlatformFee | null>(null);
  const [formData, setFormData] = useState<FeeFormData>(initialFormData);

  // Fetch fees
  const { data: fees, isLoading } = useQuery({
    queryKey: ['admin', 'platform-fees', statusFilter],
    queryFn: () =>
      platformFeeService.getAll({
        isActive:
          statusFilter === 'active'
            ? true
            : statusFilter === 'inactive'
              ? false
              : undefined,
      }),
    placeholderData: [
      {
        id: '1',
        name: 'Taxa Global Padrão',
        description: 'Comissão padrão da plataforma',
        percentage: 10,
        fixedFee: 2,
        deliveryFee: null,
        merchantId: null,
        merchantName: undefined,
        minOrderValue: null,
        maxFee: 50,
        isActive: true,
        priority: 0,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
    ],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePlatformFeeDto) => platformFeeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'platform-fees'] });
      setShowFormModal(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePlatformFeeDto }) =>
      platformFeeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'platform-fees'] });
      setShowFormModal(false);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => platformFeeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'platform-fees'] });
      setShowDeleteModal(false);
      setDeletingFee(null);
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingFee(null);
  };

  const handleEdit = (fee: PlatformFee) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      description: fee.description || '',
      percentage: fee.percentage,
      fixedFee: fee.fixedFee,
      deliveryFee: fee.deliveryFee,
      merchantId: fee.merchantId,
      minOrderValue: fee.minOrderValue,
      maxFee: fee.maxFee,
      isActive: fee.isActive,
      priority: fee.priority,
    });
    setShowFormModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreatePlatformFeeDto = {
      name: formData.name,
      description: formData.description || undefined,
      percentage: formData.percentage || undefined,
      fixedFee: formData.fixedFee || undefined,
      deliveryFee: formData.deliveryFee || undefined,
      merchantId: formData.merchantId || undefined,
      minOrderValue: formData.minOrderValue || undefined,
      maxFee: formData.maxFee || undefined,
      isActive: formData.isActive,
      priority: formData.priority,
    };

    if (editingFee) {
      updateMutation.mutate({ id: editingFee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filter fees
  const filteredFees =
    fees?.filter((fee) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !(fee.name || '').toLowerCase().includes(query) &&
          !(fee.description || '').toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taxas da Plataforma</h1>
          <p className="text-gray-500">
            Gerencie as comissões e taxas de serviço
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowFormModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Taxa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar taxas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Coins className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Taxas</p>
              <p className="text-xl font-bold">{fees?.length || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ativas</p>
              <p className="text-xl font-bold">
                {fees?.filter((f) => f.isActive).length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Globais</p>
              <p className="text-xl font-bold">
                {fees?.filter((f) => !f.merchantId).length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Percent className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Por Merchant</p>
              <p className="text-xl font-bold">
                {fees?.filter((f) => f.merchantId).length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fees List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Taxa
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Tipo
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Comissão %
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Taxa Fixa
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Delivery Add.
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Nenhuma taxa encontrada
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => (
                  <tr
                    key={fee.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{fee.name}</p>
                        {fee.description && (
                          <p className="text-sm text-gray-500">{fee.description}</p>
                        )}
                        {fee.merchantName && (
                          <p className="text-xs text-blue-600 mt-1">
                            Merchant: {fee.merchantName}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          fee.merchantId
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {fee.merchantId ? 'Específica' : 'Global'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {fee.percentage ? (
                        <span className="flex items-center gap-1">
                          <Percent className="h-3 w-3 text-gray-400" />
                          {fee.percentage}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {fee.fixedFee ? (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          {formatCurrency(fee.fixedFee)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {fee.deliveryFee ? (
                        formatCurrency(fee.deliveryFee)
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {fee.isActive ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <XCircle className="h-4 w-4" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(fee)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingFee(fee);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Create/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingFee ? 'Editar Taxa' : 'Nova Taxa'}
              </h2>
              <button
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Taxa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Ex: Taxa Global Padrão"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descrição opcional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Comissão Percentual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comissão Percentual (%)
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Deduzida do valor do merchant
                </p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.percentage || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      percentage: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="Ex: 10"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Taxa Fixa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taxa de Serviço Fixa (R$)
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Cobrada do cliente
                </p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fixedFee || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fixedFee: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="Ex: 2.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Taxa de Delivery Adicional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taxa de Delivery Adicional (R$)
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Adicionada ao frete do cliente
                </p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deliveryFee || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryFee: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="Ex: 1.50"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Merchant ID (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Merchant ID (opcional)
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Deixe vazio para taxa global
                </p>
                <input
                  type="text"
                  value={formData.merchantId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      merchantId: e.target.value || null,
                    })
                  }
                  placeholder="ID do merchant"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Valor Mínimo do Pedido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Mínimo do Pedido (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minOrderValue || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderValue: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Teto Máximo da Taxa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teto Máximo da Taxa (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxFee || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxFee: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Maior valor tem preferência
                </p>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Taxa ativa
                </label>
              </div>

              {/* Info */}
              {!formData.merchantId && formData.isActive && (
                <div className="p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    Esta é uma taxa global. Apenas uma taxa global pode estar ativa
                    por vez. Se já houver outra taxa global ativa, esta ação falhará.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowFormModal(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingFee ? 'Salvar' : 'Criar Taxa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingFee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold">Desativar Taxa</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja desativar a taxa{' '}
              <strong>{deletingFee.name}</strong>? A taxa será marcada como
              inativa e não será mais aplicada em novos pedidos.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingFee(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => deleteMutation.mutate(deletingFee.id)}
                isLoading={deleteMutation.isPending}
              >
                Desativar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
