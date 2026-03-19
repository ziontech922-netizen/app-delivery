'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User, Store } from 'lucide-react';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Início',
    href: '/',
    icon: Home,
  },
  {
    label: 'Buscar',
    href: '/search',
    icon: Search,
  },
  {
    label: 'Marketplace',
    href: '/listings',
    icon: Store,
  },
  {
    label: 'Pedidos',
    href: '/orders',
    icon: ShoppingBag,
    requiresAuth: true,
  },
  {
    label: 'Perfil',
    href: '/profile',
    icon: User,
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { openCart } = useUIStore();
  
  const itemCount = getItemCount();

  // Não mostrar em páginas de admin/merchant/auth
  const hiddenPaths = ['/admin', '/merchant', '/login', '/register', '/welcome', '/forgot-password', '/reset-password'];
  const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));
  
  if (shouldHide) return null;

  return (
    <>
      {/* Spacer para o conteúdo não ficar atrás da barra */}
      <div className="h-16 md:hidden" />
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            // Se requer auth e não está logado, redireciona para login
            const href = item.requiresAuth && !isAuthenticated ? '/login' : item.href;
            
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors',
                  isActive 
                    ? 'text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      'h-6 w-6 transition-transform',
                      isActive && 'scale-110'
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {/* Badge para pedidos */}
                  {item.href === '/orders' && itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </div>
                <span 
                  className={cn(
                    'text-[10px] mt-1 font-medium',
                    isActive ? 'text-primary-600' : 'text-gray-500'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
