'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderOpen,
  BarChart3,
  Star,
  Menu,
  X,
  LogOut,
  Store,
  Bell,
  Settings,
  ChevronDown,
  Power,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { merchantDashboardService } from '@/services/merchant.dashboard.service';

const navigation = [
  { name: 'Dashboard', href: '/merchant/dashboard', icon: LayoutDashboard },
  { name: 'Pedidos', href: '/merchant/orders', icon: ShoppingBag },
  { name: 'Produtos', href: '/merchant/products', icon: Package },
  { name: 'Categorias', href: '/merchant/categories', icon: FolderOpen },
  { name: 'Analytics', href: '/merchant/analytics', icon: BarChart3 },
  { name: 'Avaliações', href: '/merchant/reviews', icon: Star },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Redirect if not merchant
  useEffect(() => {
    if (user && user.role !== 'MERCHANT') {
      router.push('/merchant/login');
    }
  }, [user, router]);

  // Fetch merchant profile
  const { data: profile } = useQuery({
    queryKey: ['merchant', 'profile'],
    queryFn: merchantDashboardService.getProfile,
    enabled: !!user && user.role === 'MERCHANT',
    placeholderData: {
      id: '1',
      businessName: 'Meu Restaurante',
      tradeName: 'Meu Restaurante',
      document: '00.000.000/0001-00',
      phone: '11999999999',
      email: 'contato@restaurante.com',
      description: null,
      logoUrl: null,
      bannerUrl: null,
      status: 'ACTIVE' as const,
      isOpen: true,
      averageRating: 4.5,
      totalReviews: 128,
      deliveryFee: 5.0,
      minOrderValue: 20.0,
      estimatedDeliveryTime: 45,
      address: {
        street: 'Rua Principal',
        number: '100',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
      },
      openingHours: [],
      createdAt: '2024-01-01T00:00:00Z',
    },
  });

  // Toggle open/close mutation
  const toggleOpenMutation = useMutation({
    mutationFn: (isOpen: boolean) => merchantDashboardService.toggleOpen(isOpen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'profile'] });
    },
  });

  const handleLogout = () => {
    logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/merchant/login');
  };

  // Don't render layout for login page
  if (pathname === '/merchant/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link href="/merchant/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Merchant</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Store Status */}
        {profile && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    profile.isOpen ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">
                  {profile.isOpen ? 'Aberto' : 'Fechado'}
                </span>
              </div>
              <button
                onClick={() => toggleOpenMutation.mutate(!profile.isOpen)}
                disabled={toggleOpenMutation.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profile.isOpen ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.isOpen ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 truncate">
              {profile.tradeName || profile.businessName}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : ''}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Store className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.tradeName || profile?.businessName || 'Merchant'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                <Link
                  href="/merchant/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-3">
            {/* Store toggle (desktop) */}
            {profile && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Power
                  className={`h-4 w-4 ${profile.isOpen ? 'text-green-600' : 'text-red-500'}`}
                />
                <span className="text-sm font-medium">
                  {profile.isOpen ? 'Aberto' : 'Fechado'}
                </span>
              </div>
            )}

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
