'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Package,
  Wallet,
  User,
  Menu,
  X,
  LogOut,
  Bike,
  Bell,
  Power,
  MapPin,
  Star,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { driverService } from '@/services/driver.service';

const navigation = [
  { name: 'Dashboard', href: '/driver/dashboard', icon: LayoutDashboard },
  { name: 'Pedidos', href: '/driver/orders', icon: Package },
  { name: 'Ganhos', href: '/driver/earnings', icon: Wallet },
  { name: 'Perfil', href: '/driver/profile', icon: User },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Check if this is a public page (login/register)
  const isPublicPage = pathname === '/driver/login' || pathname?.startsWith('/driver/register');

  // Redirect if not driver (but allow login/register pages)
  useEffect(() => {
    if (!isPublicPage && user && user.role !== 'DRIVER') {
      router.push('/driver/login');
    }
  }, [user, router, isPublicPage, pathname]);

  // Fetch driver profile
  const { data: profile } = useQuery({
    queryKey: ['driver', 'profile'],
    queryFn: driverService.getProfile,
    enabled: !isPublicPage && !!user && user.role === 'DRIVER',
  });

  // Toggle online/offline mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (status: 'AVAILABLE' | 'OFFLINE') => driverService.updateStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] });
    },
  });

  const handleLogout = () => {
    logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/driver/login');
  };

  const toggleOnline = () => {
    const newStatus = profile?.status === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
    toggleStatusMutation.mutate(newStatus);
  };

  // If public page, just render children
  if (isPublicPage) {
    return <>{children}</>;
  }

  // If not authenticated, show loading or redirect will happen
  if (!user || user.role !== 'DRIVER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const isOnline = profile?.status === 'AVAILABLE';
  const isBusy = profile?.status === 'BUSY';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link href="/driver/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Bike className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-gray-900">Entregador</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Driver Status Card */}
        <div className="p-4 border-b">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                {profile?.avatarUrl ? (
               <img src={profile.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <User className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{profile?.name || user.name}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span>{profile?.rating?.toFixed(1) || '5.0'}</span>
                  <span className="mx-1">•</span>
                  <span>{profile?.totalDeliveries || 0} entregas</span>
                </div>
              </div>
            </div>
            
            {/* Online Toggle */}
            <button
              onClick={toggleOnline}
              disabled={isBusy || toggleStatusMutation.isPending}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                isBusy
                  ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                  : isOnline
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Power className="h-4 w-4" />
              {isBusy ? 'Em entrega' : isOnline ? 'Online' : 'Offline'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b h-16 flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <Bike className="h-6 w-6 text-green-600" />
            <span className="font-bold">Entregador</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              isBusy
                ? 'bg-yellow-100 text-yellow-700'
                : isOnline
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isBusy ? 'bg-yellow-500' : isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              {isBusy ? 'Em entrega' : isOnline ? 'Disponível' : 'Offline'}
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100" aria-label="Notificações">
              <Bell className="h-6 w-6 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                aria-label="Menu do perfil"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-green-600" />
                </div>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                    <Link
                      href="/driver/profile"
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
