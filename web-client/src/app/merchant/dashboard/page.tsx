'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ChefHat,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Card } from '@/components/ui';
import { merchantDashboardService, DashboardStats } from '@/services/merchant.dashboard.service';
import { formatCurrency } from '@/utils/format';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  change?: string;
  changeType?: 'positive' | 'negative';
}

function StatCard({ title, value, icon: Icon, color, change, changeType }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p
              className={`text-xs mt-1 ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

interface OrderStatusCardProps {
  title: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function OrderStatusCard({ title, count, icon: Icon, color, bgColor }: OrderStatusCardProps) {
  return (
    <div className={`p-4 rounded-xl ${bgColor}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </div>
    </div>
  );
}

export default function MerchantDashboardPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['merchant', 'dashboard', period],
    queryFn: merchantDashboardService.getDashboardStats,
    placeholderData: {
      ordersToday: 47,
      revenueToday: 3850.5,
      averageTicket: 81.92,
      pendingOrders: 3,
      preparingOrders: 5,
      readyOrders: 2,
      completedToday: 42,
      cancelledToday: 2,
      topProducts: [
        { id: '1', name: 'Pizza Margherita', quantity: 24, revenue: 1080.0 },
        { id: '2', name: 'Pizza Calabresa', quantity: 18, revenue: 756.0 },
        { id: '3', name: 'Pizza Portuguesa', quantity: 15, revenue: 675.0 },
        { id: '4', name: 'Refrigerante 2L', quantity: 32, revenue: 320.0 },
        { id: '5', name: 'Pizza Frango c/ Catupiry', quantity: 12, revenue: 540.0 },
      ],
      recentOrders: [
        {
          id: '1',
          orderNumber: 'ORD-001',
          status: 'PENDING',
          total: 89.9,
          customerName: 'João Silva',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          status: 'PREPARING',
          total: 125.0,
          customerName: 'Maria Santos',
          createdAt: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: '3',
          orderNumber: 'ORD-003',
          status: 'READY',
          total: 67.5,
          customerName: 'Carlos Lima',
          createdAt: new Date(Date.now() - 600000).toISOString(),
        },
      ],
    },
  });

  // Chart data for orders over time
  const ordersChartData = {
    labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
    datasets: [
      {
        label: 'Pedidos',
        data: [2, 5, 12, 8, 6, 15, 18, 8],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const ordersChartOptions = {
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

  // Doughnut chart for order status
  const orderStatusChartData = {
    labels: ['Entregues', 'Preparando', 'Pendentes', 'Cancelados'],
    datasets: [
      {
        data: [
          stats?.completedToday || 0,
          stats?.preparingOrders || 0,
          stats?.pendingOrders || 0,
          stats?.cancelledToday || 0,
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#6366F1', '#EF4444'],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    cutout: '70%',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'PREPARING':
        return 'Preparando';
      case 'READY':
        return 'Pronto';
      default:
        return status;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral do seu negócio</p>
        </div>

        {/* Period selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pedidos Hoje"
          value={stats?.ordersToday || 0}
          icon={ShoppingBag}
          color="bg-indigo-500"
          change="+12% vs ontem"
          changeType="positive"
        />
        <StatCard
          title="Receita Hoje"
          value={formatCurrency(stats?.revenueToday || 0)}
          icon={DollarSign}
          color="bg-green-500"
          change="+8% vs ontem"
          changeType="positive"
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(stats?.averageTicket || 0)}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard
          title="Tempo Médio"
          value="32 min"
          icon={Clock}
          color="bg-orange-500"
        />
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <OrderStatusCard
          title="Pendentes"
          count={stats?.pendingOrders || 0}
          icon={Clock}
          color="bg-yellow-500"
          bgColor="bg-yellow-50"
        />
        <OrderStatusCard
          title="Preparando"
          count={stats?.preparingOrders || 0}
          icon={ChefHat}
          color="bg-blue-500"
          bgColor="bg-blue-50"
        />
        <OrderStatusCard
          title="Prontos"
          count={stats?.readyOrders || 0}
          icon={Package}
          color="bg-green-500"
          bgColor="bg-green-50"
        />
        <OrderStatusCard
          title="Entregues"
          count={stats?.completedToday || 0}
          icon={CheckCircle}
          color="bg-emerald-500"
          bgColor="bg-emerald-50"
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos por Horário</h3>
          <div className="h-64">
            <Line data={ordersChartData} options={ordersChartOptions} />
          </div>
        </Card>

        {/* Order Status Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status dos Pedidos</h3>
          <div className="h-64">
            <Doughnut data={orderStatusChartData} options={doughnutOptions} />
          </div>
        </Card>
      </div>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h3>
            <a href="/merchant/orders" className="text-sm text-primary-600 hover:underline">
              Ver todos
            </a>
          </div>
          <div className="space-y-3">
            {stats?.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.customerName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Produtos Mais Vendidos</h3>
            <a href="/merchant/products" className="text-sm text-primary-600 hover:underline">
              Ver todos
            </a>
          </div>
          <div className="space-y-3">
            {stats?.topProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} vendidos</p>
                  </div>
                </div>
                <p className="font-medium text-gray-900">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
