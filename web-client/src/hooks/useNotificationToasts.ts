'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/components/ui/Toast';

interface OrderStatusEvent {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

interface OrderCancelledEvent {
  orderId: string;
  orderNumber: string;
  cancelledBy: 'customer' | 'merchant' | 'system';
  reason?: string;
  timestamp: string;
}

interface DriverLocationEvent {
  orderId: string;
  latitude: number;
  longitude: number;
  estimatedArrival?: number;
}

const statusMessages: Record<string, { title: string; message: string }> = {
  CONFIRMED: {
    title: '✅ Pedido Confirmado',
    message: 'O estabelecimento confirmou seu pedido!',
  },
  PREPARING: {
    title: '👨‍🍳 Preparando',
    message: 'Seu pedido está sendo preparado.',
  },
  READY_FOR_PICKUP: {
    title: '📦 Pronto para Retirada',
    message: 'Seu pedido está pronto e aguardando o entregador.',
  },
  OUT_FOR_DELIVERY: {
    title: '🚗 Saiu para Entrega',
    message: 'Seu pedido está a caminho!',
  },
  DELIVERED: {
    title: '🎉 Pedido Entregue',
    message: 'Seu pedido foi entregue. Bom apetite!',
  },
};

/**
 * Hook that listens to socket events and shows toast notifications
 */
export function useNotificationToasts() {
  const { socket, isConnected } = useSocket();
  const { addToast } = useToast();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Order status updated
    const handleStatusUpdate = (data: OrderStatusEvent) => {
      const statusInfo = statusMessages[data.newStatus];
      if (statusInfo) {
        addToast({
          type: 'info',
          title: statusInfo.title,
          message: `Pedido #${data.orderNumber}: ${statusInfo.message}`,
          duration: 6000,
        });
      }
    };

    // Order cancelled
    const handleOrderCancelled = (data: OrderCancelledEvent) => {
      const cancelledByText = {
        customer: 'por você',
        merchant: 'pelo estabelecimento',
        system: 'pelo sistema',
      };

      addToast({
        type: 'warning',
        title: '❌ Pedido Cancelado',
        message: `Pedido #${data.orderNumber} foi cancelado ${cancelledByText[data.cancelledBy]}.${data.reason ? ` Motivo: ${data.reason}` : ''}`,
        duration: 8000,
      });
    };

    // Driver arriving notification
    const handleDriverArriving = (data: DriverLocationEvent) => {
      if (data.estimatedArrival && data.estimatedArrival <= 5) {
        addToast({
          type: 'info',
          title: '📍 Entregador Chegando',
          message: `O entregador está a ${data.estimatedArrival} minutos de distância.`,
          duration: 5000,
        });
      }
    };

    // Listen to events
    socket.on('order:status_updated', handleStatusUpdate);
    socket.on('order:cancelled', handleOrderCancelled);
    socket.on('driver:arriving', handleDriverArriving);

    return () => {
      socket.off('order:status_updated', handleStatusUpdate);
      socket.off('order:cancelled', handleOrderCancelled);
      socket.off('driver:arriving', handleDriverArriving);
    };
  }, [socket, isConnected, addToast]);
}

/**
 * Hook for merchant to listen to new orders
 */
export function useMerchantNotifications() {
  const { socket, isConnected } = useSocket();
  const { addToast } = useToast();

  useEffect(() => {
    if (!socket || !isConnected) return;

    interface NewOrderEvent {
      orderId: string;
      orderNumber: string;
      total: number;
      itemCount: number;
      timestamp: string;
    }

    const handleNewOrder = (data: NewOrderEvent) => {
      addToast({
        type: 'success',
        title: '🔔 Novo Pedido!',
        message: `Pedido #${data.orderNumber} - R$ ${data.total.toFixed(2)} (${data.itemCount} itens)`,
        duration: 10000,
      });

      // Play notification sound if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Novo Pedido!', {
          body: `Pedido #${data.orderNumber} - R$ ${data.total.toFixed(2)}`,
          icon: '/favicon.ico',
        });
      }
    };

    socket.on('order:new', handleNewOrder);

    return () => {
      socket.off('order:new', handleNewOrder);
    };
  }, [socket, isConnected, addToast]);
}

/**
 * Hook for driver to listen to available orders
 */
export function useDriverNotifications() {
  const { socket, isConnected } = useSocket();
  const { addToast } = useToast();

  useEffect(() => {
    if (!socket || !isConnected) return;

    interface OrderAvailableEvent {
      orderId: string;
      orderNumber: string;
      merchantName: string;
      pickupAddress: string;
      deliveryAddress: string;
      distance?: number;
    }

    const handleOrderAvailable = (data: OrderAvailableEvent) => {
      addToast({
        type: 'info',
        title: '🚗 Entrega Disponível',
        message: `${data.merchantName} - ${data.distance ? `${data.distance.toFixed(1)}km` : 'Próximo'}`,
        duration: 15000,
      });
    };

    socket.on('order:available', handleOrderAvailable);

    return () => {
      socket.off('order:available', handleOrderAvailable);
    };
  }, [socket, isConnected, addToast]);
}
