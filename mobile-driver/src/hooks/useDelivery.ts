import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '../services/deliveryService';
import { useDeliveryStore } from '../stores/deliveryStore';

export function useAvailableOrders() {
  const { currentLocation } = useDeliveryStore();

  return useQuery({
    queryKey: ['availableOrders', currentLocation?.latitude, currentLocation?.longitude],
    queryFn: () =>
      deliveryService.getAvailableOrders(
        currentLocation
          ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              radius: 10,
            }
          : undefined
      ),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useCurrentDelivery() {
  return useQuery({
    queryKey: ['currentDelivery'],
    queryFn: () => deliveryService.getCurrentDelivery(),
  });
}

export function useAcceptOrder() {
  const queryClient = useQueryClient();
  const { setCurrentDelivery } = useDeliveryStore();

  return useMutation({
    mutationFn: (orderId: string) => deliveryService.acceptOrder(orderId),
    onSuccess: (delivery) => {
      setCurrentDelivery(delivery);
      queryClient.invalidateQueries({ queryKey: ['availableOrders'] });
      queryClient.invalidateQueries({ queryKey: ['currentDelivery'] });
    },
  });
}

export function useConfirmPickup() {
  const queryClient = useQueryClient();
  const { updateDeliveryStatus } = useDeliveryStore();

  return useMutation({
    mutationFn: (orderId: string) => deliveryService.confirmPickup(orderId),
    onSuccess: () => {
      updateDeliveryStatus('PICKED_UP');
      queryClient.invalidateQueries({ queryKey: ['currentDelivery'] });
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();
  const { clearDelivery } = useDeliveryStore();

  return useMutation({
    mutationFn: ({ orderId, photo }: { orderId: string; photo?: string }) =>
      deliveryService.confirmDelivery(orderId, { photo }),
    onSuccess: () => {
      clearDelivery();
      queryClient.invalidateQueries({ queryKey: ['currentDelivery'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });
}

export function useEarnings() {
  return useQuery({
    queryKey: ['earnings'],
    queryFn: () => deliveryService.getEarningsSummary(),
  });
}

export function useDeliveryHistory(params?: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['deliveryHistory', params],
    queryFn: () => deliveryService.getDeliveryHistory(params),
  });
}
