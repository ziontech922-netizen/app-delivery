'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  Download,
  Calendar,
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Card, Button } from '@/components/ui';
import { merchantDashboardService } from '@/services/merchant.dashboard.service';
import { formatCurrency } from '@/utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type Period = '7d' | '30d' | '90d';

export default function MerchantAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'analytics', period],
    queryFn: () => merchantDashboardService.getAnalytics(period),
    placeholderData: {
      period,
      revenue: {
        total: 45890.5,
        previousTotal: 42150.0,
        percentChange: 8.87,
        daily: [
          { date: '2024-01-01', value: 1520.5 },
          { date: '2024-01-02', value: 1340.0 },
          { date: '2024-01-03', value: 1780.3 },
          { date: '2024-01-04', value: 1450.0 },
          { date: '2024-01-05', value: 2100.8 },
          { date: '2024-01-06', value: 2350.2 },
          { date: '2024-01-07', value: 2450.0 },
          { date: '2024-01-08', value: 1620.5 },
          { date: '2024-01-09', value: 1380.0 },
          { date: '2024-01-10', value: 1820.3 },
          { date: '2024-01-11', value: 1490.0 },
          { date: '2024-01-12', value: 2200.8 },
          { date: '2024-01-13', value: 2450.2 },
          { date: '2024-01-14', value: 2550.0 },
        ],
      },
      orders: {
        total: 542,
        previousTotal: 498,
        percentChange: 8.84,
        byStatus: {
          DELIVERED: 480,
          CANCELLED: 32,
          PREPARING: 15,
          PENDING: 10,
          READY: 5,
        },
        daily: [
          { date: '2024-01-01', value: 18 },
          { date: '2024-01-02', value: 15 },
          { date: '2024-01-03', value: 22 },
          { date: '2024-01-04', value: 17 },
          { date: '2024-01-05', value: 28 },
          { date: '2024-01-06', value: 32 },
          { date: '2024-01-07', value: 35 },
          { date: '2024-01-08', value: 19 },
          { date: '2024-01-09', value: 16 },
          { date: '2024-01-10', value: 24 },
          { date: '2024-01-11', value: 18 },
          { date: '2024-01-12', value: 30 },
          { date: '2024-01-13', value: 33 },
          { date: '2024-01-14', value: 38 },
        ],
      },
      averageTicket: {
        value: 84.67,
        previousValue: 78.45,
        percentChange: 7.93,
      },
      averagePreparationTime: {
        value: 28,
        previousValue: 32,
        percentChange: -12.5,
      },
      topProducts: [
        { productId: 'p1', productName: 'Pizza Margherita', quantity: 145, revenue: 6655.5 },
        { productId: 'p2', productName: 'Pizza Calabresa', quantity: 132, revenue: 5665.3 },
        { productId: 'p3', productName: 'Pizza Portuguesa', quantity: 98, revenue: 4792.2 },
        { productId: 'p4', productName: 'Combo Família', quantity: 76, revenue: 8740.0 },
        { productId: 'p5', productName: 'Refrigerante 2L', quantity: 198, revenue: 2376.0 },
      ],
      ordersByHour: [
        { hour: 11, count: 25 },
        { hour: 12, count: 68 },
        { hour: 13, count: 52 },
        { hour: 14, count: 28 },
        { hour: 18, count: 45 },
        { hour: 19, count: 125 },
        { hour: 20, count: 142 },
        { hour: 21, count: 98 },
        { hour: 22, count: 65 },
        { hour: 23, count: 32 },
      ],
      customerRetention: {
        newCustomers: 156,
        returningCustomers: 386,
        retentionRate: 71.22,
      },
    },
  });

  const periodLabels = {
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 90 dias',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  // Revenue Chart Data
  const revenueChartData = {
    labels: data?.revenue.daily.map((d) => formatDate(d.date)) || [],
    datasets: [
      {
        label: 'Faturamento',
        data: data?.revenue.daily.map((d) => d.value) || [],
        fill: true,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Orders Chart Data
  const ordersChartData = {
    labels: data?.orders.daily.map((d) => formatDate(d.date)) || [],
    datasets: [
      {
        label: 'Pedidos',
        data: data?.orders.daily.map((d) => d.value) || [],
        backgroundColor: 'rgb(99, 102, 241)',
        borderRadius: 4,
      },
    ],
  };

  // Orders by Hour Chart
  const hourlyChartData = {
    labels: data?.ordersByHour.map((d) => `${d.hour}h`) || [],
    datasets: [
      {
        label: 'Pedidos',
        data: data?.ordersByHour.map((d) => d.count) || [],
        backgroundColor: 'rgb(245, 158, 11)',
        borderRadius: 4,
      },
    ],
  };

  // Customer Retention Chart
  const retentionChartData = {
    labels: ['Novos Clientes', 'Clientes Recorrentes'],
    datasets: [
      {
        data: [
          data?.customerRetention.newCustomers || 0,
          data?.customerRetention.returningCustomers || 0,
        ],
        backgroundColor: ['rgb(59, 130, 246)', 'rgb(16, 185, 129)'],
        borderWidth: 0,
      },
    ],
  };

  // Order Status Chart
  const statusChartData = {
    labels: ['Entregues', 'Cancelados', 'Preparando', 'Pendentes', 'Prontos'],
    datasets: [
      {
        data: [
          data?.orders.byStatus.DELIVERED || 0,
          data?.orders.byStatus.CANCELLED || 0,
          data?.orders.byStatus.PREPARING || 0,
          data?.orders.byStatus.PENDING || 0,
          data?.orders.byStatus.READY || 0,
        ],
        backgroundColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(245, 158, 11)',
          'rgb(14, 165, 233)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Acompanhe o desempenho do seu estabelecimento</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <span
                  className={`flex items-center text-sm font-medium ${
                    (data?.revenue.percentChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {(data?.revenue.percentChange || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(data?.revenue.percentChange || 0).toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-500">Faturamento</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.revenue.total || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                vs {formatCurrency(data?.revenue.previousTotal || 0)} período anterior
              </p>
            </Card>

            {/* Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <span
                  className={`flex items-center text-sm font-medium ${
                    (data?.orders.percentChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {(data?.orders.percentChange || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(data?.orders.percentChange || 0).toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-500">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{data?.orders.total || 0}</p>
              <p className="text-xs text-gray-400 mt-1">
                vs {data?.orders.previousTotal || 0} período anterior
              </p>
            </Card>

            {/* Average Ticket */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <span
                  className={`flex items-center text-sm font-medium ${
                    (data?.averageTicket.percentChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {(data?.averageTicket.percentChange || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(data?.averageTicket.percentChange || 0).toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-500">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.averageTicket.value || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                vs {formatCurrency(data?.averageTicket.previousValue || 0)} período anterior
              </p>
            </Card>

            {/* Preparation Time */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <span
                  className={`flex items-center text-sm font-medium ${
                    (data?.averagePreparationTime.percentChange || 0) <= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {(data?.averagePreparationTime.percentChange || 0) <= 0 ? (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(data?.averagePreparationTime.percentChange || 0).toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-500">Tempo de Preparo</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.averagePreparationTime.value || 0} min
              </p>
              <p className="text-xs text-gray-400 mt-1">
                vs {data?.averagePreparationTime.previousValue || 0} min período anterior
              </p>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Faturamento Diário</h3>
              <div className="h-72">
                <Line data={revenueChartData} options={chartOptions} />
              </div>
            </Card>

            {/* Orders Chart */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pedidos Diários</h3>
              <div className="h-72">
                <Bar data={ordersChartData} options={chartOptions} />
              </div>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hourly Chart */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pedidos por Horário</h3>
              <div className="h-64">
                <Bar data={hourlyChartData} options={chartOptions} />
              </div>
            </Card>

            {/* Customer Retention */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Retenção de Clientes</h3>
              <div className="h-64">
                <Doughnut data={retentionChartData} options={doughnutOptions} />
              </div>
              <div className="mt-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {data?.customerRetention.retentionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">Taxa de Retenção</p>
              </div>
            </Card>

            {/* Order Status */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Status dos Pedidos</h3>
              <div className="h-64">
                <Doughnut data={statusChartData} options={doughnutOptions} />
              </div>
            </Card>
          </div>

          {/* Top Products */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">#</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Produto
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                      Qtd. Vendida
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                      Faturamento
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                      % do Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.topProducts.map((product, index) => {
                    const percentage = ((product.revenue / (data?.revenue.total || 1)) * 100).toFixed(1);
                    return (
                      <tr key={product.productId} className="border-b border-gray-100">
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              index === 0
                                ? 'bg-yellow-100 text-yellow-700'
                                : index === 1
                                ? 'bg-gray-100 text-gray-600'
                                : index === 2
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-50 text-gray-500'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-gray-900">
                          {product.productName}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600">{product.quantity}</td>
                        <td className="py-4 px-4 text-right text-gray-900 font-medium">
                          {formatCurrency(product.revenue)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-12">{percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
