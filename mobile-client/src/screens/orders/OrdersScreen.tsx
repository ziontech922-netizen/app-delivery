import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { orderService, Order } from '../../services/orderService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Aguardando confirmação', color: '#f59e0b', icon: 'time-outline' },
  ACCEPTED: { label: 'Pedido aceito', color: '#3b82f6', icon: 'checkmark-circle-outline' },
  PREPARING: { label: 'Em preparo', color: '#8b5cf6', icon: 'restaurant-outline' },
  READY: { label: 'Pronto para retirada', color: '#06b6d4', icon: 'bag-check-outline' },
  PICKED_UP: { label: 'Saiu para entrega', color: '#14b8a6', icon: 'bicycle-outline' },
  DELIVERED: { label: 'Entregue', color: '#10b981', icon: 'checkmark-done-outline' },
  CANCELLED: { label: 'Cancelado', color: '#ef4444', icon: 'close-circle-outline' },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const OrderCard = ({ order, onPress }: { order: Order; onPress: () => void }) => {
  const status = statusConfig[order.status] || statusConfig.PENDING;
  const isActive = !['DELIVERED', 'CANCELLED'].includes(order.status);

  return (
    <TouchableOpacity
      style={[styles.orderCard, isActive && styles.activeOrderCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.restaurantInfo}>
          {order.restaurant?.logoUrl ? (
            <Image source={{ uri: order.restaurant.logoUrl }} style={styles.restaurantImage} />
          ) : (
            <View style={[styles.restaurantImage, styles.placeholderImage]}>
              <Ionicons name="restaurant" size={20} color="#9ca3af" />
            </View>
          )}
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>{order.restaurant?.tradeName || 'Restaurante'}</Text>
            <Text style={styles.orderNumber}>Pedido #{order.orderNumber}</Text>
          </View>
        </View>
        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
      </View>

      <View style={styles.orderItems}>
        {order.items.slice(0, 2).map((item, index) => (
          <Text key={index} style={styles.itemText} numberOfLines={1}>
            {item.quantity}x {item.productName}
          </Text>
        ))}
        {order.items.length > 2 && (
          <Text style={styles.moreItems}>+{order.items.length - 2} itens</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
          <Ionicons name={status.icon} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={styles.totalAmount}>{formatCurrency(order.totalAmount)}</Text>
      </View>

      {isActive && (
        <View style={styles.trackButton}>
          <Text style={styles.trackButtonText}>Acompanhar pedido</Text>
          <Ionicons name="chevron-forward" size={16} color="#16a34a" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function OrdersScreen() {
  const navigation = useNavigation<NavigationProp>();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getMyOrders(),
  });

  const orders: Order[] = data?.data || [];
  const activeOrders = orders.filter((o: Order) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const pastOrders = orders.filter((o: Order) => ['DELIVERED', 'CANCELLED'].includes(o.status));

  const handleOrderPress = (order: Order) => {
    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      // Show order details modal or navigate to details
      navigation.navigate('OrderTracking', { orderId: order.id });
    } else {
      navigation.navigate('OrderTracking', { orderId: order.id });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Carregando pedidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Pedidos</Text>
      </View>

      <FlatList
        data={[...activeOrders, ...pastOrders]}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <>
            {index === 0 && activeOrders.length > 0 && (
              <Text style={styles.sectionTitle}>Em andamento</Text>
            )}
            {index === activeOrders.length && pastOrders.length > 0 && (
              <Text style={styles.sectionTitle}>Histórico</Text>
            )}
            <OrderCard order={item} onPress={() => handleOrderPress(item)} />
          </>
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#16a34a']} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
            <Text style={styles.emptyText}>
              Faça seu primeiro pedido e ele aparecerá aqui
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.exploreButtonText}>Explorar restaurantes</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#16a34a',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activeOrderCard: {
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restaurantImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantDetails: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  orderNumber: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  orderItems: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 4,
  },
  trackButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16a34a',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  exploreButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
