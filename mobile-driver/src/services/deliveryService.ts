import api from '../config/api';
import { DeliveryOrder, EarningsSummary, DailyEarnings, DeliveryHistory } from '../types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export const deliveryService = {
  // Get available orders for driver
  async getAvailableOrders(params?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<DeliveryOrder[]> {
    const response = await api.get<DeliveryOrder[]>('/deliveries/available', { params });
    return response.data;
  },

  // Accept an order
  async acceptOrder(orderId: string): Promise<DeliveryOrder> {
    const response = await api.post<DeliveryOrder>(`/deliveries/${orderId}/accept`);
    return response.data;
  },

  // Get current active delivery
  async getCurrentDelivery(): Promise<DeliveryOrder | null> {
    try {
      const response = await api.get<DeliveryOrder>('/deliveries/current');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Update delivery status
  async updateStatus(
    orderId: string,
    status: 'PICKED_UP' | 'DELIVERED',
    data?: { signature?: string; photo?: string }
  ): Promise<DeliveryOrder> {
    const response = await api.patch<DeliveryOrder>(`/deliveries/${orderId}/status`, {
      status,
      ...data,
    });
    return response.data;
  },

  // Confirm pickup from restaurant
  async confirmPickup(orderId: string): Promise<DeliveryOrder> {
    return this.updateStatus(orderId, 'PICKED_UP');
  },

  // Confirm delivery to customer
  async confirmDelivery(
    orderId: string,
    data?: { signature?: string; photo?: string }
  ): Promise<DeliveryOrder> {
    return this.updateStatus(orderId, 'DELIVERED', data);
  },

  // Cancel delivery (driver side)
  async cancelDelivery(orderId: string, reason: string): Promise<DeliveryOrder> {
    const response = await api.post<DeliveryOrder>(`/deliveries/${orderId}/cancel`, { reason });
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
    const response = await api.get<EarningsSummary>('/drivers/me/earnings/summary');
    return response.data;
  },

  // Get daily earnings
  async getDailyEarnings(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<DailyEarnings[]> {
    const response = await api.get<DailyEarnings[]>('/drivers/me/earnings/daily', { params });
    return response.data;
  },

  // Update driver location
  async updateLocation(latitude: number, longitude: number): Promise<void> {
    await api.post('/drivers/me/location', { latitude, longitude });
  },
};

export default deliveryService;
