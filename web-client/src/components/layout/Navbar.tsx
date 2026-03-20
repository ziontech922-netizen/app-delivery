'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, User, LogOut, MapPin, MessageCircle } from 'lucide-react';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { authService } from '@/services/auth.service';
import Button from '@/components/ui/Button';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { openCart } = useUIStore();

  // Esconder navbar em páginas de auth
  const hiddenPaths = ['/login', '/register', '/welcome', '/forgot-password', '/reset-password'];
  const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));

  const itemCount = getItemCount();

  if (shouldHide) return null;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      logout();
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="font-bold text-xl text-gray-900">SuperApp</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-gray-600 hover:text-orange-600 transition-colors"
          >
            Início
          </Link>
          <Link
            href="/listings"
            className="text-gray-600 hover:text-orange-600 transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/"
            className="text-gray-600 hover:text-orange-600 transition-colors"
          >
            Delivery
          </Link>
          {isAuthenticated && (
            <>
              <Link
                href="/chat"
                className="text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </Link>
              <Link
                href="/orders"
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                Meus Pedidos
              </Link>
            </>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Cart Button */}
          <button
            onClick={openCart}
            className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">{user?.name?.split(' ')[0]}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Criar conta</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header - Simplificado com carrinho */}
        <div className="flex md:hidden items-center gap-3">
          {/* Localização (opcional) */}
          <button className="flex items-center gap-1 text-gray-600 text-sm">
            <MapPin className="h-4 w-4 text-primary-600" />
            <span className="max-w-[100px] truncate">Entregar aqui</span>
          </button>
          
          {/* Carrinho */}
          <button
            onClick={openCart}
            className="relative p-2 text-gray-600"
          >
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
