import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { deliveryService } from '../services/deliveryService';
import { EarningsSummary, DailyEarnings, DeliveryHistory } from '../types';

const { width } = Dimensions.get('window');

type Period = 'today' | 'week' | 'month';

export default function EarningsScreen() {
  const [period, setPeriod] = useState<Period>('today');
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarnings[]>([]);
  const [history, setHistory] = useState<DeliveryHistory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const [earningsData, dailyData, historyData] = await Promise.all([
        deliveryService.getEarningsSummary(),
        deliveryService.getDailyEarnings(getDateRange()),
        deliveryService.getDeliveryHistory({ ...getDateRange(), limit: 10 }),
      ]);

      setEarnings(earningsData);
      setDailyEarnings(dailyData);
      setHistory(historyData.data || []);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getPeriodAmount = () => {
    if (!earnings) return 0;
    switch (period) {
      case 'today':
        return earnings.today;
      case 'week':
        return earnings.thisWeek;
      case 'month':
        return earnings.thisMonth;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ganhos</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Amount Card */}
        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>
            {period === 'today'
              ? 'Ganhos de hoje'
              : period === 'week'
              ? 'Ganhos da semana'
              : 'Ganhos do mês'}
          </Text>
          <Text style={styles.mainAmount}>
            R$ {getPeriodAmount().toFixed(2)}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="bicycle-outline" size={20} color="#16a34a" />
              <Text style={styles.statValue}>{earnings?.totalDeliveries || 0}</Text>
              <Text style={styles.statLabel}>Entregas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color="#3b82f6" />
              <Text style={styles.statValue}>
                {earnings?.averageDeliveryTime || 0}
              </Text>
              <Text style={styles.statLabel}>Min/entrega</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="star-outline" size={20} color="#f59e0b" />
              <Text style={styles.statValue}>
                R$ {(getPeriodAmount() / (earnings?.totalDeliveries || 1)).toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Média</Text>
            </View>
          </View>
        </View>

        {/* Daily Chart (simplified) */}
        {dailyEarnings.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Últimos dias</Text>
            <View style={styles.chartContainer}>
              {dailyEarnings.slice(-7).map((day, index) => {
                const maxAmount = Math.max(...dailyEarnings.map((d) => d.total));
                const height = maxAmount > 0 ? (day.total / maxAmount) * 80 : 0;
                return (
                  <View key={index} style={styles.chartBar}>
                    <View style={[styles.bar, { height: Math.max(height, 4) }]} />
                    <Text style={styles.barLabel}>
                      {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'narrow' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Deliveries */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Entregas recentes</Text>
          
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Nenhuma entrega no período</Text>
            </View>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyRestaurant}>{item.restaurantName}</Text>
                  <Text style={styles.historyDate}>{formatDate(item.completedAt)}</Text>
                </View>
                <Text style={styles.historyAmount}>
                  +R$ {item.earnings.toFixed(2)}
                </Text>
              </View>
            ))
          )}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  periodButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  periodTextActive: {
    color: '#ffffff',
  },
  mainCard: {
    backgroundColor: '#16a34a',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  mainLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  mainAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 28,
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  historySection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyHistory: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyRestaurant: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
});
