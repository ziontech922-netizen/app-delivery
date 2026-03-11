import api from '../config/api';
import { Order, Review, Address, Coupon } from '../types';

export type { Order };

interface CreateOrderRequest {
  restaurantId: string;
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
  addressId: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH';
  couponCode?: string;
  notes?: string;
  changeFor?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export const orderService = {
  // Create new order
  async create(data: CreateOrderRequest): Promise<Order> {
    const response = await api.post<Order>('/orders', data);
    return response.data;
  },

  // Get user orders
  async getMyOrders(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>> {
    const response = await api.get('/orders/my', { params });
    return response.data;
  },

  // Get order by ID
  async getById(id: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // Alias for getById
  async getOrderById(id: string): Promise<Order> {
    return this.getById(id);
  },

  // Cancel order
  async cancel(id: string, reason?: string): Promise<Order> {
    const response = await api.post<Order>(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  // Submit review
  async submitReview(orderId: string, data: {
    rating: number;
    comment?: string;
  }): Promise<Review> {
    const response = await api.post<Review>(`/orders/${orderId}/review`, data);
    return response.data;
  },

  // Get order review
  async getReview(orderId: string): Promise<Review | null> {
    try {
      const response = await api.get<Review>(`/orders/${orderId}/review`);
      return response.data;
    } catch {
      return null;
    }
  },

  // Validate coupon
  async validateCoupon(code: string, restaurantId: string, subtotal: number): Promise<Coupon> {
    const response = await api.post<Coupon>('/coupons/validate', {
      code,
      restaurantId,
      subtotal,
    });
    return response.data;
  },

  // Get available coupons
  async getAvailableCoupons(restaurantId: string): Promise<Coupon[]> {
    const response = await api.get<Coupon[]>('/coupons/available', {
      params: { restaurantId },
    });
    return response.data;
  },
};

// Address service
export const addressService = {
  // Get user addresses
  async getMyAddresses(): Promise<Address[]> {
    const response = await api.get<Address[]>('/addresses/my');
    return response.data;
  },

  // Create address
  async create(data: Omit<Address, 'id'>): Promise<Address> {
    const response = await api.post<Address>('/addresses', data);
    return response.data;
  },

  // Update address
  async update(id: string, data: Partial<Address>): Promise<Address> {
    const response = await api.patch<Address>(`/addresses/${id}`, data);
    return response.data;
  },

  // Delete address
  async delete(id: string): Promise<void> {
    await api.delete(`/addresses/${id}`);
  },

  // Set default address
  async setDefault(id: string): Promise<Address> {
    const response = await api.post<Address>(`/addresses/${id}/default`);
    return response.data;
  },
};

export default orderService;
