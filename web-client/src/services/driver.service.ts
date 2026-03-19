import api from './api';

// Types
export interface Driver {
  id: string;
  email: string;
  name: string;
  phone: string;
  cpf?: string;
  avatarUrl: string | null;
  vehicleType: 'MOTORCYCLE' | 'BICYCLE' | 'CAR';
  vehiclePlate: string | null;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  isVerified: boolean;
  rating: number;
  totalDeliveries: number;
  createdAt: string;
}

export interface DeliveryOrder {
  id: string;
  status: string;
  restaurant: {
    id: string;
    name: string;
    phone?: string;
    address: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      latitude?: number;
      longitude?: number;
    };
  };
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
  deliveryAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryFee: number;
  total: number;
  createdAt: string;
  estimatedDeliveryTime?: string;
  distance?: number;
}

export interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalEarnings: number;
  totalDeliveries: number;
  averagePerDelivery: number;
}

export interface DailyEarnings {
  date: string;
  amount: number;
  deliveries: number;
}

export interface DeliveryHistory {
  id: string;
  orderId: string;
  restaurantName: string;
  customerName: string;
  deliveryFee: number;
  status: string;
  completedAt: string;
  rating?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export const driverService = {
  // Get driver profile
  async getProfile(): Promise<Driver> {
    const response = await api.get('/drivers/me');
    return response.data;
  },

  // Update driver profile
  async updateProfile(data: Partial<Driver>): Promise<Driver> {
    const response = await api.patch('/drivers/me', data);
    return response.data;
  },

  // Update driver status
  async updateStatus(status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'): Promise<Driver> {
    const response = await api.patch('/drivers/me/status', { status });
    return response.data;
  },

  // Get available orders
  async getAvailableOrders(params?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<DeliveryOrder[]> {
    const response = await api.get('/deliveries/available', { params });
    return response.data;
  },

  // Accept an order
  async acceptOrder(orderId: string): Promise<DeliveryOrder> {
    const response = await api.post(`/deliveries/${orderId}/accept`);
    return response.data;
  },

  // Get current active delivery
  async getCurrentDelivery(): Promise<DeliveryOrder | null> {
    try {
      const response = await api.get('/deliveries/current');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Update delivery status
  async updateDeliveryStatus(
    orderId: string,
    status: 'PICKED_UP' | 'DELIVERED',
    data?: { signature?: string; photo?: string }
  ): Promise<DeliveryOrder> {
    const response = await api.patch(`/deliveries/${orderId}/status`, {
      status,
      ...data,
    });
    return response.data;
  },

  // Confirm pickup
  async confirmPickup(orderId: string): Promise<DeliveryOrder> {
    return this.updateDeliveryStatus(orderId, 'PICKED_UP');
  },

  // Confirm delivery
  async confirmDelivery(
    orderId: string,
    data?: { signature?: string; photo?: string }
  ): Promise<DeliveryOrder> {
    return this.updateDeliveryStatus(orderId, 'DELIVERED', data);
  },

  // Cancel delivery
  async cancelDelivery(orderId: string, reason: string): Promise<DeliveryOrder> {
    const response = await api.post(`/deliveries/${orderId}/cancel`, { reason });
    return response.data;
  },

  // Get delivery history
  async getDeliveryHistory(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<DeliveryHistory>> {
    const response = await api.get('/deliveries/history', { params });
    return response.data;
  },

  // Get earnings summary
  async getEarningsSummary(): Promise<EarningsSummary> {
    const response = await api.get('/drivers/me/earnings/summary');
    return response.data;
  },

  // Get daily earnings
  async getDailyEarnings(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<DailyEarnings[]> {
    const response = await api.get('/drivers/me/earnings/daily', { params });
    return response.data;
  },

  // Get driver stats
  async getStats(): Promise<{
    totalDeliveries: number;
    completedToday: number;
    averageRating: number;
    onlineHours: number;
  }> {
    const response = await api.get('/drivers/me/stats');
    return response.data;
  },
};

export default driverService;
