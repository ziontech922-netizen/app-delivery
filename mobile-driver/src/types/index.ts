// Driver types
export interface Driver {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  cpf: string;
  avatarUrl: string | null;
  vehicleType: 'MOTORCYCLE' | 'BICYCLE' | 'CAR';
  vehiclePlate: string | null;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  isVerified: boolean;
  rating: number;
  totalDeliveries: number;
  createdAt: string;
}

// Location types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  tradeName?: string;
  logoUrl: string | null;
  phone?: string;
  address: Address;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// Order types
export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  name: string;
  productName?: string;
  quantity: number;
  notes?: string;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  distance: number;
  estimatedTime: number;
  notes: string | null;
  createdAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  restaurant: Restaurant;
  customer: Customer;
  deliveryAddress: Address;
  items: OrderItem[];
}

// Earnings types
export interface DailyEarnings {
  date: string;
  totalEarnings: number;
  deliveries: number;
  tips: number;
  bonus: number;
}

export interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalDeliveries: number;
  averageDeliveryTime?: number;
}

export interface DeliveryHistory {
  id: string;
  orderNumber: string;
  restaurantName: string;
  deliveryFee: number;
  earnings: number;
  tip: number;
  bonus: number;
  completedAt: string;
  restaurant?: {
    tradeName: string;
    name?: string;
  };
}

// Notification types
export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
