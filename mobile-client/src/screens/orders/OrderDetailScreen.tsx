import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { OrdersStackParamList } from '../../navigation/types';

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2D3436',
  background: '#FFFFFF',
  gray: '#95A5A6',
  lightGray: '#F5F5F5',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
};

type OrderDetailRouteProp = RouteProp<OrdersStackParamList, 'OrderDetail'>;
type OrderDetailNavigationProp = NativeStackNavigationProp<OrdersStackParamList, 'OrderDetail'>;

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Pendente', color: COLORS.warning, icon: 'time-outline' },
  ACCEPTED: { label: 'Aceito', color: COLORS.primary, icon: 'checkmark-circle-outline' },
  PREPARING: { label: 'Preparando', color: COLORS.primary, icon: 'restaurant-outline' },
  READY: { label: 'Pronto', color: COLORS.success, icon: 'checkmark-done-outline' },
  PICKED_UP: { label: 'Em Entrega', color: COLORS.primary, icon: 'bicycle-outline' },
  DELIVERED: { label: 'Entregue', color: COLORS.success, icon: 'checkmark-circle' },
  CANCELLED: { label: 'Cancelado', color: COLORS.error, icon: 'close-circle-outline' },
};

export default function OrderDetailScreen() {
  const navigation = useNavigation<OrderDetailNavigationProp>();
  const route = useRoute<OrderDetailRouteProp>();
  const { orderId } = route.params;

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
  });

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Pedido não encontrado</Text>
      </View>
    );
  }

  const status = statusConfig[order.status] || statusConfig.PENDING;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: status.color + '20' }]}>
            <Ionicons name={status.icon} size={32} color={status.color} />
          </View>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          <Text style={styles.orderNumber}>Pedido #{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          
          {['ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP'].includes(order.status) && (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
            >
              <Ionicons name="location-outline" size={20} color={COLORS.background} />
              <Text style={styles.trackButtonText}>Acompanhar pedido</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Restaurant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurante</Text>
          <View style={styles.restaurantInfo}>
            <Ionicons name="restaurant-outline" size={24} color={COLORS.primary} />
            <Text style={styles.restaurantName}>{order.restaurant?.tradeName || 'Restaurante'}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do Pedido</Text>
          {order.items?.map((item: any, index: number) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemQuantity}>
                <Text style={styles.quantityText}>{item.quantity}x</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product?.name || item.productName}</Text>
                {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
              </View>
              <Text style={styles.itemPrice}>{formatCurrency(item.totalPrice || item.quantity * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={24} color={COLORS.primary} />
            <View style={styles.addressInfo}>
              <Text style={styles.addressText}>
                {order.deliveryAddress?.street}, {order.deliveryAddress?.number}
              </Text>
              <Text style={styles.addressText}>
                {order.deliveryAddress?.neighborhood} - {order.deliveryAddress?.city}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Pagamento</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Subtotal</Text>
            <Text style={styles.paymentValue}>{formatCurrency(order.subtotal || 0)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Taxa de entrega</Text>
            <Text style={styles.paymentValue}>{formatCurrency(order.deliveryFee || 0)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Desconto</Text>
              <Text style={[styles.paymentValue, { color: COLORS.success }]}>
                -{formatCurrency(order.discount)}
              </Text>
            </View>
          )}
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.totalAmount || 0)}</Text>
          </View>
        </View>

        {/* Help */}
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.primary} />
          <Text style={styles.helpText}>Precisa de ajuda com este pedido?</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  statusCard: {
    backgroundColor: COLORS.background,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  trackButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    backgroundColor: COLORS.background,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 16,
    color: COLORS.secondary,
    marginLeft: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  itemQuantity: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  itemNotes: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInfo: {
    marginLeft: 12,
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  paymentValue: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    marginBottom: 20,
  },
  helpText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
