import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { deliveryService } from '../services/deliveryService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { DeliveryOrder } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'DeliveryDetails'>;

export default function DeliveryDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { orderId } = route.params;

  const [delivery, setDelivery] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDelivery();
  }, [orderId]);

  const loadDelivery = async () => {
    try {
      const data = await deliveryService.getCurrentDelivery();
      setDelivery(data);
    } catch (error) {
      console.error('Error loading delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </SafeAreaView>
    );
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Entrega não encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Entrega</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Order ID */}
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Pedido</Text>
          <Text style={styles.orderId}>#{delivery.id.slice(-8).toUpperCase()}</Text>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, getStatusStyle(delivery.status)]}>
            <Text style={styles.statusText}>{getStatusLabel(delivery.status)}</Text>
          </View>
        </View>

        {/* Restaurant Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Restaurante</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{delivery.restaurant.name}</Text>
            <Text style={styles.cardAddress}>
              {delivery.restaurant.address.street}, {delivery.restaurant.address.number}
              {'\n'}
              {delivery.restaurant.address.neighborhood}, {delivery.restaurant.address.city}
            </Text>
            {delivery.restaurant.phone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(delivery.restaurant.phone!)}
              >
                <Ionicons name="call" size={18} color="#16a34a" />
                <Text style={styles.callButtonText}>Ligar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#16a34a" />
            <Text style={styles.sectionTitle}>Cliente</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{delivery.customer.name}</Text>
            <Text style={styles.cardAddress}>
              {delivery.deliveryAddress.street}, {delivery.deliveryAddress.number}
              {delivery.deliveryAddress.complement && ` - ${delivery.deliveryAddress.complement}`}
              {'\n'}
              {delivery.deliveryAddress.neighborhood}, {delivery.deliveryAddress.city}
            </Text>
            {delivery.customer.phone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(delivery.customer.phone!)}
              >
                <Ionicons name="call" size={18} color="#16a34a" />
                <Text style={styles.callButtonText}>Ligar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Itens ({delivery.items?.length || 0})</Text>
          </View>
          <View style={styles.card}>
            {delivery.items?.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet" size={20} color="#16a34a" />
            <Text style={styles.sectionTitle}>Pagamento</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Seu ganho</Text>
              <Text style={styles.paymentValue}>
                R$ {delivery.deliveryFee?.toFixed(2) || '0,00'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Navigate Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => navigation.navigate('Navigation', { orderId: delivery.id })}
        >
          <Ionicons name="navigate" size={24} color="#ffffff" />
          <Text style={styles.navigateButtonText}>Abrir navegação</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    PREPARING: 'Preparando',
    READY: 'Pronto',
    ASSIGNED: 'Atribuído',
    PICKED_UP: 'Retirado',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelado',
  };
  return labels[status] || status;
}

function getStatusStyle(status: string): object {
  switch (status) {
    case 'DELIVERED':
      return { backgroundColor: '#dcfce7' };
    case 'CANCELLED':
      return { backgroundColor: '#fee2e2' };
    case 'PICKED_UP':
      return { backgroundColor: '#dbeafe' };
    default:
      return { backgroundColor: '#fef3c7' };
  }
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
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  orderIdContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIdLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    width: 32,
  },
  itemName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  navigateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
