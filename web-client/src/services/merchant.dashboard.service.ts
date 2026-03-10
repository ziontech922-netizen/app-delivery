import api from './api';

// ===========================================
// TYPES
// ===========================================

export interface MerchantProfile {
  id: string;
  businessName: string;
  tradeName: string | null;
  document: string;
  phone: string;
  email: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isOpen: boolean;
  averageRating: number | null;
  totalReviews: number;
  deliveryFee: number;
  minOrderValue: number;
  estimatedDeliveryTime: number;
  address: {
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  openingHours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
  }>;
  createdAt: string;
}

export interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  averageTicket: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedToday: number;
  cancelledToday: number;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    customerName: string;
    createdAt: string;
  }>;
}

export interface MerchantOrder {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  deliveryFee: number;
  subtotal: number;
  createdAt: string;
  acceptedAt: string | null;
  preparedAt: string | null;
  deliveredAt: string | null;
  estimatedDeliveryTime: number | null;
  notes: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  deliveryAddress: {
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    reference: string | null;
  };
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes: string | null;
  }>;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
}

export interface MerchantProduct {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
  preparationTime: number;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantCategory {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  createdAt?: string;
}

export interface AnalyticsData {
  period: string;
  revenue: {
    total: number;
    previousTotal: number;
    percentChange: number;
    daily: Array<{ date: string; value: number }>;
  };
  orders: {
    total: number;
    previousTotal: number;
    percentChange: number;
    byStatus: Record<string, number>;
    daily: Array<{ date: string; value: number }>;
  };
  averageTicket: {
    value: number;
    previousValue: number;
    percentChange: number;
  };
  averagePreparationTime: {
    value: number;
    previousValue: number;
    percentChange: number;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  ordersByHour: Array<{ hour: number; count: number }>;
  customerRetention: {
    newCustomers: number;
    returningCustomers: number;
    retentionRate: number;
  };
}

export interface MerchantReview {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  createdAt: string;
  repliedAt: string | null;
}

// ===========================================
// MERCHANT DASHBOARD SERVICE
// ===========================================

export const merchantDashboardService = {
  // Profile
  async getProfile(): Promise<MerchantProfile> {
    const response = await api.get<MerchantProfile>('/merchants/me');
    return response.data;
  },

  async updateProfile(data: Partial<MerchantProfile>): Promise<MerchantProfile> {
    const response = await api.patch<MerchantProfile>('/merchants/me', data);
    return response.data;
  },

  async toggleOpen(isOpen: boolean): Promise<MerchantProfile> {
    const response = await api.patch<MerchantProfile>('/merchants/me/toggle-open', { isOpen });
    return response.data;
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/merchants/me/dashboard');
    return response.data;
  },

  // Orders
  async getOrders(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: MerchantOrder[]; total: number; page: number; totalPages: number }> {
    const response = await api.get('/merchants/me/orders', { params });
    return response.data;
  },

  async getOrderById(orderId: string): Promise<MerchantOrder> {
    const response = await api.get<MerchantOrder>(`/merchants/me/orders/${orderId}`);
    return response.data;
  },

  async acceptOrder(orderId: string, estimatedTime?: number): Promise<MerchantOrder> {
    const response = await api.post<MerchantOrder>(`/merchants/me/orders/${orderId}/accept`, {
      estimatedTime,
    });
    return response.data;
  },

  async rejectOrder(orderId: string, reason: string): Promise<MerchantOrder> {
    const response = await api.post<MerchantOrder>(`/merchants/me/orders/${orderId}/reject`, {
      reason,
    });
    return response.data;
  },

  async markPreparing(orderId: string): Promise<MerchantOrder> {
    const response = await api.post<MerchantOrder>(`/merchants/me/orders/${orderId}/preparing`);
    return response.data;
  },

  async markReady(orderId: string): Promise<MerchantOrder> {
    const response = await api.post<MerchantOrder>(`/merchants/me/orders/${orderId}/ready`);
    return response.data;
  },

  // Products
  async getProducts(params?: {
    categoryId?: string;
    isAvailable?: boolean;
    search?: string;
  }): Promise<{ data: MerchantProduct[]; total: number; page: number; totalPages: number }> {
    const response = await api.get('/merchants/me/products', { params });
    return response.data;
  },

  async createProduct(data: {
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    categoryId: string;
    imageUrl?: string;
    isAvailable?: boolean;
    preparationTime?: number;
  }): Promise<MerchantProduct> {
    const response = await api.post<MerchantProduct>('/merchants/me/products', data);
    return response.data;
  },

  async updateProduct(
    productId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      originalPrice: number;
      categoryId: string;
      imageUrl: string;
      isAvailable: boolean;
      preparationTime: number;
      sortOrder: number;
    }>
  ): Promise<MerchantProduct> {
    const response = await api.patch<MerchantProduct>(`/merchants/me/products/${productId}`, data);
    return response.data;
  },

  async deleteProduct(productId: string): Promise<void> {
    await api.delete(`/merchants/me/products/${productId}`);
  },

  async toggleProductAvailability(productId: string, isAvailable: boolean): Promise<MerchantProduct> {
    const response = await api.patch<MerchantProduct>(`/merchants/me/products/${productId}`, {
      isAvailable,
    });
    return response.data;
  },

  // Categories
  async getCategories(): Promise<{ data: MerchantCategory[]; total: number; page: number; totalPages: number }> {
    const response = await api.get('/merchants/me/categories');
    return response.data;
  },

  async createCategory(data: {
    name: string;
    description?: string;
    imageUrl?: string;
  }): Promise<MerchantCategory> {
    const response = await api.post<MerchantCategory>('/merchants/me/categories', data);
    return response.data;
  },

  async updateCategory(
    categoryId: string,
    data: Partial<{
      name: string;
      description: string;
      imageUrl: string;
      isActive: boolean;
      sortOrder: number;
    }>
  ): Promise<MerchantCategory> {
    const response = await api.patch<MerchantCategory>(`/merchants/me/categories/${categoryId}`, data);
    return response.data;
  },

  async deleteCategory(categoryId: string): Promise<void> {
    await api.delete(`/merchants/me/categories/${categoryId}`);
  },

  // Analytics
  async getAnalytics(period: '7d' | '30d' | '90d'): Promise<AnalyticsData> {
    const periodMap = {
      '7d': 'week',
      '30d': 'month',
      '90d': 'year',
    } as const;
    const response = await api.get<AnalyticsData>('/merchants/me/analytics', { 
      params: { period: periodMap[period] } 
    });
    return response.data;
  },

  // Reviews
  async getReviews(params?: {
    rating?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: MerchantReview[]; total: number; page: number; totalPages: number; averageRating: number; totalReviews: number; ratingDistribution: Record<number, number> }> {
    const response = await api.get('/merchants/me/reviews', { params });
    return response.data;
  },

  async replyToReview(reviewId: string, reply: string): Promise<MerchantReview> {
    const response = await api.post<MerchantReview>(`/merchants/me/reviews/${reviewId}/reply`, {
      reply,
    });
    return response.data;
  },
};
