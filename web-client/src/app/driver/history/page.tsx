'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Star,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { driverService, DeliveryHistory } from '@/services/driver.service';

type FilterStatus = 'ALL' | 'DELIVERED' | 'CANCELLED';
type FilterPeriod = 'today' | 'week' | 'month' | 'all';

export default function DriverHistoryPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [periodFilter, setPeriodFilter] = useState<FilterPeriod>('all');
  const [showFilters, setShowFilters] = useState(false);
  const perPage = 10;

  // Fetch delivery history
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['driver', 'history', page, statusFilter, periodFilter],
    queryFn: async () => {
      const result = await driverService.getDeliveryHistory(page, perPage);
      return result;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Entregue
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Mock data for demonstration
  const mockDeliveries: DeliveryHistory[] = [
    {
      id: '1',
      orderId: 'ORD-2024-001',
      merchantName: 'Restaurante Sabor & Arte',
      customerName: 'João Silva',
      deliveryAddress: 'Rua das Flores, 123 - Centro',
      status: 'DELIVERED',
      earnings: 12.50,
      tip: 5.00,
      distance: 3.2,
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      rating: 5,
    },
    {
      id: '2',
      orderId: 'ORD-2024-002',
      merchantName: 'Pizzaria Bella Italia',
      customerName: 'Maria Santos',
      deliveryAddress: 'Av. Brasil, 456 - Jardim América',
      status: 'DELIVERED',
      earnings: 15.00,
      tip: 0,
      distance: 5.1,
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      rating: 4,
    },
    {
      id: '3',
      orderId: 'ORD-2024-003',
      merchantName: 'Sushi Express',
      customerName: 'Pedro Oliveira',
      deliveryAddress: 'Rua São Paulo, 789',
      status: 'CANCELLED',
      earnings: 0,
      tip: 0,
      distance: 2.8,
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: '4',
      orderId: 'ORD-2024-004',
      merchantName: 'Burger House',
      customerName: 'Ana Costa',
      deliveryAddress: 'Rua XV de Novembro, 321',
      status: 'DELIVERED',
      earnings: 10.00,
      tip: 3.00,
      distance: 1.5,
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      rating: 5,
    },
    {
      id: '5',
      orderId: 'ORD-2024-005',
      merchantName: 'Açaí do Parque',
      customerName: 'Lucas Mendes',
      deliveryAddress: 'Av. Getúlio Vargas, 567',
      status: 'DELIVERED',
      earnings: 8.50,
      tip: 2.00,
      distance: 2.0,
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      rating: 5,
    },
  ];

  const displayedDeliveries = deliveries?.items || mockDeliveries;
  const totalPages = deliveries?.totalPages || 3;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Entregas</h1>
          <p className="text-gray-500 mt-1">Todas as suas entregas realizadas</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="ALL">Todos</option>
                <option value="DELIVERED">Entregues</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>

            {/* Period Filter */}
            <div>
              <label htmlFor="periodFilter" className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select
                id="periodFilter"
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as FilterPeriod)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todo período</option>
                <option value="today">Hoje</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mês</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Entregas</p>
              <p className="text-2xl font-bold text-gray-900">
                {displayedDeliveries.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Distância Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {displayedDeliveries
                  .reduce((acc, d) => acc + (d.distance || 0), 0)
                  .toFixed(1)}{' '}
                km
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avaliação Média</p>
              <p className="text-2xl font-bold text-gray-900">4.9</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Pedido
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Estabelecimento
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Destino
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Data/Hora
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Ganhos
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Avaliação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-900">
                      {delivery.orderId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{delivery.merchantName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate max-w-[200px]">
                        {delivery.deliveryAddress}
                      </span>
                    </div>
                    {delivery.distance && (
                      <span className="text-xs text-gray-400">{delivery.distance} km</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(delivery.completedAt)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatTime(delivery.completedAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(delivery.earnings + (delivery.tip || 0))}
                    </div>
                    {delivery.tip && delivery.tip > 0 && (
                      <span className="text-xs text-gray-500">
                        +{formatCurrency(delivery.tip)} gorjeta
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(delivery.status)}</td>
                  <td className="px-6 py-4">
                    {delivery.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium">{delivery.rating}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * perPage + 1} -{' '}
            {Math.min(page * perPage, displayedDeliveries.length)} de{' '}
            {deliveries?.total || displayedDeliveries.length} resultados
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPage(idx + 1)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  page === idx + 1
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
