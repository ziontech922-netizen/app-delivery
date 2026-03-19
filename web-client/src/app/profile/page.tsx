'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Bell, 
  Shield, 
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
  Edit2,
  Package,
  Heart,
  Star,
  Settings
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { authService } from '@/services/auth.service';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsLoading(false);
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      logout();
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Minha Conta',
      items: [
        { icon: User, label: 'Dados pessoais', href: '/profile/edit' },
        { icon: MapPin, label: 'Endereços salvos', href: '/profile/addresses' },
        { icon: CreditCard, label: 'Formas de pagamento', href: '/profile/payment' },
      ]
    },
    {
      title: 'Pedidos',
      items: [
        { icon: Package, label: 'Meus pedidos', href: '/orders' },
        { icon: Heart, label: 'Favoritos', href: '/profile/favorites' },
        { icon: Star, label: 'Avaliações', href: '/profile/reviews' },
      ]
    },
    {
      title: 'Configurações',
      items: [
        { icon: Bell, label: 'Notificações', href: '/profile/notifications' },
        { icon: Shield, label: 'Privacidade e segurança', href: '/profile/security' },
        { icon: Settings, label: 'Preferências', href: '/profile/preferences' },
      ]
    },
    {
      title: 'Suporte',
      items: [
        { icon: HelpCircle, label: 'Ajuda', href: '/help' },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 pt-8 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-white text-xl font-bold mb-6">Meu Perfil</h1>
          
          {/* User Card */}
          <div className="bg-white rounded-2xl shadow-lg p-4 -mb-12 relative z-10">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.firstName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary-600">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow-md">
                  <Camera className="w-3 h-3 text-white" />
                </button>
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
                {user?.phone && (
                  <p className="text-sm text-gray-500">{user.phone}</p>
                )}
              </div>
              
              {/* Edit Button */}
              <Link 
                href="/profile/edit"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Edit2 className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-16">
        {/* Menu Sections */}
        {menuItems.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {section.items.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors
                    ${index !== section.items.length - 1 ? 'border-b border-gray-100' : ''}
                  `}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="flex-1 text-gray-700">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white rounded-xl shadow-sm border border-gray-100 text-red-600 hover:bg-red-50 transition-colors mb-8"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair da conta</span>
        </button>

        {/* Version */}
        <p className="text-center text-xs text-gray-400 mb-4">
          SuperApp v1.0.0
        </p>
      </div>
    </div>
  );
}
