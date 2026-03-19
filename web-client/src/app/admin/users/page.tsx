'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Filter,
  User,
  Mail,
  Phone,
  Shield,
  Ban,
  CheckCircle,
  MoreVertical,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { adminService, AdminUser } from '@/services/admin.service';
import { formatDate } from '@/utils/format';

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  CUSTOMER: 'Cliente',
  MERCHANT: 'Merchant',
  DRIVER: 'Entregador',
};

const roleColors: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: 'bg-purple-100', text: 'text-purple-800' },
  CUSTOMER: { bg: 'bg-blue-100', text: 'text-blue-800' },
  MERCHANT: { bg: 'bg-green-100', text: 'text-green-800' },
  DRIVER: { bg: 'bg-orange-100', text: 'text-orange-800' },
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inativo' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspenso' },
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionModal, setActionModal] = useState<'suspend' | 'activate' | 'role' | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [suspendReason, setSuspendReason] = useState('');
  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', roleFilter],
    queryFn: () => adminService.getUsers({
      role: roleFilter !== 'all' ? roleFilter : undefined,
    }),
    placeholderData: {
      data: [
        {
          id: '1',
          firstName: 'João',
          lastName: 'Admin',
          email: 'admin@delivery.com',
          phone: '11999999999',
          role: 'ADMIN' as const,
          status: 'ACTIVE' as const,
          emailVerified: true,
          createdAt: '2024-01-01T10:00:00Z',
          lastLoginAt: '2024-03-08T18:30:00Z',
          totalOrders: 0,
        },
        {
          id: '2',
          firstName: 'Maria',
          lastName: 'Santos',
          email: 'maria@email.com',
          phone: '11988888888',
          role: 'CUSTOMER' as const,
          status: 'ACTIVE' as const,
          emailVerified: true,
          createdAt: '2024-02-15T14:30:00Z',
          lastLoginAt: '2024-03-07T12:00:00Z',
          totalOrders: 15,
        },
        {
          id: '3',
          firstName: 'Carlos',
          lastName: 'Silva',
          email: 'carlos.merchant@email.com',
          phone: '11977777777',
          role: 'MERCHANT' as const,
          status: 'ACTIVE' as const,
          emailVerified: true,
          createdAt: '2024-01-20T09:15:00Z',
          lastLoginAt: '2024-03-08T08:00:00Z',
          totalOrders: 0,
        },
        {
          id: '4',
          firstName: 'Pedro',
          lastName: 'Entregador',
          email: 'pedro.driver@email.com',
          phone: '11966666666',
          role: 'DRIVER' as const,
          status: 'SUSPENDED' as const,
          emailVerified: true,
          createdAt: '2024-02-01T11:00:00Z',
          lastLoginAt: '2024-03-01T15:00:00Z',
          totalOrders: 0,
        },
      ],
      total: 4,
    },
  });

  // Mutations
  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminService.suspendUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setActionModal(null);
      setSelectedUser(null);
      setSuspendReason('');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminService.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setActionModal(null);
      setSelectedUser(null);
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminService.changeUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setActionModal(null);
      setSelectedUser(null);
      setNewRole('');
    },
  });

  const users = data?.data || [];
  const filteredUsers = users.filter(
    (u) =>
      (u.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = (user: AdminUser, action: 'suspend' | 'activate' | 'role') => {
    setSelectedUser(user);
    setActionModal(action);
    if (action === 'role') {
      setNewRole(user.role);
    }
    if (action === 'suspend') {
      setSuspendReason('');
    }
  };

  const confirmAction = () => {
    if (!selectedUser) return;

    if (actionModal === 'suspend') {
      suspendMutation.mutate({ id: selectedUser.id, reason: suspendReason });
    } else if (actionModal === 'activate') {
      activateMutation.mutate(selectedUser.id);
    } else if (actionModal === 'role' && newRole) {
      changeRoleMutation.mutate({ id: selectedUser.id, role: newRole });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <p className="text-gray-500 mt-1">Gerenciar usuários cadastrados na plataforma</p>
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

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="ADMIN">Admin</option>
              <option value="CUSTOMER">Cliente</option>
              <option value="MERCHANT">Merchant</option>
              <option value="DRIVER">Entregador</option>
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
                  Usuário
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Último Login
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Desde {formatDate(new Date(user.createdAt))}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="h-4 w-4" />
                          {user.email}
                          {user.emailVerified && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="h-4 w-4" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          roleColors[user.role]?.bg
                        } ${roleColors[user.role]?.text}`}
                      >
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusColors[user.status]?.bg
                        } ${statusColors[user.status]?.text}`}
                      >
                        {statusColors[user.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.lastLoginAt
                        ? formatDate(new Date(user.lastLoginAt))
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAction(user, 'role')}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title="Alterar tipo"
                        >
                          <Shield className="h-5 w-5" />
                        </button>
                        {user.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleAction(user, 'suspend')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Suspender"
                          >
                            <Ban className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(user, 'activate')}
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
      {actionModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionModal === 'suspend' && 'Suspender Usuário'}
              {actionModal === 'activate' && 'Ativar Usuário'}
              {actionModal === 'role' && 'Alterar Tipo de Usuário'}
            </h3>

            {actionModal === 'suspend' && (
              <div className="mb-6">
                <p className="text-gray-500 mb-4">
                  {`Tem certeza que deseja suspender "${selectedUser.firstName} ${selectedUser.lastName}"?`}
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da suspensão
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Informe o motivo..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                />
              </div>
            )}

            {actionModal === 'activate' && (
              <p className="text-gray-500 mb-6">
                {`Tem certeza que deseja ativar "${selectedUser.firstName} ${selectedUser.lastName}"?`}
              </p>
            )}

            {actionModal === 'role' && (
              <div className="mb-6">
                <p className="text-gray-500 mb-4">
                  Alterar tipo de usuário de "{selectedUser.firstName} {selectedUser.lastName}"
                </p>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="CUSTOMER">Cliente</option>
                  <option value="MERCHANT">Merchant</option>
                  <option value="DRIVER">Entregador</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setActionModal(null);
                  setSelectedUser(null);
                  setNewRole('');
                  setSuspendReason('');
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={confirmAction}
                isLoading={
                  suspendMutation.isPending ||
                  activateMutation.isPending ||
                  changeRoleMutation.isPending
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
