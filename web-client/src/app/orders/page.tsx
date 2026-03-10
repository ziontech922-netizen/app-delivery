'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Package, Clock, CheckCircle, XCircle, Truck, ChefHat } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { PageSpinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui';
import type { Order, OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { 
    label: 'Aguardando', 
    color: 'bg-yellow-100 text-yellow-700',
    icon: <Clock className="h-4 w-4" />
  },
  CONFIRMED: { 
    label: 'Confirmado', 
    color: 'bg-blue-100 text-blue-700',
    icon: <CheckCircle className="h-4 w-4" />
  },
  PREPARING: { 
    label: 'Preparando', 
    color: 'bg-orange-100 text-orange-700',
    icon: <ChefHat className="h-4 w-4" />
  },
  READY_FOR_PICKUP: { 
    label: 'Pronto', 
    color: 'bg-purple-100 text-purple-700',
    icon: <Package className="h-4 w-4" />
  },
  OUT_FOR_DELIVERY: { 
    label: 'A caminho', 
    color: 'bg-indigo-100 text-indigo-700',
    icon: <Truck className="h-4 w-4" />
  },
  DELIVERED: { 
    label: 'Entregue', 
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="h-4 w-4" />
  },
  CANCELLED: { 
    label: 'Cancelado', 
    color: 'bg-red-100 text-red-700',
    icon: <XCircle className="h-4 w-4" />
  },
};

function OrderCard({ order }: { order: Order }) {
  const status = statusConfig[order.status] || statusConfig.PENDING;

  return (
    <Link href={`/orders/${order.id}`}>
      <Card variant="bordered" className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-medium text-gray-900">
              {order.merchant?.name || 'Restaurante'}
            </p>
            <p className="text-sm text-gray-500">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
            </span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function OrdersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.list(),
  });

  const orders = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Pedidos</h1>

      {isLoading ? (
        <PageSpinner />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Erro ao carregar pedidos</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary-600 underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : orders.length === 0 ? (
        <Card variant="bordered" className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum pedido ainda
          </h3>
          <p className="text-gray-500 mb-6">
            Explore os restaurantes e faça seu primeiro pedido
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Ver restaurantes
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
