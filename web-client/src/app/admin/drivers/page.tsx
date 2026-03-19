'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bike,
  Car,
  Search,
  Filter,
  Check,
  X,
  MoreVertical,
  Star,
  Phone,
  Mail,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  Package,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { adminService, AdminDriver } from '@/services/admin.service';
import { formatDate } from '@/utils/format';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
  APPROVED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Aprovado' },
  ONLINE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Online' },
  OFFLINE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Offline' },
  ON_DELIVERY: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Em Entrega' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspenso' },
};

const vehicleLabels: Record<string, { icon: typeof Bike; label: string }> = {
  MOTORCYCLE: { icon: Bike, label: 'Moto' },
  BICYCLE: { icon: Bike, label: 'Bicicleta' },
  CAR: { icon: Car, label: 'Carro' },
};

export default function AdminDriversPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDriver, setSelectedDriver] = useState<AdminDriver | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'suspend' | 'activate' | 'reject' | 'view' | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Fetch drivers
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'drivers', statusFilter],
    queryFn: () => adminService.getDrivers({
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    placeholderData: {
      data: [
        {
          id: '1',
          cpf: '12345678900',
          vehicleType: 'MOTORCYCLE' as const,
          vehiclePlate: 'ABC1234',
          vehicleModel: 'Honda CG 160',
          status: 'PENDING_APPROVAL' as const,
          isAvailable: false,
          totalDeliveries: 0,
          averageRating: null,
          totalRatings: 0,
          createdAt: '2024-03-15T10:00:00Z',
          approvedAt: null,
          user: {
            id: 'u1',
            email: 'joao@email.com',
            firstName: 'João',
            lastName: 'Silva',
            phone: '11999999999',
          },
        },
        {
          id: '2',
          cpf: '98765432100',
          vehicleType: 'CAR' as const,
          vehiclePlate: 'XYZ9876',
          vehicleModel: 'Fiat Uno',
          status: 'ONLINE' as const,
          isAvailable: true,
          totalDeliveries: 152,
          averageRating: 4.8,
          totalRatings: 98,
          createdAt: '2024-01-10T08:00:00Z',
          approvedAt: '2024-01-11T14:30:00Z',
          user: {
            id: 'u2',
            email: 'maria@email.com',
            firstName: 'Maria',
            lastName: 'Santos',
            phone: '11888888888',
          },
        },
        {
          id: '3',
          cpf: '11122233344',
          vehicleType: 'BICYCLE' as const,
          vehiclePlate: null,
          vehicleModel: null,
          status: 'SUSPENDED' as const,
          isAvailable: false,
          totalDeliveries: 45,
          averageRating: 3.2,
          totalRatings: 20,
          createdAt: '2024-02-01T12:00:00Z',
          approvedAt: '2024-02-02T09:00:00Z',
          user: {
            id: 'u3',
            email: 'pedro@email.com',
            firstName: 'Pedro',
            lastName: 'Costa',
            phone: '11777777777',
          },
        },
      ],
      total: 3,
    },
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      closeModal();
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.suspendDriver(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      closeModal();
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminService.activateDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      closeModal();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.rejectDriver(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      closeModal();
    },
  });

  const closeModal = () => {
    setActionModal(null);
    setSelectedDriver(null);
    setActionReason('');
  };

  const handleAction = () => {
    if (!selectedDriver) return;

    switch (actionModal) {
      case 'approve':
        approveMutation.mutate(selectedDriver.id);
        break;
      case 'suspend':
        if (actionReason) suspendMutation.mutate({ id: selectedDriver.id, reason: actionReason });
        break;
      case 'activate':
        activateMutation.mutate(selectedDriver.id);
        break;
      case 'reject':
        if (actionReason) rejectMutation.mutate({ id: selectedDriver.id, reason: actionReason });
        break;
    }
  };

  const drivers = data?.data || [];
  const filteredDrivers = drivers.filter(
    (driver) =>
      (driver.user?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (driver.user?.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (driver.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (driver.cpf || '').includes(searchQuery)
  );

  const pendingCount = drivers.filter((d) => d.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entregadores</h1>
          <p className="text-gray-500 mt-1">
            Gerencie os entregadores da plataforma
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Todos os status</option>
              <option value="PENDING_APPROVAL">Pendentes</option>
              <option value="APPROVED">Aprovados</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="ON_DELIVERY">Em Entrega</option>
              <option value="SUSPENDED">Suspensos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendentes</p>
              <p className="text-xl font-bold text-gray-900">
                {drivers.filter((d) => d.status === 'PENDING_APPROVAL').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Online</p>
              <p className="text-xl font-bold text-gray-900">
                {drivers.filter((d) => d.status === 'ONLINE').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Em Entrega</p>
              <p className="text-xl font-bold text-gray-900">
                {drivers.filter((d) => d.status === 'ON_DELIVERY').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Suspensos</p>
              <p className="text-xl font-bold text-gray-900">
                {drivers.filter((d) => d.status === 'SUSPENDED').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Bike className="h-12 w-12 mb-4" />
            <p>Nenhum entregador encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    Entregador
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    Veículo
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    Entregas
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    Avaliação
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    Cadastro
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDrivers.map((driver) => {
                  const vehicle = vehicleLabels[driver.vehicleType];
                  const VehicleIcon = vehicle?.icon || Bike;
                  const status = statusColors[driver.status] || statusColors.OFFLINE;

                  return (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {driver.user.firstName} {driver.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{driver.user.email}</p>
                          {driver.user.phone && (
                            <p className="text-sm text-gray-400">{driver.user.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <VehicleIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900">{vehicle?.label}</p>
                            {driver.vehiclePlate && (
                              <p className="text-xs text-gray-500">{driver.vehiclePlate}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{driver.totalDeliveries}</span>
                      </td>
                      <td className="px-6 py-4">
                        {driver.averageRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-gray-900">{driver.averageRating.toFixed(1)}</span>
                            <span className="text-gray-400 text-sm">({driver.totalRatings})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(driver.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {driver.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedDriver(driver);
                                  setActionModal('approve');
                                }}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Aprovar"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDriver(driver);
                                  setActionModal('reject');
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Rejeitar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {(driver.status === 'APPROVED' ||
                            driver.status === 'ONLINE' ||
                            driver.status === 'OFFLINE' ||
                            driver.status === 'ON_DELIVERY') && (
                            <button
                              onClick={() => {
                                setSelectedDriver(driver);
                                setActionModal('suspend');
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Suspender"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          {driver.status === 'SUSPENDED' && (
                            <button
                              onClick={() => {
                                setSelectedDriver(driver);
                                setActionModal('activate');
                              }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Reativar"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setActionModal('view');
                            }}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Action Modal */}
      {actionModal && selectedDriver && actionModal !== 'view' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionModal === 'approve' && 'Aprovar Entregador'}
              {actionModal === 'suspend' && 'Suspender Entregador'}
              {actionModal === 'activate' && 'Reativar Entregador'}
              {actionModal === 'reject' && 'Rejeitar Cadastro'}
            </h3>

            <p className="text-gray-600 mb-4">
              {actionModal === 'approve' && (
                <>
                  Deseja aprovar o entregador{' '}
                  <strong>
                    {selectedDriver.user.firstName} {selectedDriver.user.lastName}
                  </strong>
                  ? Ele poderá começar a receber pedidos.
                </>
              )}
              {actionModal === 'suspend' && (
                <>
                  Deseja suspender o entregador{' '}
                  <strong>
                    {selectedDriver.user.firstName} {selectedDriver.user.lastName}
                  </strong>
                  ?
                </>
              )}
              {actionModal === 'activate' && (
                <>
                  Deseja reativar o entregador{' '}
                  <strong>
                    {selectedDriver.user.firstName} {selectedDriver.user.lastName}
                  </strong>
                  ?
                </>
              )}
              {actionModal === 'reject' && (
                <>
                  Deseja rejeitar o cadastro de{' '}
                  <strong>
                    {selectedDriver.user.firstName} {selectedDriver.user.lastName}
                  </strong>
                  ?
                </>
              )}
            </p>

            {(actionModal === 'suspend' || actionModal === 'reject') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo {actionModal === 'reject' ? 'da rejeição' : 'da suspensão'}
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Informe o motivo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={closeModal} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleAction}
                isLoading={
                  approveMutation.isPending ||
                  suspendMutation.isPending ||
                  activateMutation.isPending ||
                  rejectMutation.isPending
                }
                className={`flex-1 ${
                  actionModal === 'approve' || actionModal === 'activate'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={
                  (actionModal === 'suspend' || actionModal === 'reject') && !actionReason
                }
              >
                {actionModal === 'approve' && 'Aprovar'}
                {actionModal === 'suspend' && 'Suspender'}
                {actionModal === 'activate' && 'Reativar'}
                {actionModal === 'reject' && 'Rejeitar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {actionModal === 'view' && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Entregador</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Personal Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Bike className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {selectedDriver.user.firstName} {selectedDriver.user.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">{selectedDriver.user.email}</p>
                  {selectedDriver.user.phone && (
                    <p className="text-sm text-gray-500">{selectedDriver.user.phone}</p>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">CPF</p>
                  <p className="font-medium">
                    {selectedDriver.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Veículo</p>
                  <p className="font-medium">
                    {vehicleLabels[selectedDriver.vehicleType]?.label}
                    {selectedDriver.vehiclePlate && ` - ${selectedDriver.vehiclePlate}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total de Entregas</p>
                  <p className="font-medium">{selectedDriver.totalDeliveries}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avaliação</p>
                  <p className="font-medium">
                    {selectedDriver.averageRating
                      ? `${selectedDriver.averageRating.toFixed(1)} (${selectedDriver.totalRatings} avaliações)`
                      : 'Sem avaliações'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cadastro</p>
                  <p className="font-medium">{formatDate(selectedDriver.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Aprovação</p>
                  <p className="font-medium">
                    {selectedDriver.approvedAt ? formatDate(selectedDriver.approvedAt) : 'Pendente'}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Status Atual</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[selectedDriver.status]?.bg
                  } ${statusColors[selectedDriver.status]?.text}`}
                >
                  {statusColors[selectedDriver.status]?.label}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button variant="outline" onClick={closeModal} className="w-full">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
