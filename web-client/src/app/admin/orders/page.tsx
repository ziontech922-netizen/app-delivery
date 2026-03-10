'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Search,
  Filter,
  Eye,
  X,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { adminService, AdminOrder } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/utils/format';

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-500', label: 'Pendente' },
  ACCEPTED: { icon: CheckCircle, color: 'text-blue-500', label: 'Aceito' },
  PREPARING: { icon: Package, color: 'text-purple-500', label: 'Preparando' },
  READY: { icon: Package, color: 'text-indigo-500', label: 'Pronto' },
  PICKED_UP: { icon: Truck, color: 'text-cyan-500', label: 'Em entrega' },
  DELIVERED: { icon: CheckCircle, color: 'text-green-500', label: 'Entregue' },
  CANCELLED: { icon: XCircle, color: 'text-red-500', label: 'Cancelado' },
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch orders
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', statusFilter],
    queryFn: () => adminService.getOrders({
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    placeholderData: {
      data: [
        {
          id: '1',
          orderNumber: 'ORD-2024-001',
          status: 'DELIVERED',
          totalAmount: 89.90,
          deliveryFee: 8.00,
          createdAt: '2024-03-08T18:30:00Z',
          deliveredAt: '2024-03-08T19:15:00Z',
          customer: { id: 'c1', firstName: 'Carlos', lastName: 'Silva', email: 'carlos@email.com' },
          merchant: { id: 'm1', tradeName: 'Pizzaria Bella Italia' },
          driver: { id: 'd1', firstName: 'Pedro', lastName: 'Santos' },
          items: [
            { name: 'Pizza Margherita Grande', quantity: 1, price: 45.90 },
            { name: 'Pizza Calabresa Média', quantity: 1, price: 36.00 },
          ],
          deliveryAddress: { street: 'Rua das Flores', number: '123', neighborhood: 'Centro', city: 'São Paulo' },
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-002',
          status: 'PREPARING',
          totalAmount: 52.50,
          deliveryFee: 5.00,
          createdAt: '2024-03-08T19:45:00Z',
          deliveredAt: null,
          customer: { id: 'c2', firstName: 'Ana', lastName: 'Costa', email: 'ana@email.com' },
          merchant: { id: 'm2', tradeName: 'Burguer House' },
          driver: null,
          items: [
            { name: 'Combo X-Bacon', quantity: 2, price: 23.75 },
          ],
          deliveryAddress: { street: 'Av. Paulista', number: '1000', neighborhood: 'Bela Vista', city: 'São Paulo' },
        },
        {
          id: '3',
          orderNumber: 'ORD-2024-003',
          status: 'CANCELLED',
          totalAmount: 75.00,
          deliveryFee: 6.00,
          createdAt: '2024-03-08T12:00:00Z',
          deliveredAt: null,
          customer: { id: 'c3', firstName: 'Roberto', lastName: 'Lima', email: 'roberto@email.com' },
          merchant: { id: 'm3', tradeName: 'Sushi Master' },
          driver: null,
          items: [
            { name: 'Combo Sashimi', quantity: 1, price: 69.00 },
          ],
          deliveryAddress: { street: 'Rua Augusta', number: '500', neighborhood: 'Consolação', city: 'São Paulo' },
        },
      ] as AdminOrder[],
      total: 3,
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminService.cancelOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setShowCancelModal(false);
      setSelectedOrder(null);
      setCancelReason('');
    },
  });

  const orders = data?.data || [];
  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.merchant.tradeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openDetails = (order: AdminOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const openCancel = (order: AdminOrder) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 mt-1">Visualizar e gerenciar pedidos da plataforma</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, cliente, merchant..."
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
              <option value="PENDING">Pendente</option>
              <option value="ACCEPTED">Aceito</option>
              <option value="PREPARING">Preparando</option>
              <option value="READY">Pronto</option>
              <option value="PICKED_UP">Em entrega</option>
              <option value="DELIVERED">Entregue</option>
              <option value="CANCELLED">Cancelado</option>
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
                  Pedido
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Merchant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Entregador
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total
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
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status]?.icon || Clock;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(new Date(order.createdAt))}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {order.customer.firstName} {order.customer.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{order.customer.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{order.merchant.tradeName}</p>
                      </td>
                      <td className="px-6 py-4">
                        {order.driver ? (
                          <p className="text-sm text-gray-900">
                            {order.driver.firstName} {order.driver.lastName}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-400">Não atribuído</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon
                            className={`h-4 w-4 ${statusConfig[order.status]?.color}`}
                          />
                          <span className="text-sm">{statusConfig[order.status]?.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetails(order)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            title="Ver detalhes"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                            <button
                              onClick={() => openCancel(order)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Cancelar pedido"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalhes do Pedido
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedOrder.orderNumber}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(new Date(selectedOrder.createdAt))}
                  </p>
                </div>

                {/* Items */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Itens</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-gray-500">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between text-sm">
                      <span>Taxa de entrega</span>
                      <span className="text-gray-500">
                        {formatCurrency(selectedOrder.deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Endereço de Entrega</p>
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      {selectedOrder.deliveryAddress.street},{' '}
                      {selectedOrder.deliveryAddress.number} -{' '}
                      {selectedOrder.deliveryAddress.neighborhood},{' '}
                      {selectedOrder.deliveryAddress.city}
                    </p>
                  </div>
                </div>

                {/* Customer */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Cliente</p>
                  <p className="text-sm">
                    {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedOrder.customer.email}</p>
                </div>

                {/* Driver */}
                {selectedOrder.driver && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Entregador</p>
                    <p className="text-sm">
                      {selectedOrder.driver.firstName} {selectedOrder.driver.lastName}
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={() => setShowDetailsModal(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancelar Pedido</h3>
            <p className="text-gray-500 mb-6">
              Tem certeza que deseja cancelar o pedido{' '}
              <span className="font-medium text-gray-900">
                {selectedOrder.orderNumber}
              </span>
              ? Esta ação não pode ser desfeita.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo do cancelamento
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Informe o motivo..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedOrder(null);
                  setCancelReason('');
                }}
              >
                Voltar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => cancelMutation.mutate({ id: selectedOrder.id, reason: cancelReason })}
                isLoading={cancelMutation.isPending}
                disabled={!cancelReason.trim()}
              >
                Cancelar Pedido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
