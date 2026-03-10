'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  Store,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Truck,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { adminService, DashboardStats } from '@/services/admin.service';
import { formatCurrency } from '@/utils/format';
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
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useState } from 'react';

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
  Filler
);

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'green' | 'blue' | 'orange' | 'purple';
}) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`h-4 w-4 ${trend >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`}
              />
              <span
                className={`text-sm font-medium ${
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['admin', 'stats'],
    queryFn: adminService.getStats,
    // Use placeholder data if API not implemented yet
    placeholderData: {
      totalOrders: 1247,
      totalMerchants: 89,
      totalUsers: 3542,
      totalRevenue: 125680.50,
      ordersToday: 45,
      ordersThisWeek: 312,
      ordersThisMonth: 1180,
      revenueToday: 4520.00,
      revenueThisWeek: 28450.00,
      revenueThisMonth: 98500.00,
      pendingMerchants: 12,
      activeDrivers: 34,
    },
  });

  // Chart data (using placeholder if API not available)
  const ordersChartData = {
    labels: chartPeriod === 'week' 
      ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
      : chartPeriod === 'month'
      ? Array.from({ length: 30 }, (_, i) => `${i + 1}`)
      : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [
      {
        label: 'Pedidos',
        data: chartPeriod === 'week'
          ? [45, 52, 38, 65, 48, 72, 58]
          : chartPeriod === 'month'
          ? Array.from({ length: 30 }, () => Math.floor(Math.random() * 50) + 20)
          : [420, 380, 450, 520, 480, 610, 580, 640, 590, 720, 680, 750],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const revenueChartData = {
    labels: chartPeriod === 'week'
      ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
      : chartPeriod === 'month'
      ? Array.from({ length: 30 }, (_, i) => `${i + 1}`)
      : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [
      {
        label: 'Receita (R$)',
        data: chartPeriod === 'week'
          ? [3200, 4100, 2800, 5200, 3900, 6100, 4800]
          : chartPeriod === 'month'
          ? Array.from({ length: 30 }, () => Math.floor(Math.random() * 5000) + 2000)
          : [32000, 28000, 38000, 45000, 42000, 52000, 48000, 55000, 51000, 62000, 58000, 68000],
        backgroundColor: 'rgb(34, 197, 94)',
        borderRadius: 6,
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
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral da plataforma</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Pedidos"
          value={stats?.totalOrders?.toLocaleString() || '0'}
          icon={ShoppingBag}
          trend={12}
          trendLabel="vs mês anterior"
          color="primary"
        />
        <StatCard
          title="Total de Merchants"
          value={stats?.totalMerchants?.toLocaleString() || '0'}
          icon={Store}
          trend={8}
          trendLabel="vs mês anterior"
          color="blue"
        />
        <StatCard
          title="Total de Usuários"
          value={stats?.totalUsers?.toLocaleString() || '0'}
          icon={Users}
          trend={15}
          trendLabel="vs mês anterior"
          color="purple"
        />
        <StatCard
          title="Receita Total"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          trend={18}
          trendLabel="vs mês anterior"
          color="green"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pedidos Hoje</p>
              <p className="text-xl font-bold text-gray-900">{stats?.ordersToday || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Receita Hoje</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(stats?.revenueToday || 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Merchants Pendentes</p>
              <p className="text-xl font-bold text-gray-900">{stats?.pendingMerchants || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Entregadores Ativos</p>
              <p className="text-xl font-bold text-gray-900">{stats?.activeDrivers || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Pedidos</h3>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="week">Semana</option>
              <option value="month">Mês</option>
              <option value="year">Ano</option>
            </select>
          </div>
          <div className="h-[300px]">
            <Line data={ordersChartData} options={chartOptions} />
          </div>
        </Card>

        {/* Revenue Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Receita</h3>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="week">Semana</option>
              <option value="month">Mês</option>
              <option value="year">Ano</option>
            </select>
          </div>
          <div className="h-[300px]">
            <Bar data={revenueChartData} options={chartOptions} />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/merchants?status=PENDING_APPROVAL"
            className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Store className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-900">Aprovar Merchants</p>
              <p className="text-xs text-orange-600">{stats?.pendingMerchants || 0} pendentes</p>
            </div>
          </a>
          <a
            href="/admin/orders?status=PENDING"
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Ver Pedidos</p>
              <p className="text-xs text-blue-600">Gerenciar pedidos</p>
            </div>
          </a>
          <a
            href="/admin/coupons"
            className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <DollarSign className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900">Criar Cupom</p>
              <p className="text-xs text-purple-600">Promoções</p>
            </div>
          </a>
          <a
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Users className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">Usuários</p>
              <p className="text-xs text-green-600">Gerenciar usuários</p>
            </div>
          </a>
        </div>
      </Card>
    </div>
  );
}
