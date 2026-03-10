'use client';

import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

export function NotificationBadge({ count, onClick, className }: NotificationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors',
        className
      )}
      aria-label={`${count} notificações`}
    >
      <Bell className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

interface NotificationDotProps {
  show: boolean;
  className?: string;
}

export function NotificationDot({ show, className }: NotificationDotProps) {
  if (!show) return null;

  return (
    <span
      className={cn(
        'absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full',
        'animate-pulse',
        className
      )}
    />
  );
}
