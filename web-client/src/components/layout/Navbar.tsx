'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Menu, X, LogOut } from 'lucide-react';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { authService } from '@/services/auth.service';
import Button from '@/components/ui/Button';

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { isMobileMenuOpen, toggleMobileMenu, openCart } = useUIStore();

  const itemCount = getItemCount();

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
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="font-bold text-xl text-gray-900">Delivery</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-gray-600 hover:text-primary-600 transition-colors"
          >
            Restaurantes
          </Link>
          {isAuthenticated && (
            <Link
              href="/orders"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Meus Pedidos
            </Link>
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

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
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
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-gray-600"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link
              href="/"
              className="block text-gray-600 hover:text-primary-600"
              onClick={toggleMobileMenu}
            >
              Restaurantes
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/orders"
                  className="block text-gray-600 hover:text-primary-600"
                  onClick={toggleMobileMenu}
                >
                  Meus Pedidos
                </Link>
                <Link
                  href="/profile"
                  className="block text-gray-600 hover:text-primary-600"
                  onClick={toggleMobileMenu}
                >
                  Meu Perfil
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMobileMenu();
                  }}
                  className="block text-red-600"
                >
                  Sair
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login" onClick={toggleMobileMenu}>
                  <Button variant="outline" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" onClick={toggleMobileMenu}>
                  <Button className="w-full">Criar conta</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
