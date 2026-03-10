'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  ChefHat,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Phone,
  FileText,
  X,
  Check,
  Bell,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { merchantDashboardService, MerchantOrder } from '@/services/merchant.dashboard.service';
import { formatCurrency } from '@/utils/format';

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  PENDING: { label: 'Novo Pedido', icon: Bell, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  ACCEPTED: { label: 'Aceito', icon: Check, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  PREPARING: { label: 'Preparando', icon: ChefHat, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  READY: { label: 'Pronto', icon: Package, color: 'text-green-600', bgColor: 'bg-green-100' },
  PICKED_UP: { label: 'Em Entrega', icon: Truck, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  DELIVERED: { label: 'Entregue', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  CANCELLED: { label: 'Cancelado', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

const tabs = [
  { key: 'active', label: 'Ativos' },
  { key: 'PENDING', label: 'Novos' },
  { key: 'PREPARING', label: 'Preparando' },
  { key: 'READY', label: 'Prontos' },
  { key: 'completed', label: 'Finalizados' },
];

export default function MerchantOrdersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState<MerchantOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(30);

  // Determine status filter based on tab
  const getStatusFilter = () => {
    if (activeTab === 'active') return 'PENDING,ACCEPTED,PREPARING,READY';
    if (activeTab === 'completed') return 'DELIVERED,CANCELLED';
    return activeTab;
  };

  // Fetch orders
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['merchant', 'orders', activeTab],
    queryFn: () => merchantDashboardService.getOrders({ status: getStatusFilter() }),
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    placeholderData: {
      data: [
        {
          id: '1',
          orderNumber: 'ORD-2024-001',
          status: 'PENDING' as const,
          totalAmount: 89.9,
          deliveryFee: 8.0,
          subtotal: 81.9,
          createdAt: new Date().toISOString(),
          acceptedAt: null,
          preparedAt: null,
          deliveredAt: null,
          estimatedDeliveryTime: null,
          notes: 'Sem cebola na pizza',
          customer: {
            id: 'c1',
            firstName: 'João',
            lastName: 'Silva',
            phone: '11999999999',
          },
          deliveryAddress: {
            street: 'Rua das Flores',
            number: '123',
            complement: 'Apto 45',
            neighborhood: 'Centro',
            city: 'São Paulo',
            reference: 'Próximo ao mercado',
          },
          items: [
            {
              id: 'i1',
              productId: 'p1',
              productName: 'Pizza Margherita Grande',
              quantity: 1,
              unitPrice: 45.9,
              totalPrice: 45.9,
              notes: null,
            },
            {
              id: 'i2',
              productId: 'p2',
              productName: 'Pizza Calabresa Média',
              quantity: 1,
              unitPrice: 36.0,
              totalPrice: 36.0,
              notes: 'Sem cebola',
            },
          ],
          driver: null,
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-002',
          status: 'PREPARING' as const,
          totalAmount: 125.0,
          deliveryFee: 10.0,
          subtotal: 115.0,
          createdAt: new Date(Date.now() - 900000).toISOString(),
          acceptedAt: new Date(Date.now() - 600000).toISOString(),
          preparedAt: null,
          deliveredAt: null,
          estimatedDeliveryTime: 35,
          notes: null,
          customer: {
            id: 'c2',
            firstName: 'Maria',
            lastName: 'Santos',
            phone: '11988888888',
          },
          deliveryAddress: {
            street: 'Av. Paulista',
            number: '1000',
            complement: null,
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            reference: null,
          },
          items: [
            {
              id: 'i3',
              productId: 'p3',
              productName: 'Combo Família',
              quantity: 1,
              unitPrice: 115.0,
              totalPrice: 115.0,
              notes: null,
            },
          ],
          driver: {
            id: 'd1',
            firstName: 'Pedro',
            lastName: 'Entregador',
            phone: '11977777777',
          },
        },
        {
          id: '3',
          orderNumber: 'ORD-2024-003',
          status: 'READY' as const,
          totalAmount: 67.5,
          deliveryFee: 7.0,
          subtotal: 60.5,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          acceptedAt: new Date(Date.now() - 1500000).toISOString(),
          preparedAt: new Date(Date.now() - 300000).toISOString(),
          deliveredAt: null,
          estimatedDeliveryTime: 30,
          notes: null,
          customer: {
            id: 'c3',
            firstName: 'Carlos',
            lastName: 'Lima',
            phone: '11966666666',
          },
          deliveryAddress: {
            street: 'Rua Augusta',
            number: '500',
            complement: 'Casa 2',
            neighborhood: 'Consolação',
            city: 'São Paulo',
            reference: 'Portão verde',
          },
          items: [
            {
              id: 'i4',
              productId: 'p4',
              productName: 'Pizza Portuguesa',
              quantity: 1,
              unitPrice: 42.0,
              totalPrice: 42.0,
              notes: null,
            },
            {
              id: 'i5',
              productId: 'p5',
              productName: 'Refrigerante 2L',
              quantity: 1,
              unitPrice: 12.0,
              totalPrice: 12.0,
              notes: null,
            },
          ],
          driver: {
            id: 'd2',
            firstName: 'Ana',
            lastName: 'Motoca',
            phone: '11955555555',
          },
        },
      ],
      total: 3,
      page: 1,
      totalPages: 1,
    },
  });

  // Mutations
  const acceptMutation = useMutation({
    mutationFn: ({ orderId, estimatedTime }: { orderId: string; estimatedTime: number }) =>
      merchantDashboardService.acceptOrder(orderId, estimatedTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'orders'] });
      setShowDetailsModal(false);
      setSelectedOrder(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      merchantDashboardService.rejectOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'orders'] });
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setSelectedOrder(null);
      setRejectReason('');
    },
  });

  const preparingMutation = useMutation({
    mutationFn: (orderId: string) => merchantDashboardService.markPreparing(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'orders'] });
    },
  });

  const readyMutation = useMutation({
    mutationFn: (orderId: string) => merchantDashboardService.markReady(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'orders'] });
    },
  });

  const orders = data?.data || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}min`;
  };

  const openOrderDetails = (order: MerchantOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 mt-1">Gerencie os pedidos do seu estabelecimento</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.key === 'PENDING' && orders.filter((o) => o.status === 'PENDING').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {orders.filter((o) => o.status === 'PENDING').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">Nenhum pedido encontrado</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;

            return (
              <Card
                key={order.id}
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  order.status === 'PENDING' ? 'ring-2 ring-yellow-400 animate-pulse' : ''
                }`}
                onClick={() => openOrderDetails(order)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {formatTime(order.createdAt)} • {getTimeAgo(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>

                {/* Customer */}
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {order.customer.firstName} {order.customer.lastName}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-3">
                  {order.items.slice(0, 2).map((item) => (
                    <p key={item.id} className="text-sm text-gray-600">
                      {item.quantity}x {item.productName}
                    </p>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-sm text-gray-400">+{order.items.length - 2} itens</p>
                  )}
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="flex items-start gap-2 mb-3 p-2 bg-yellow-50 rounded-lg">
                    <FileText className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-700">{order.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="font-bold text-lg text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </p>

                  {/* Quick actions */}
                  {order.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setShowRejectModal(true);
                        }}
                      >
                        Recusar
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          acceptMutation.mutate({ orderId: order.id, estimatedTime: 30 });
                        }}
                        isLoading={acceptMutation.isPending}
                      >
                        Aceitar
                      </Button>
                    </div>
                  )}

                  {order.status === 'ACCEPTED' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        preparingMutation.mutate(order.id);
                      }}
                      isLoading={preparingMutation.isPending}
                    >
                      Iniciar Preparo
                    </Button>
                  )}

                  {order.status === 'PREPARING' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        readyMutation.mutate(order.id);
                      }}
                      isLoading={readyMutation.isPending}
                    >
                      Marcar Pronto
                    </Button>
                  )}

                  {order.status === 'READY' && order.driver && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      Aguardando retirada
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedOrder.orderNumber}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusConfig[selectedOrder.status].bgColor
                    } ${statusConfig[selectedOrder.status].color}`}
                  >
                    {statusConfig[selectedOrder.status].label}
                  </span>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>
                      {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{selectedOrder.customer.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p>
                        {selectedOrder.deliveryAddress.street},{' '}
                        {selectedOrder.deliveryAddress.number}
                        {selectedOrder.deliveryAddress.complement &&
                          ` - ${selectedOrder.deliveryAddress.complement}`}
                      </p>
                      <p>
                        {selectedOrder.deliveryAddress.neighborhood},{' '}
                        {selectedOrder.deliveryAddress.city}
                      </p>
                      {selectedOrder.deliveryAddress.reference && (
                        <p className="text-gray-500">
                          Ref: {selectedOrder.deliveryAddress.reference}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Itens do Pedido</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.productName}
                        {item.notes && (
                          <p className="text-gray-500 text-xs">Obs: {item.notes}</p>
                        )}
                      </div>
                      <span className="text-gray-500">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de entrega</span>
                  <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Observações</p>
                      <p className="text-sm text-yellow-700">{selectedOrder.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Driver Info */}
              {selectedOrder.driver && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Entregador</h4>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Truck className="h-4 w-4" />
                    <span>
                      {selectedOrder.driver.firstName} {selectedOrder.driver.lastName}
                    </span>
                    <span>•</span>
                    <span>{selectedOrder.driver.phone}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedOrder.status === 'PENDING' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempo estimado de preparo (minutos)
                    </label>
                    <input
                      type="number"
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="5"
                      max="120"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowRejectModal(true);
                      }}
                    >
                      Recusar
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() =>
                        acceptMutation.mutate({ orderId: selectedOrder.id, estimatedTime })
                      }
                      isLoading={acceptMutation.isPending}
                    >
                      Aceitar Pedido
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recusar Pedido</h3>
            <p className="text-gray-500 mb-4">
              Tem certeza que deseja recusar o pedido {selectedOrder.orderNumber}?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da recusa
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Ingredientes indisponíveis, restaurante fechando..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() =>
                  rejectMutation.mutate({ orderId: selectedOrder.id, reason: rejectReason })
                }
                isLoading={rejectMutation.isPending}
                disabled={!rejectReason.trim()}
              >
                Recusar Pedido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
