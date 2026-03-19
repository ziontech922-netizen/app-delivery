// ===========================================
// USER & AUTH TYPES
// ===========================================

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'DRIVER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// Legacy format support
export interface AuthResponseLegacy {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ===========================================
// MERCHANT TYPES
// ===========================================

export interface Merchant {
  id: string;
  userId: string;
  name: string;
  businessName?: string;
  tradeName?: string;
  document?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  category?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  status: MerchantStatus;
  isOpen: boolean;
  minOrder?: number;
  minimumOrder?: number;
  deliveryFee?: number;
  deliveryTime?: string;
  estimatedTime?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

export type MerchantStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// ===========================================
// PRODUCT TYPES
// ===========================================

export interface Category {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  merchantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  sortOrder: number;
  hasStock: boolean;
  stockQty?: number;
  category?: Category;
}

// ===========================================
// ORDER TYPES
// ===========================================

export interface Address {
  id: string;
  userId: string;
  label?: string;
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

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  merchantId: string;
  driverId?: string;
  addressId: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  merchant?: Merchant;
  address?: Address;
  items?: OrderItem[];
}

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface CreateOrderRequest {
  merchantId: string;
  addressId: string;
  paymentMethod: PaymentMethod;
  items: CreateOrderItemRequest[];
  notes?: string;
  couponCode?: string;
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  notes?: string;
}

// ===========================================
// CART TYPES
// ===========================================

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Cart {
  merchantId: string | null;
  merchant: Merchant | null;
  items: CartItem[];
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
