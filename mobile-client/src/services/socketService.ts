import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://superapp-api-beta.fly.dev';

type OrderUpdateCallback = (data: {
  orderId: string;
  status: string;
  message?: string;
  estimatedTime?: number;
}) => void;

type DriverLocationCallback = (data: {
  orderId: string;
  latitude: number;
  longitude: number;
}) => void;

type NotificationCallback = (data: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) => void;

class SocketService {
  private socket: Socket | null = null;
  private orderUpdateCallbacks: Map<string, OrderUpdateCallback[]> = new Map();
  private driverLocationCallbacks: Map<string, DriverLocationCallback[]> = new Map();
  private notificationCallbacks: NotificationCallback[] = [];
  private isConnecting = false;

  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = await SecureStore.getItemAsync('accessToken');
      
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.isConnecting = false;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnecting = false;
      });

      // Listen for order updates
      this.socket.on('order:update', (data) => {
        const callbacks = this.orderUpdateCallbacks.get(data.orderId) || [];
        callbacks.forEach((cb) => cb(data));
        
        // Also notify with wildcard listeners
        const wildcardCallbacks = this.orderUpdateCallbacks.get('*') || [];
        wildcardCallbacks.forEach((cb) => cb(data));
      });

      // Listen for driver location updates
      this.socket.on('driver:location', (data) => {
        const callbacks = this.driverLocationCallbacks.get(data.orderId) || [];
        callbacks.forEach((cb) => cb(data));
      });

      // Listen for notifications
      this.socket.on('notification', (data) => {
        this.notificationCallbacks.forEach((cb) => cb(data));
      });

    } catch (error) {
      console.error('Error connecting socket:', error);
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to order updates
  subscribeToOrder(orderId: string, callback: OrderUpdateCallback): () => void {
    const callbacks = this.orderUpdateCallbacks.get(orderId) || [];
    callbacks.push(callback);
    this.orderUpdateCallbacks.set(orderId, callbacks);

    // Join the order room
    this.socket?.emit('order:join', { orderId });

    // Return unsubscribe function
    return () => {
      const updatedCallbacks = this.orderUpdateCallbacks.get(orderId) || [];
      const index = updatedCallbacks.indexOf(callback);
      if (index > -1) {
        updatedCallbacks.splice(index, 1);
        this.orderUpdateCallbacks.set(orderId, updatedCallbacks);
      }
      
      // Leave the order room if no more listeners
      if (updatedCallbacks.length === 0) {
        this.socket?.emit('order:leave', { orderId });
      }
    };
  }

  // Subscribe to driver location
  subscribeToDriverLocation(orderId: string, callback: DriverLocationCallback): () => void {
    const callbacks = this.driverLocationCallbacks.get(orderId) || [];
    callbacks.push(callback);
    this.driverLocationCallbacks.set(orderId, callbacks);

    // Return unsubscribe function
    return () => {
      const updatedCallbacks = this.driverLocationCallbacks.get(orderId) || [];
      const index = updatedCallbacks.indexOf(callback);
      if (index > -1) {
        updatedCallbacks.splice(index, 1);
        this.driverLocationCallbacks.set(orderId, updatedCallbacks);
      }
    };
  }

  // Subscribe to notifications
  subscribeToNotifications(callback: NotificationCallback): () => void {
    this.notificationCallbacks.push(callback);

    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Generic emit wrapper
  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  // Generic on wrapper
  on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }

  // Generic off wrapper
  off(event: string, callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
