import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../stores/authStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { deliveryService } from '../services/deliveryService';
import { socketService } from '../services/socketService';
import { locationService } from '../services/locationService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { EarningsSummary } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { driver, updateStatus } = useAuthStore();
  const { currentDelivery, setCurrentDelivery, isOnline, setOnline, setCurrentLocation } =
    useDeliveryStore();

  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);

  useEffect(() => {
    loadData();
    setupLocationTracking();

    return () => {
      locationService.stopTracking();
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      socketService.setOnline();
      locationService.startTracking((location) => {
        setCurrentLocation(location);
      });
    } else {
      socketService.setOffline();
      locationService.stopTracking();
    }
  }, [isOnline]);

  const setupLocationTracking = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setCurrentLocation(location);
    }
  };

  const loadData = async () => {
    try {
      const [delivery, earningsData] = await Promise.all([
        deliveryService.getCurrentDelivery(),
        deliveryService.getEarningsSummary(),
      ]);
      setCurrentDelivery(delivery);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleOnline = async () => {
    try {
      const newStatus = isOnline ? 'OFFLINE' : 'AVAILABLE';
      await updateStatus(newStatus);
      setOnline(!isOnline);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar o status');
    }
  };

  const handleCurrentDelivery = () => {
    if (currentDelivery) {
      navigation.navigate('Navigation', { orderId: currentDelivery.id });
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return '#ef4444';
    if (currentDelivery) return '#f59e0b';
    return '#16a34a';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (currentDelivery) return 'Em entrega';
    return 'Disponível';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {driver?.name?.split(' ')[0] || 'Entregador'}</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#fbbf24" />
            <Text style={styles.ratingText}>{driver?.rating?.toFixed(1) || '5.0'}</Text>
          </View>
        </View>

        {/* Online Toggle */}
        <TouchableOpacity
          style={[styles.toggleButton, isOnline && styles.toggleButtonOnline]}
          onPress={toggleOnline}
          disabled={!!currentDelivery}
        >
          <Ionicons
            name={isOnline ? 'power' : 'power-outline'}
            size={32}
            color={isOnline ? '#ffffff' : '#16a34a'}
          />
          <Text style={[styles.toggleText, isOnline && styles.toggleTextOnline]}>
            {isOnline ? 'Você está online' : 'Ficar online'}
          </Text>
        </TouchableOpacity>

        {/* Current Delivery Card */}
        {currentDelivery && (
          <TouchableOpacity style={styles.deliveryCard} onPress={handleCurrentDelivery}>
            <View style={styles.deliveryHeader}>
              <Ionicons name="bicycle" size={24} color="#16a34a" />
              <Text style={styles.deliveryTitle}>Entrega em andamento</Text>
            </View>
            <View style={styles.deliveryInfo}>
              <Text style={styles.restaurantName}>{currentDelivery.restaurant.name}</Text>
              <Text style={styles.deliveryAddress} numberOfLines={1}>
                {currentDelivery.deliveryAddress.street}, {currentDelivery.deliveryAddress.number}
              </Text>
            </View>
            <View style={styles.deliveryStatus}>
              <Text style={styles.deliveryStatusText}>
                {currentDelivery.status === 'ASSIGNED'
                  ? 'Retire no restaurante'
                  : 'Entregue ao cliente'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </TouchableOpacity>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="wallet-outline" size={28} color="#16a34a" />
            <Text style={styles.statValue}>
              R$ {earnings?.today?.toFixed(2) || '0,00'}
            </Text>
            <Text style={styles.statLabel}>Hoje</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bicycle-outline" size={28} color="#3b82f6" />
            <Text style={styles.statValue}>{driver?.totalDeliveries || 0}</Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={28} color="#f59e0b" />
            <Text style={styles.statValue}>
              R$ {earnings?.thisWeek?.toFixed(2) || '0,00'}
            </Text>
            <Text style={styles.statLabel}>Semana</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Main', { screen: 'Orders' } as any)}
            >
              <Ionicons name="list-outline" size={24} color="#16a34a" />
              <Text style={styles.actionText}>Ver pedidos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Main', { screen: 'Earnings' } as any)}
            >
              <Ionicons name="stats-chart-outline" size={24} color="#16a34a" />
              <Text style={styles.actionText}>Ganhos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#16a34a',
    marginBottom: 24,
    gap: 12,
  },
  toggleButtonOnline: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  toggleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
  },
  toggleTextOnline: {
    color: '#ffffff',
  },
  deliveryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  deliveryInfo: {
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  deliveryStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionsContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
});
