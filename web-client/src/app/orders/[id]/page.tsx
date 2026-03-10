'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Clock, 
  Package,
  CheckCircle,
  XCircle,
  Truck,
  ChefHat,
  Store,
  Wifi,
  WifiOff,
  Navigation,
  Star
} from 'lucide-react';
import { orderService } from '@/services/order.service';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button, Card } from '@/components/ui';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useSocket } from '@/hooks/useSocket';
import { useCanReviewOrder } from '@/hooks/useReviews';
import { ReviewModal } from '@/components/reviews';
import type { OrderStatus } from '@/types';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusSteps: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'PENDING', label: 'Aguardando confirmação', icon: <Clock className="h-5 w-5" /> },
  { status: 'CONFIRMED', label: 'Confirmado', icon: <CheckCircle className="h-5 w-5" /> },
  { status: 'PREPARING', label: 'Preparando', icon: <ChefHat className="h-5 w-5" /> },
  { status: 'READY_FOR_PICKUP', label: 'Pronto para retirada', icon: <Package className="h-5 w-5" /> },
  { status: 'OUT_FOR_DELIVERY', label: 'Saiu para entrega', icon: <Truck className="h-5 w-5" /> },
  { status: 'DELIVERED', label: 'Entregue', icon: <CheckCircle className="h-5 w-5" /> },
];

const statusOrder: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY_FOR_PICKUP: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: -1,
};

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Realtime tracking
  const { isConnected } = useSocket();
  const { driverLocation, lastUpdate } = useOrderTracking(id);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id),
    refetchInterval: isConnected ? false : 10000, // Poll only if not connected to socket
  });

  // Check if can review
  const { data: canReview } = useCanReviewOrder(id);

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => orderService.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar este pedido?')) {
      cancelMutation.mutate('Cancelado pelo cliente');
    }
  };

  if (isLoading) return <PageSpinner />;

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Pedido não encontrado
        </h1>
        <Link href="/orders" className="text-primary-600 hover:underline">
          Ver meus pedidos
        </Link>
      </div>
    );
  }

  const currentStatusIndex = statusOrder[order.status];
  const isCancelled = order.status === 'CANCELLED';
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Pedido #{order.orderNumber || order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
        </div>
        {/* Realtime Status Indicator */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-500'
        }`}>
          {isConnected ? (
            <>
              <Wifi className="h-3.5 w-3.5" />
              <span>Tempo real</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <Card variant="bordered">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-900">Status do Pedido</h2>
              {lastUpdate && (
                <span className="text-xs text-gray-400">
                  Atualizado {lastUpdate.toLocaleTimeString('pt-BR')}
                </span>
              )}
            </div>

            {isCancelled ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Pedido Cancelado</p>
                  {order.cancellationReason && (
                    <p className="text-sm text-red-600">{order.cancellationReason}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200" />
                <div
                  className="absolute left-6 top-8 w-0.5 bg-primary-600 transition-all"
                  style={{
                    height: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%`,
                  }}
                />

                {/* Steps */}
                <div className="space-y-6">
                  {statusSteps.map((step, index) => {
                    const isCompleted = currentStatusIndex >= index;
                    const isCurrent = currentStatusIndex === index;

                    return (
                      <div key={step.status} className="flex items-center gap-4">
                        <div
                          className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
                        >
                          {step.icon}
                        </div>
                        <div>
                          <p
                            className={`font-medium ${
                              isCompleted ? 'text-gray-900' : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-primary-600">Em andamento...</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Merchant */}
          {order.merchant && (
            <Card variant="bordered">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {order.merchant.logoUrl ? (
                    <img
                      src={order.merchant.logoUrl}
                      alt={order.merchant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{order.merchant.name}</h3>
                  <p className="text-sm text-gray-500">{order.merchant.category}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Items */}
          <Card variant="bordered">
            <h2 className="font-semibold text-gray-900 mb-4">Itens do Pedido</h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.quantity}x {item.productName}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-gray-500">{item.notes}</p>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(item.totalPrice)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Driver Location - shows when order is out for delivery */}
          {order.status === 'OUT_FOR_DELIVERY' && driverLocation && (
            <Card variant="bordered">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary-600" />
                Localização do Entregador
              </h2>
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">
                    Entregador em trânsito
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Última atualização: {new Date(driverLocation.timestamp).toLocaleTimeString('pt-BR')}
                </p>
                {/* Placeholder for map - in production use Google Maps or Mapbox */}
                <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Truck className="h-10 w-10 text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-primary-700 font-medium">
                      Lat: {driverLocation.latitude.toFixed(4)}
                    </p>
                    <p className="text-sm text-primary-700 font-medium">
                      Lng: {driverLocation.longitude.toFixed(4)}
                    </p>
                    {driverLocation.speed && (
                      <p className="text-xs text-primary-600 mt-1">
                        {(driverLocation.speed * 3.6).toFixed(0)} km/h
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Mapa interativo disponível em breve
                </p>
              </div>
            </Card>
          )}

          {/* Delivery Address */}
          {order.address && (
            <Card variant="bordered">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                Endereço de Entrega
              </h2>
              <p className="text-gray-900">
                {order.address.street}, {order.address.number}
                {order.address.complement && ` - ${order.address.complement}`}
              </p>
              <p className="text-gray-500">
                {order.address.neighborhood} - {order.address.city}/{order.address.state}
              </p>
              <p className="text-gray-500">CEP: {order.address.zipCode}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card variant="bordered" className="sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Resumo</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Taxa de entrega</span>
                <span>
                  {order.deliveryFee === 0 ? 'Grátis' : formatCurrency(order.deliveryFee)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">Pagamento</p>
              <p className="font-medium">
                {order.paymentMethod === 'PIX' && 'PIX'}
                {order.paymentMethod === 'CREDIT_CARD' && 'Cartão de Crédito'}
                {order.paymentMethod === 'DEBIT_CARD' && 'Cartão de Débito'}
                {order.paymentMethod === 'CASH' && 'Dinheiro'}
              </p>
            </div>

            {canCancel && (
              <Button
                onClick={handleCancel}
                variant="danger"
                className="w-full mt-6"
                isLoading={cancelMutation.isPending}
              >
                Cancelar Pedido
              </Button>
            )}

            {/* Review Button - shows when order is delivered and not reviewed */}
            {order.status === 'DELIVERED' && canReview && (
              <Button
                onClick={() => setShowReviewModal(true)}
                variant="primary"
                className="w-full mt-6"
              >
                <Star className="h-4 w-4 mr-2" />
                Avaliar Pedido
              </Button>
            )}

            <Link href="/" className="block mt-4">
              <Button variant="outline" className="w-full">
                Fazer novo pedido
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Review Modal */}
      {order && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          orderId={order.id}
          merchantName={order.merchant?.name || 'Estabelecimento'}
          driverName={null}
          hasDriver={!!order.driverId}
        />
      )}
    </div>
  );
}
