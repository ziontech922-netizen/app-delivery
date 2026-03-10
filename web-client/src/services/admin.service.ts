import { api } from './api';

// ===========================================
// TYPES
// ===========================================

export interface DashboardStats {
  totalOrders: number;
  totalMerchants: number;
  totalUsers: number;
  totalRevenue: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  pendingMerchants: number;
  activeDrivers: number;
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface AdminMerchant {
  id: string;
  businessName: string;
  tradeName: string | null;
  document: string;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  city: string;
  state: string;
  isOpen: boolean;
  averageRating: number | null;
  totalReviews: number;
  createdAt: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: 'CUSTOMER' | 'MERCHANT' | 'DRIVER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  emailVerified: boolean;
  totalOrders: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  deliveryFee: number;
  createdAt: string;
  deliveredAt: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  merchant: {
    id: string;
    tradeName: string;
  };
  driver: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
  };
}

export interface AdminPayment {
  id: string;
  transactionId: string;
  orderId: string;
  amount: number;
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH' | 'WALLET';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  completedAt: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  merchant: {
    id: string;
    tradeName: string;
  };
  gatewayResponse: {
    cardLast4?: string;
    brand?: string;
    error?: string;
  } | null;
}

export interface AdminCoupon {
  id: string;
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  merchantId?: string | null;
  merchant?: {
    businessName: string;
  };
}

// ===========================================
// ADMIN SERVICE
// ===========================================

export const adminService = {
  // Dashboard
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/admin/stats');
    return response.data;
  },

  async getOrdersChart(period: 'week' | 'month' | 'year' = 'week'): Promise<ChartData> {
    const response = await api.get<ChartData>('/admin/charts/orders', {
      params: { period },
    });
    return response.data;
  },

  async getRevenueChart(period: 'week' | 'month' | 'year' = 'week'): Promise<ChartData> {
    const response = await api.get<ChartData>('/admin/charts/revenue', {
      params: { period },
    });
    return response.data;
  },

  // Merchants
  async getMerchants(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdminMerchant[]; total: number }> {
    const response = await api.get('/admin/merchants', { params });
    return response.data;
  },

  async approveMerchant(id: string): Promise<AdminMerchant> {
    const response = await api.patch<AdminMerchant>(`/admin/merchants/${id}/approve`);
    return response.data;
  },

  async suspendMerchant(id: string, reason: string): Promise<AdminMerchant> {
    const response = await api.patch<AdminMerchant>(`/admin/merchants/${id}/suspend`, { reason });
    return response.data;
  },

  async activateMerchant(id: string): Promise<AdminMerchant> {
    const response = await api.patch<AdminMerchant>(`/admin/merchants/${id}/activate`);
    return response.data;
  },

  // Users
  async getUsers(params?: {
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdminUser[]; total: number }> {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async suspendUser(id: string, reason: string): Promise<AdminUser> {
    const response = await api.patch<AdminUser>(`/admin/users/${id}/suspend`, { reason });
    return response.data;
  },

  async activateUser(id: string): Promise<AdminUser> {
    const response = await api.patch<AdminUser>(`/admin/users/${id}/activate`);
    return response.data;
  },

  async changeUserRole(id: string, role: string): Promise<AdminUser> {
    const response = await api.patch<AdminUser>(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  // Orders
  async getOrders(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdminOrder[]; total: number }> {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  async cancelOrder(id: string, reason: string): Promise<AdminOrder> {
    const response = await api.patch<AdminOrder>(`/admin/orders/${id}/cancel`, { reason });
    return response.data;
  },

  // Payments
  async getPayments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdminPayment[]; total: number }> {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },

  async refundPayment(id: string, reason: string): Promise<AdminPayment> {
    const response = await api.post<AdminPayment>(`/admin/payments/${id}/refund`, { reason });
    return response.data;
  },

  // Coupons
  async getCoupons(params?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdminCoupon[]; total: number }> {
    const response = await api.get('/coupons', { params });
    // Wrap in expected format if needed
    if (Array.isArray(response.data)) {
      return { data: response.data, total: response.data.length };
    }
    return response.data;
  },

  async createCoupon(data: Partial<AdminCoupon>): Promise<AdminCoupon> {
    const response = await api.post<AdminCoupon>('/coupons', data);
    return response.data;
  },

  async updateCoupon(id: string, data: Partial<AdminCoupon>): Promise<AdminCoupon> {
    const response = await api.put<AdminCoupon>(`/coupons/${id}`, data);
    return response.data;
  },

  async deleteCoupon(id: string): Promise<void> {
    await api.delete(`/coupons/${id}`);
  },
};
