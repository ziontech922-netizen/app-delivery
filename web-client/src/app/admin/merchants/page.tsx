'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Search,
  Filter,
  Check,
  X,
  MoreVertical,
  Star,
  MapPin,
  Eye,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { adminService, AdminMerchant } from '@/services/admin.service';
import { formatDate } from '@/utils/format';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inativo' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspenso' },
};

export default function AdminMerchantsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMerchant, setSelectedMerchant] = useState<AdminMerchant | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'suspend' | 'activate' | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Fetch merchants
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'merchants', statusFilter],
    queryFn: () => adminService.getMerchants({
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    placeholderData: {
      data: [
        {
          id: '1',
          businessName: 'Pizzaria Bella Italia',
          tradeName: 'Bella Italia',
          document: '12.345.678/0001-90',
          status: 'ACTIVE' as const,
          city: 'São Paulo',
          state: 'SP',
          isOpen: true,
          averageRating: 4.5,
          totalReviews: 128,
          createdAt: '2024-01-15T10:00:00Z',
          user: { email: 'bella@email.com', firstName: 'João', lastName: 'Silva' },
        },
        {
          id: '2',
          businessName: 'Burguer House',
          tradeName: null,
          document: '98.765.432/0001-10',
          status: 'PENDING_APPROVAL' as const,
          city: 'São Paulo',
          state: 'SP',
          isOpen: false,
          averageRating: null,
          totalReviews: 0,
          createdAt: '2024-03-08T14:30:00Z',
          user: { email: 'burguer@email.com', firstName: 'Maria', lastName: 'Santos' },
        },
        {
          id: '3',
          businessName: 'Sushi Master',
          tradeName: 'Sushi Master',
          document: '11.222.333/0001-44',
          status: 'SUSPENDED' as const,
          city: 'Rio de Janeiro',
          state: 'RJ',
          isOpen: false,
          averageRating: 3.8,
          totalReviews: 45,
          createdAt: '2024-02-20T09:15:00Z',
          user: { email: 'sushi@email.com', firstName: 'Carlos', lastName: 'Tanaka' },
        },
      ],
      total: 3,
    },
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveMerchant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'merchants'] });
      setActionModal(null);
      setSelectedMerchant(null);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.suspendMerchant(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'merchants'] });
      setActionModal(null);
      setSelectedMerchant(null);
      setSuspendReason('');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminService.activateMerchant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'merchants'] });
      setActionModal(null);
      setSelectedMerchant(null);
    },
  });

  const merchants = data?.data || [];
  const filteredMerchants = merchants.filter(
    (m) =>
      m.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tradeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = (merchant: AdminMerchant, action: 'approve' | 'suspend' | 'activate') => {
    setSelectedMerchant(merchant);
    setActionModal(action);
  };

  const confirmAction = () => {
    if (!selectedMerchant) return;

    if (actionModal === 'approve') {
      approveMutation.mutate(selectedMerchant.id);
    } else if (actionModal === 'suspend') {
      suspendMutation.mutate({ id: selectedMerchant.id, reason: suspendReason });
    } else if (actionModal === 'activate') {
      activateMutation.mutate(selectedMerchant.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchants</h1>
          <p className="text-gray-500 mt-1">Gerenciar estabelecimentos cadastrados</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email..."
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
              <option value="all">Todos os Status</option>
              <option value="PENDING_APPROVAL">Pendentes</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
              <option value="SUSPENDED">Suspensos</option>
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
                  Estabelecimento
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Proprietário
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Avaliação
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Nenhum merchant encontrado
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Store className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {merchant.tradeName || merchant.businessName}
                          </p>
                          <p className="text-xs text-gray-500">{merchant.document}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {merchant.user.firstName} {merchant.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{merchant.user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {merchant.city}/{merchant.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {merchant.averageRating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">
                            {merchant.averageRating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({merchant.totalReviews})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sem avaliações</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusColors[merchant.status]?.bg
                        } ${statusColors[merchant.status]?.text}`}
                      >
                        {statusColors[merchant.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(new Date(merchant.createdAt))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {merchant.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => handleAction(merchant, 'approve')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Aprovar"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        {merchant.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleAction(merchant, 'suspend')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Suspender"
                          >
                            <Ban className="h-5 w-5" />
                          </button>
                        )}
                        {(merchant.status === 'SUSPENDED' || merchant.status === 'INACTIVE') && (
                          <button
                            onClick={() => handleAction(merchant, 'activate')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Ativar"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Modal */}
      {actionModal && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionModal === 'approve' && 'Aprovar Merchant'}
              {actionModal === 'suspend' && 'Suspender Merchant'}
              {actionModal === 'activate' && 'Ativar Merchant'}
            </h3>

            <p className="text-gray-500 mb-4">
              {actionModal === 'approve' &&
                `Tem certeza que deseja aprovar "${selectedMerchant.tradeName || selectedMerchant.businessName}"?`}
              {actionModal === 'suspend' &&
                `Tem certeza que deseja suspender "${selectedMerchant.tradeName || selectedMerchant.businessName}"?`}
              {actionModal === 'activate' &&
                `Tem certeza que deseja ativar "${selectedMerchant.tradeName || selectedMerchant.businessName}"?`}
            </p>

            {actionModal === 'suspend' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da suspensão
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Informe o motivo..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setActionModal(null);
                  setSelectedMerchant(null);
                  setSuspendReason('');
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={confirmAction}
                isLoading={
                  approveMutation.isPending ||
                  suspendMutation.isPending ||
                  activateMutation.isPending
                }
                disabled={actionModal === 'suspend' && !suspendReason.trim()}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
