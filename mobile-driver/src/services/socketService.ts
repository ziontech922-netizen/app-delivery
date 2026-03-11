import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { DeliveryOrder } from '../types';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://delivery-platform-api.fly.dev';

type NewOrderCallback = (order: DeliveryOrder) => void;
type OrderUpdateCallback = (data: { orderId: string; status: string }) => void;
type OrderCancelledCallback = (data: { orderId: string; reason: string }) => void;

class SocketService {
  private socket: Socket | null = null;
  private newOrderCallbacks: NewOrderCallback[] = [];
  private orderUpdateCallbacks: OrderUpdateCallback[] = [];
  private orderCancelledCallbacks: OrderCancelledCallback[] = [];
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
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Driver socket connected');
        this.isConnecting = false;
        // Join driver room
        this.socket?.emit('driver:online');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Driver socket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Driver socket connection error:', error);
        this.isConnecting = false;
      });

      // Listen for new available orders
      this.socket.on('order:available', (order: DeliveryOrder) => {
        this.newOrderCallbacks.forEach((cb) => cb(order));
      });

      // Listen for order updates
      this.socket.on('order:update', (data: { orderId: string; status: string }) => {
        this.orderUpdateCallbacks.forEach((cb) => cb(data));
      });

      // Listen for order cancellations
      this.socket.on('order:cancelled', (data: { orderId: string; reason: string }) => {
        this.orderCancelledCallbacks.forEach((cb) => cb(data));
      });
    } catch (error) {
      console.error('Error connecting driver socket:', error);
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.emit('driver:offline');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Set driver as online/available
  setOnline(): void {
    this.socket?.emit('driver:online');
  }

  // Set driver as offline
  setOffline(): void {
    this.socket?.emit('driver:offline');
  }

  // Update driver location
  updateLocation(latitude: number, longitude: number): void {
    this.socket?.emit('driver:location', { latitude, longitude });
  }

  // Accept an order via socket
  acceptOrder(orderId: string): void {
    this.socket?.emit('order:accept', { orderId });
  }

  // Subscribe to new available orders
  onNewOrder(callback: NewOrderCallback): () => void {
    this.newOrderCallbacks.push(callback);
    return () => {
      const index = this.newOrderCallbacks.indexOf(callback);
      if (index > -1) {
        this.newOrderCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to order updates
  onOrderUpdate(callback: OrderUpdateCallback): () => void {
    this.orderUpdateCallbacks.push(callback);
    return () => {
      const index = this.orderUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.orderUpdateCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to order cancellations
  onOrderCancelled(callback: OrderCancelledCallback): () => void {
    this.orderCancelledCallbacks.push(callback);
    return () => {
      const index = this.orderCancelledCallbacks.indexOf(callback);
      if (index > -1) {
        this.orderCancelledCallbacks.splice(index, 1);
      }
    };
  }

  // Generic emit
  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
export default socketService;
