import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { deliveryService } from '../services/deliveryService';
import { socketService } from '../services/socketService';
import { locationService } from '../services/locationService';
import { useDeliveryStore } from '../stores/deliveryStore';
import { DeliveryOrder } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AvailableOrdersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { setCurrentDelivery, currentLocation } = useDeliveryStore();

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();

    // Subscribe to new orders
    const unsubscribe = socketService.onNewOrder((order) => {
      setOrders((prev) => {
        if (prev.find((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    });

    // Subscribe to order updates (removed by other drivers)
    const unsubscribeUpdate = socketService.onOrderUpdate(({ orderId, status }) => {
      if (status === 'ASSIGNED') {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    });

    return () => {
      unsubscribe();
      unsubscribeUpdate();
    };
  }, []);

  const loadOrders = async () => {
    try {
      const params = currentLocation
        ? {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            radius: 10, // 10km radius
          }
        : undefined;

      const data = await deliveryService.getAvailableOrders(params);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Erro', 'Não foi possível carregar os pedidos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (orderId: string) => {
    setAcceptingId(orderId);
    try {
      const delivery = await deliveryService.acceptOrder(orderId);
      setCurrentDelivery(delivery);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      navigation.navigate('Navigation', { orderId });
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Não foi possível aceitar o pedido'
      );
    } finally {
      setAcceptingId(null);
    }
  };

  const calculateDistance = useCallback(
    (restaurantLat: number, restaurantLng: number): string => {
      if (!currentLocation) return '-';
      const distance = locationService.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        restaurantLat,
        restaurantLng
      );
      return locationService.formatDistance(distance);
    },
    [currentLocation]
  );

  const renderOrderItem = ({ item }: { item: DeliveryOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
          <View style={styles.distanceContainer}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.distanceText}>
              {calculateDistance(
                item.restaurant.address.latitude || 0,
                item.restaurant.address.longitude || 0
              )}
            </Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Ganho</Text>
          <Text style={styles.priceValue}>R$ {item.deliveryFee?.toFixed(2) || '0,00'}</Text>
        </View>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <View style={styles.addressDot} />
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>Retirada</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.restaurant.address.street}, {item.restaurant.address.number}
            </Text>
          </View>
        </View>
        <View style={styles.addressLine} />
        <View style={styles.addressRow}>
          <View style={[styles.addressDot, styles.addressDotGreen]} />
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>Entrega</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.deliveryAddress.street}, {item.deliveryAddress.number}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="cube-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.items?.length || 0} itens</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            ~{locationService.estimateTime(3)} min
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.acceptButton, acceptingId === item.id && styles.acceptButtonDisabled]}
        onPress={() => handleAcceptOrder(item.id)}
        disabled={acceptingId !== null}
      >
        {acceptingId === item.id ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <Text style={styles.acceptButtonText}>Aceitar pedido</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Carregando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos Disponíveis</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{orders.length}</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Nenhum pedido disponível</Text>
            <Text style={styles.emptyText}>
              Novos pedidos aparecerão aqui automaticamente
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  addressContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    marginRight: 12,
    marginTop: 4,
  },
  addressDotGreen: {
    backgroundColor: '#16a34a',
  },
  addressLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e5e7eb',
    marginLeft: 5,
    marginVertical: 4,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
  },
  orderDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
