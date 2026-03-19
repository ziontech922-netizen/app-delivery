'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Bike,
  Wallet,
  Star,
  Clock,
  TrendingUp,
  MapPin,
  Package,
  ChevronRight,
  Navigation,
  Phone,
  CheckCircle,
} from 'lucide-react';
import { driverService, DeliveryOrder, EarningsSummary } from '@/services/driver.service';

export default function DriverDashboardPage() {
  // Fetch current delivery
  const { data: currentDelivery, isLoading: loadingDelivery } = useQuery({
    queryKey: ['driver', 'currentDelivery'],
    queryFn: driverService.getCurrentDelivery,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch earnings summary
  const { data: earnings, isLoading: loadingEarnings } = useQuery({
    queryKey: ['driver', 'earnings'],
    queryFn: driverService.getEarningsSummary,
  });

  // Fetch driver profile
  const { data: profile } = useQuery({
    queryKey: ['driver', 'profile'],
    queryFn: driverService.getProfile,
  });

  // Fetch available orders count
  const { data: availableOrders } = useQuery({
    queryKey: ['driver', 'availableOrders'],
    queryFn: () => driverService.getAvailableOrders(),
    refetchInterval: 30000,
  });

  const isOnline = profile?.status === 'AVAILABLE';
  const isBusy = profile?.status === 'BUSY';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {profile?.name?.split(' ')[0] || 'Entregador'}!
        </h1>
        <p className="text-gray-500 mt-1">
          {isBusy
            ? 'Você está em uma entrega'
            : isOnline
            ? 'Você está disponível para entregas'
            : 'Fique online para receber pedidos'}
        </p>
      </div>

      {/* Current Delivery Card */}
      {currentDelivery && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Bike className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-green-800">Entrega em andamento</h2>
                <p className="text-sm text-green-600">
                  Pedido #{currentDelivery.id.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
              {currentDelivery.status === 'ASSIGNED' ? 'Retirar' : 'Entregar'}
            </span>
          </div>

          <div className="space-y-3">
            {/* Restaurant */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{currentDelivery.restaurant.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {currentDelivery.restaurant.address.street}, {currentDelivery.restaurant.address.number}
                </p>
              </div>
              <a
                href={`tel:${currentDelivery.restaurant.phone}`}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Phone className="h-4 w-4 text-gray-600" />
              </a>
            </div>

            {/* Customer */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{currentDelivery.customer.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {currentDelivery.deliveryAddress.street}, {currentDelivery.deliveryAddress.number}
                </p>
              </div>
              <a
                href={`tel:${currentDelivery.customer.phone}`}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Phone className="h-4 w-4 text-gray-600" />
              </a>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-green-300 text-green-700 rounded-xl font-medium hover:bg-green-50">
              <Navigation className="h-5 w-5" />
              Navegar
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
              <CheckCircle className="h-5 w-5" />
              {currentDelivery.status === 'ASSIGNED' ? 'Confirmar Retirada' : 'Confirmar Entrega'}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-green-200 flex items-center justify-between">
            <span className="text-sm text-green-700">Seu ganho nesta entrega:</span>
            <span className="text-lg font-bold text-green-700">
              R$ {currentDelivery.deliveryFee?.toFixed(2) || '0,00'}
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            R$ {earnings?.today?.toFixed(2) || '0,00'}
          </p>
          <p className="text-sm text-gray-500">Ganhos hoje</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Bike className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {profile?.totalDeliveries || 0}
          </p>
          <p className="text-sm text-gray-500">Total entregas</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
            <Star className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {profile?.rating?.toFixed(1) || '5.0'}
          </p>
          <p className="text-sm text-gray-500">Avaliação</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            R$ {earnings?.thisWeek?.toFixed(2) || '0,00'}
          </p>
          <p className="text-sm text-gray-500">Esta semana</p>
        </div>
      </div>

      {/* Available Orders Alert */}
      {!currentDelivery && isOnline && (availableOrders?.length || 0) > 0 && (
        <Link
          href="/driver/orders"
          className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-blue-900">
                {availableOrders?.length} pedido{availableOrders?.length !== 1 ? 's' : ''} disponível{availableOrders?.length !== 1 ? 'is' : ''}
              </p>
              <p className="text-sm text-blue-600">Toque para ver e aceitar</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-blue-600" />
        </Link>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/driver/orders"
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Ver Pedidos</p>
              <p className="text-sm text-gray-500">Pedidos disponíveis</p>
            </div>
          </div>
        </Link>

        <Link
          href="/driver/earnings"
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Meus Ganhos</p>
              <p className="text-sm text-gray-500">Histórico e resumo</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4">Resumo da Semana</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Ganhos</span>
            <span className="font-semibold text-gray-900">
              R$ {earnings?.thisWeek?.toFixed(2) || '0,00'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Entregas</span>
            <span className="font-semibold text-gray-900">
              {earnings?.totalDeliveries || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Média por entrega</span>
            <span className="font-semibold text-gray-900">
              R$ {earnings?.averagePerDelivery?.toFixed(2) || '0,00'}
            </span>
          </div>
        </div>

        <Link
          href="/driver/earnings"
          className="flex items-center justify-center gap-2 w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Ver detalhes
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
