'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { connectSocket, disconnectSocket } from '@/services/socket';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      // Conectar socket quando autenticado
      connectSocket();
    } else {
      // Desconectar quando logout
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}

export default SocketProvider;
