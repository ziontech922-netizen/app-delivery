'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  MapPin,
  Clock,
  DollarSign,
  Navigation,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Bike,
} from 'lucide-react';
import { driverService, DeliveryOrder } from '@/services/driver.service';

export default function DriverOrdersPage() {
  const queryClient = useQueryClient();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Fetch available orders
  const {
    data: orders,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['driver', 'availableOrders'],
    queryFn: () => driverService.getAvailableOrders(),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch current delivery to check if driver is busy
  const { data: currentDelivery } = useQuery({
    queryKey: ['driver', 'currentDelivery'],
    queryFn: driverService.getCurrentDelivery,
  });

  // Fetch driver profile
  const { data: profile } = useQuery({
    queryKey: ['driver', 'profile'],
    queryFn: driverService.getProfile,
  });

  // Accept order mutation
  const acceptMutation = useMutation({
    mutationFn: driverService.acceptOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'availableOrders'] });
      queryClient.invalidateQueries({ queryKey: ['driver', 'currentDelivery'] });
      setAcceptingId(null);
    },
    onError: () => {
      setAcceptingId(null);
    },
  });

  const handleAccept = (orderId: string) => {
    setAcceptingId(orderId);
    acceptMutation.mutate(orderId);
  };

  const isOnline = profile?.status === 'AVAILABLE';
  const isBusy = !!currentDelivery;

  // Calculate estimated distance (mock for now)
  const getDistance = (order: DeliveryOrder) => {
    return order.distance || Math.random() * 5 + 1;
  };

  // Calculate estimated time (mock for now)
  const getEstimatedTime = (distance: number) => {
    return Math.round(distance * 3 + 5);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos Disponíveis</h1>
          <p className="text-gray-500 mt-1">
            {orders?.length || 0} pedido{orders?.length !== 1 ? 's' : ''} na sua região
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Status Alerts */}
      {!isOnline && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">Você está offline</p>
            <p className="text-sm text-yellow-700">
              Fique online para ver e aceitar pedidos disponíveis.
            </p>
          </div>
        </div>
      )}

      {isBusy && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Bike className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-800">Você tem uma entrega em andamento</p>
            <p className="text-sm text-blue-700">
              Conclua a entrega atual antes de aceitar outra.
            </p>
          </div>
        </div>
      )}

      {/* Orders List */}
      {isOnline && !isBusy && orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const distance = getDistance(order);
            const estimatedTime = getEstimatedTime(distance);
            const isAccepting = acceptingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border shadow-sm overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.restaurant.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Pedido #{order.id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        R$ {order.deliveryFee?.toFixed(2) || '0,00'}
                      </p>
                      <p className="text-xs text-gray-500">Ganho</p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-4 space-y-3">
                  {/* Restaurant Address */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Retirar em</p>
                      <p className="text-sm text-gray-500">
                        {order.restaurant.address.street}, {order.restaurant.address.number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.restaurant.address.neighborhood}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Entregar em</p>
                      <p className="text-sm text-gray-500">
                        {order.deliveryAddress.street}, {order.deliveryAddress.number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.deliveryAddress.neighborhood}
                      </p>
                    </div>
                  </div>

                  {/* Order Stats */}
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Navigation className="h-4 w-4" />
                      <span>{distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>~{estimatedTime} min</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Package className="h-4 w-4" />
                      <span>{order.items?.length || 0} itens</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="p-4 bg-gray-50 border-t">
                  <button
                    onClick={() => handleAccept(order.id)}
                    disabled={isAccepting || acceptMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Aceitando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Aceitar Pedido
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        isOnline && !isBusy && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum pedido disponível
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Não há pedidos na sua região no momento. Aguarde ou tente atualizar a lista.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg mx-auto hover:bg-green-700"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar lista
            </button>
          </div>
        )
      )}
    </div>
  );
}
