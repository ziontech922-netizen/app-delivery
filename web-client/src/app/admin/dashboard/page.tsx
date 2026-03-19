'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  Store,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { adminService, DashboardStats } from '@/services/admin.service';
import { formatCurrency } from '@/utils/format';

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
  // Fetch dashboard stats
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminService.getStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Erro ao carregar dashboard: {(error as Error).message}</p>
      </div>
    );
  }

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
          title="Total de Merchants"
          value={stats?.totalMerchants?.toLocaleString() || '0'}
          icon={Store}
          color="blue"
        />
        <StatCard
          title="Merchants Ativos"
          value={stats?.activeMerchants?.toLocaleString() || '0'}
          icon={Store}
          color="green"
        />
        <StatCard
          title="Merchants Pendentes"
          value={stats?.pendingMerchants?.toLocaleString() || '0'}
          icon={AlertCircle}
          color="orange"
        />
        <StatCard
          title="Total de Usuários"
          value={stats?.totalUsers?.toLocaleString() || '0'}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Orders Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Pedidos</p>
              <p className="text-xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pedidos Pendentes</p>
              <p className="text-xl font-bold text-gray-900">{stats?.pendingOrders || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Truck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pedidos Concluídos</p>
              <p className="text-xl font-bold text-gray-900">{stats?.completedOrders || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pedidos Cancelados</p>
              <p className="text-xl font-bold text-gray-900">{stats?.cancelledOrders || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Receita Total</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(stats?.totalRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Receita Hoje</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(stats?.todayRevenue || 0)}
              </span>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Sistema</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Usuários Ativos</span>
              <span className="text-lg font-semibold text-gray-900">{stats?.activeUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Última Atualização</span>
              <span className="text-sm text-gray-500">
                {stats?.generatedAt ? new Date(stats.generatedAt).toLocaleString('pt-BR') : '-'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
