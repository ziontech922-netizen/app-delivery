import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { orderService, Order } from '../../services/orderService';
import { socketService } from '../../services/socketService';
import { etaService, OrderEtaResult } from '../../services/etaService';
import { RootStackParamList } from '../../navigation/types';

type OrderTrackingRouteProp = RouteProp<RootStackParamList, 'OrderTracking'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OrderStatus {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const orderStatuses: OrderStatus[] = [
  {
    key: 'PENDING',
    label: 'Pedido recebido',
    description: 'Aguardando confirmação do restaurante',
    icon: 'receipt-outline',
    color: '#f59e0b',
  },
  {
    key: 'ACCEPTED',
    label: 'Pedido confirmado',
    description: 'O restaurante aceitou seu pedido',
    icon: 'checkmark-circle-outline',
    color: '#3b82f6',
  },
  {
    key: 'PREPARING',
    label: 'Em preparo',
    description: 'Seu pedido está sendo preparado',
    icon: 'restaurant-outline',
    color: '#8b5cf6',
  },
  {
    key: 'READY',
    label: 'Pronto',
    description: 'Pedido pronto, aguardando entregador',
    icon: 'bag-check-outline',
    color: '#06b6d4',
  },
  {
    key: 'PICKED_UP',
    label: 'Saiu para entrega',
    description: 'Entregador a caminho',
    icon: 'bicycle-outline',
    color: '#14b8a6',
  },
  {
    key: 'DELIVERED',
    label: 'Entregue',
    description: 'Pedido entregue com sucesso',
    icon: 'checkmark-done-outline',
    color: '#10b981',
  },
];

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export default function OrderTrackingScreen() {
  const route = useRoute<OrderTrackingRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { orderId } = route.params;

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch live ETA
  const { data: etaData } = useQuery({
    queryKey: ['orderEta', orderId],
    queryFn: () => etaService.getOrderEta(orderId),
    refetchInterval: 15000, // Refetch every 15 seconds
    enabled: !!order && !['DELIVERED', 'CANCELLED'].includes(order.status),
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!orderId) return;

    // Join order room for real-time updates
    socketService.emit('joinOrderRoom', { orderId });

    // Listen for order status updates
    const handleStatusUpdate = (data: { orderId: string; status: string }) => {
      if (data.orderId === orderId) {
        queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
    };

    // Listen for driver location updates
    const handleDriverLocation = (data: { orderId: string; location: { lat: number; lng: number } }) => {
      if (data.orderId === orderId) {
        setDriverLocation(data.location);
      }
    };

    socketService.on('orderStatusUpdated', handleStatusUpdate);
    socketService.on('driverLocationUpdated', handleDriverLocation);

    return () => {
      socketService.off('orderStatusUpdated', handleStatusUpdate);
      socketService.off('driverLocationUpdated', handleDriverLocation);
      socketService.emit('leaveOrderRoom', { orderId });
    };
  }, [orderId, queryClient]);

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancel(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Sucesso', 'Pedido cancelado com sucesso');
    },
    onError: () => {
      Alert.alert('Erro', 'Não foi possível cancelar o pedido');
    },
  });

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancelar pedido',
      'Tem certeza que deseja cancelar este pedido?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(),
        },
      ]
    );
  };

  const handleCallDriver = () => {
    if (order?.driver?.phone) {
      Linking.openURL(`tel:${order.driver.phone}`);
    }
  };

  const handleCallRestaurant = () => {
    if (order?.restaurant?.phone) {
      Linking.openURL(`tel:${order.restaurant.phone}`);
    }
  };

  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    if (order.status === 'CANCELLED') return -1;
    return orderStatuses.findIndex((s) => s.key === order.status);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Carregando pedido...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Pedido não encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatusIndex = getCurrentStatusIndex();
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';
  const canCancel = ['PENDING', 'ACCEPTED'].includes(order.status);
  const hasDriver = order.status === 'PICKED_UP' && order.driver;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acompanhar Pedido</Text>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
      </View>

      {/* Status Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status do Pedido</Text>

        {isCancelled ? (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={24} color="#ef4444" />
            <Text style={styles.cancelledText}>Pedido cancelado</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {orderStatuses.map((status, index) => {
              const isPast = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const isFuture = index > currentStatusIndex;

              return (
                <View key={status.key} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineIcon,
                        isPast && styles.timelineIconPast,
                        isCurrent && styles.timelineIconCurrent,
                        isFuture && styles.timelineIconFuture,
                      ]}
                    >
                      <Ionicons
                        name={isPast ? 'checkmark' : status.icon}
                        size={16}
                        color={isFuture ? '#9ca3af' : '#fff'}
                      />
                    </View>
                    {index < orderStatuses.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isPast && styles.timelineLinePast,
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        isCurrent && styles.timelineLabelCurrent,
                        isFuture && styles.timelineLabelFuture,
                      ]}
                    >
                      {status.label}
                    </Text>
                    {(isCurrent || isPast) && (
                      <Text style={styles.timelineDescription}>{status.description}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ETA Display */}
        {etaData && !isDelivered && !isCancelled && (
          <View style={styles.etaContainer}>
            <View style={styles.etaMain}>
              <Ionicons name="time-outline" size={24} color="#16a34a" />
              <View style={styles.etaTextContainer}>
                <Text style={styles.etaLabel}>Tempo estimado</Text>
                <Text style={styles.etaValue}>
                  {etaData.displayRemaining || 'Calculando...'}
                </Text>
              </View>
            </View>
            {etaData.breakdown && (
              <View style={styles.etaBreakdown}>
                {etaData.breakdown.preparationRemaining > 0 && (
                  <View style={styles.etaBreakdownItem}>
                    <Ionicons name="restaurant-outline" size={16} color="#6b7280" />
                    <Text style={styles.etaBreakdownText}>
                      Preparo: {etaData.breakdown.preparationRemaining} min
                    </Text>
                  </View>
                )}
                {etaData.breakdown.deliveryRemaining > 0 && (
                  <View style={styles.etaBreakdownItem}>
                    <Ionicons name="bicycle-outline" size={16} color="#6b7280" />
                    <Text style={styles.etaBreakdownText}>
                      Entrega: {etaData.breakdown.deliveryRemaining} min
                    </Text>
                  </View>
                )}
              </View>
            )}
            {etaData.driverLocation && (
              <View style={styles.driverDistance}>
                <Ionicons name="navigate-outline" size={16} color="#3b82f6" />
                <Text style={styles.driverDistanceText}>
                  Entregador a {etaData.driverLocation.distanceToDestinationKm.toFixed(1)} km
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Legacy ETA fallback */}
        {!etaData && order.estimatedDeliveryTime && !isDelivered && !isCancelled && (
          <View style={styles.estimatedTime}>
            <Ionicons name="time-outline" size={20} color="#16a34a" />
            <Text style={styles.estimatedTimeText}>
              Previsão de entrega: {order.estimatedDeliveryTime} min
            </Text>
          </View>
        )}
      </View>

      {/* Driver Info */}
      {hasDriver && order.driver && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entregador</Text>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={24} color="#6b7280" />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>
                {order.driver.firstName} {order.driver.lastName}
              </Text>
              <Text style={styles.driverVehicle}>Moto</Text>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
              <Ionicons name="call" size={20} color="#16a34a" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Restaurant Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Restaurante</Text>
        <View style={styles.restaurantInfo}>
          {order.restaurant?.logoUrl ? (
            <Image source={{ uri: order.restaurant.logoUrl }} style={styles.restaurantImage} />
          ) : (
            <View style={[styles.restaurantImage, styles.placeholderImage]}>
              <Ionicons name="restaurant" size={20} color="#9ca3af" />
            </View>
          )}
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>{order.restaurant?.tradeName}</Text>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={handleCallRestaurant}>
            <Ionicons name="call" size={20} color="#16a34a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Endereço de Entrega</Text>
        <View style={styles.addressInfo}>
          <Ionicons name="location" size={20} color="#16a34a" />
          <View style={styles.addressDetails}>
            <Text style={styles.addressStreet}>
              {order.deliveryAddress.street}, {order.deliveryAddress.number}
            </Text>
            <Text style={styles.addressNeighborhood}>
              {order.deliveryAddress.neighborhood}, {order.deliveryAddress.city}
            </Text>
            {order.deliveryAddress.complement && (
              <Text style={styles.addressComplement}>{order.deliveryAddress.complement}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Itens do Pedido</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemQuantity}>{item.quantity}x</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.productName}</Text>
              {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
            </View>
            <Text style={styles.itemPrice}>{formatCurrency(item.totalPrice)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Taxa de entrega</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.deliveryFee)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabelBold}>Total</Text>
          <Text style={styles.totalValueBold}>{formatCurrency(order.totalAmount)}</Text>
        </View>
      </View>

      {/* Actions */}
      {canCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelOrder}
          disabled={cancelMutation.isPending}
        >
          {cancelMutation.isPending ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
              <Text style={styles.cancelButtonText}>Cancelar pedido</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {isDelivered && (
        <TouchableOpacity
          style={styles.rateButton}
          onPress={() => navigation.navigate('RateOrder', { orderId })}
        >
          <Ionicons name="star-outline" size={20} color="#fff" />
          <Text style={styles.rateButtonText}>Avaliar pedido</Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#1f2937',
    marginTop: 16,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#16a34a',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#16a34a',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backIconButton: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  orderNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelledText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9ca3af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconPast: {
    backgroundColor: '#10b981',
  },
  timelineIconCurrent: {
    backgroundColor: '#16a34a',
  },
  timelineIconFuture: {
    backgroundColor: '#e5e7eb',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  timelineLinePast: {
    backgroundColor: '#10b981',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  timelineLabelCurrent: {
    fontWeight: '600',
    color: '#16a34a',
  },
  timelineLabelFuture: {
    color: '#9ca3af',
  },
  timelineDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  estimatedTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
  },
  etaContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  etaMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  etaTextContainer: {
    flex: 1,
  },
  etaLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  etaValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16a34a',
  },
  etaBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
    gap: 8,
  },
  etaBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etaBreakdownText: {
    fontSize: 13,
    color: '#6b7280',
  },
  driverDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
  },
  driverDistanceText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  driverVehicle: {
    fontSize: 14,
    color: '#6b7280',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantDetails: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addressInfo: {
    flexDirection: 'row',
  },
  addressDetails: {
    flex: 1,
    marginLeft: 12,
  },
  addressStreet: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  addressNeighborhood: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addressComplement: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    width: 30,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#1f2937',
  },
  itemNotes: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  totalLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    gap: 8,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpace: {
    height: 32,
  },
});
