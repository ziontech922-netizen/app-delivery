// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: 'CUSTOMER' | 'MERCHANT' | 'DRIVER' | 'ADMIN';
  avatarUrl: string | null;
  createdAt: string;
}

// Address types
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
  isDefault: boolean;
}

// Restaurant types
export interface Restaurant {
  id: string;
  tradeName: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  cuisineType: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  isOpen: boolean;
  distance?: number;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
  };
}

// Category types
export interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
  preparationTime: number | null;
}

// Cart types
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Cart {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
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
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  acceptedAt: string | null;
  preparedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  estimatedDeliveryTime: number | null;
  notes: string | null;
  restaurant: {
    id: string;
    tradeName: string;
    logoUrl: string | null;
    phone: string;
  };
  items: OrderItem[];
  deliveryAddress: Address;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string | null;
    location?: {
      latitude: number;
      longitude: number;
    };
  } | null;
}

// Review types
export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reply: string | null;
  repliedAt: string | null;
}

// Search types
export interface SearchFilters {
  query?: string;
  cuisineType?: string;
  minRating?: number;
  maxDeliveryFee?: number;
  sortBy?: 'distance' | 'rating' | 'deliveryTime' | 'deliveryFee';
}

// Notification types
export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Location types
export interface Location {
  latitude: number;
  longitude: number;
}

// Coupon types
export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minimumOrder: number;
  maximumDiscount: number | null;
  validUntil: string;
}
