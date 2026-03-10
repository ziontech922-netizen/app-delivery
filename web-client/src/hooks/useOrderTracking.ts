'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getSocket,
  joinOrderRoom,
  leaveOrderRoom,
  OrderStatusChangedEvent,
  OrderCancelledEvent,
  DriverLocationEvent,
} from '@/services/socket';
import type { Order, OrderStatus } from '@/types';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export function useOrderTracking(orderId: string | null) {
  const queryClient = useQueryClient();
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Handler para mudança de status
  const handleStatusChanged = useCallback(
    (event: OrderStatusChangedEvent) => {
      console.log('[OrderTracking] Status changed:', event);
      setLastUpdate(new Date());

      // Atualizar cache do React Query
      queryClient.setQueryData<Order>(['order', event.orderId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          status: event.status as OrderStatus,
        };
      });

      // Invalidar para garantir dados frescos
      queryClient.invalidateQueries({ queryKey: ['order', event.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    [queryClient]
  );

  // Handler para cancelamento
  const handleOrderCancelled = useCallback(
    (event: OrderCancelledEvent) => {
      console.log('[OrderTracking] Order cancelled:', event);
      setLastUpdate(new Date());

      queryClient.setQueryData<Order>(['order', event.orderId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          status: 'CANCELLED' as OrderStatus,
          cancellationReason: event.reason,
          cancelledAt: event.timestamp,
        };
      });

      queryClient.invalidateQueries({ queryKey: ['order', event.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    [queryClient]
  );

  // Handler para localização do driver
  const handleDriverLocation = useCallback((event: DriverLocationEvent) => {
    console.log('[OrderTracking] Driver location:', event);
    setDriverLocation({
      latitude: event.latitude,
      longitude: event.longitude,
      heading: event.heading,
      speed: event.speed,
      timestamp: event.timestamp,
    });
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const socket = getSocket();

    // Entrar na room do pedido
    joinOrderRoom(orderId);

    // Registrar listeners
    socket.on('order:status_changed', handleStatusChanged);
    socket.on('order:cancelled', handleOrderCancelled);
    socket.on('driver:location', handleDriverLocation);

    // Cleanup
    return () => {
      socket.off('order:status_changed', handleStatusChanged);
      socket.off('order:cancelled', handleOrderCancelled);
      socket.off('driver:location', handleDriverLocation);
      leaveOrderRoom(orderId);
    };
  }, [orderId, handleStatusChanged, handleOrderCancelled, handleDriverLocation]);

  return {
    driverLocation,
    lastUpdate,
    clearDriverLocation: () => setDriverLocation(null),
  };
}

export default useOrderTracking;
