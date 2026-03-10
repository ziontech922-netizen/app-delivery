import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://delivery-platform-api.fly.dev';

// Tipos de eventos
export interface OrderStatusChangedEvent {
  orderId: string;
  status: string;
  previousStatus: string;
  timestamp: string;
}

export interface OrderCancelledEvent {
  orderId: string;
  reason?: string;
  timestamp: string;
}

export interface DriverLocationEvent {
  orderId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  merchantId: string;
  timestamp: string;
}

// Socket instance
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Debug listeners
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', attemptNumber);
    });
  }

  return socket;
};

// Conectar com autenticação
export const connectSocket = (): void => {
  const socketInstance = getSocket();
  const token = Cookies.get('accessToken');

  if (token) {
    socketInstance.auth = { token };
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }
};

// Desconectar
export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

// Entrar na room de um pedido
export const joinOrderRoom = (orderId: string): void => {
  const socketInstance = getSocket();
  if (socketInstance.connected) {
    socketInstance.emit('join-order', orderId);
    console.log('[Socket] Joined order room:', orderId);
  }
};

// Sair da room de um pedido
export const leaveOrderRoom = (orderId: string): void => {
  const socketInstance = getSocket();
  if (socketInstance.connected) {
    socketInstance.emit('leave-order', orderId);
    console.log('[Socket] Left order room:', orderId);
  }
};

// Entrar na room do merchant (para merchants receberem novos pedidos)
export const joinMerchantRoom = (merchantId: string): void => {
  const socketInstance = getSocket();
  if (socketInstance.connected) {
    socketInstance.emit('join-merchant', merchantId);
    console.log('[Socket] Joined merchant room:', merchantId);
  }
};

// Exportar socket para uso direto
export { socket };
export default getSocket;
