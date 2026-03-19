'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  TrendingUp,
  Calendar,
  Bike,
  DollarSign,
  ChevronDown,
  Download,
} from 'lucide-react';
import { driverService, EarningsSummary, DailyEarnings, DeliveryHistory } from '@/services/driver.service';

type Period = 'today' | 'week' | 'month';

export default function DriverEarningsPage() {
  const [period, setPeriod] = useState<Period>('week');

  // Fetch earnings summary
  const { data: earnings, isLoading: loadingEarnings } = useQuery({
    queryKey: ['driver', 'earnings'],
    queryFn: driverService.getEarningsSummary,
  });

  // Fetch daily earnings
  const { data: dailyEarnings, isLoading: loadingDaily } = useQuery({
    queryKey: ['driver', 'dailyEarnings', period],
    queryFn: () => {
      const now = new Date();
      let startDate: string;

      if (period === 'today') {
        startDate = now.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        startDate = weekAgo.toISOString().split('T')[0];
      } else {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        startDate = monthAgo.toISOString().split('T')[0];
      }

      return driverService.getDailyEarnings({ startDate });
    },
  });

  // Fetch recent deliveries
  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['driver', 'history'],
    queryFn: () => driverService.getDeliveryHistory({ limit: 10 }),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getEarningForPeriod = () => {
    if (!earnings) return 0;
    switch (period) {
      case 'today':
        return earnings.today;
      case 'week':
        return earnings.thisWeek;
      case 'month':
        return earnings.thisMonth;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Ganhos</h1>
          <p className="text-gray-500 mt-1">Acompanhe seus rendimentos</p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Earning Card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 text-green-200" />
          <span className="text-green-100">
            Ganhos {period === 'today' ? 'de hoje' : period === 'week' ? 'da semana' : 'do mês'}
          </span>
        </div>
        <div className="text-4xl font-bold mb-4">
          {loadingEarnings ? (
            <div className="h-10 w-32 bg-green-400 rounded animate-pulse" />
          ) : (
            formatCurrency(getEarningForPeriod())
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-green-200 text-sm">Entregas</p>
            <p className="text-xl font-semibold">{earnings?.totalDeliveries || 0}</p>
          </div>
          <div>
            <p className="text-green-200 text-sm">Média/Entrega</p>
            <p className="text-xl font-semibold">
              {formatCurrency(earnings?.averagePerDelivery || 0)}
            </p>
          </div>
          <div>
            <p className="text-green-200 text-sm">Total Geral</p>
            <p className="text-xl font-semibold">
              {formatCurrency(earnings?.totalEarnings || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hoje</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(earnings?.today || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Esta Semana</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(earnings?.thisWeek || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Este Mês</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(earnings?.thisMonth || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Earnings Chart */}
      {dailyEarnings && dailyEarnings.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ganhos Diários</h2>
          <div className="space-y-3">
            {dailyEarnings.slice(0, 7).map((day, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-500">
                  {new Date(day.date).toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          (day.amount / Math.max(...dailyEarnings.map((d) => d.amount))) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(day.amount)}</p>
                  <p className="text-xs text-gray-500">{day.deliveries} entregas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Deliveries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Últimas Entregas</h2>
        </div>
        
        {loadingHistory ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
          </div>
        ) : history?.data && history.data.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {history.data.map((delivery) => (
              <div key={delivery.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bike className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{delivery.restaurantName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(delivery.completedAt).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    +{formatCurrency(delivery.deliveryFee)}
                  </p>
                  {delivery.rating && (
                    <div className="flex items-center gap-1 text-yellow-500 text-sm">
                      ★ {delivery.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bike className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma entrega realizada ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
