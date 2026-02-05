// Eventos emitidos pelo servidor
export enum RealtimeEvent {
  // Orders
  ORDER_CREATED = 'order:created',
  ORDER_STATUS_UPDATED = 'order:status_updated',
  ORDER_CANCELLED = 'order:cancelled',
  
  // Connection
  CONNECTION_SUCCESS = 'connection:success',
  CONNECTION_ERROR = 'connection:error',
  
  // Rooms
  ROOM_JOINED = 'room:joined',
  ROOM_LEFT = 'room:left',
  ROOM_ERROR = 'room:error',
}

// Payloads dos eventos
export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  customerId: string;
  merchantId: string;
  total: number;
  itemsCount: number;
  createdAt: string;
}

export interface OrderStatusUpdatedPayload {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  orderNumber: string;
  cancelledBy: 'customer' | 'merchant';
  reason?: string;
  cancelledAt: string;
}

export interface ConnectionSuccessPayload {
  userId: string;
  socketId: string;
  rooms: string[];
}

export interface RoomJoinedPayload {
  room: string;
  joinedAt: string;
}

export interface RoomErrorPayload {
  room: string;
  error: string;
}
