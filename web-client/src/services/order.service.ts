import api from './api';
import type { Order, CreateOrderRequest, PaginatedResponse, Address } from '@/types';

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const orderService = {
  async create(data: CreateOrderRequest): Promise<Order> {
    const response = await api.post<Order>('/orders', data);
    return response.data;
  },

  async list(params?: OrderQueryParams): Promise<PaginatedResponse<Order>> {
    const response = await api.get<PaginatedResponse<Order>>('/orders', { params });
    return response.data;
  },

  async getById(id: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  async cancel(id: string, reason?: string): Promise<Order> {
    const response = await api.post<Order>(`/orders/${id}/cancel`, { reason });
    return response.data;
  },
};

export const addressService = {
  async list(): Promise<Address[]> {
    const response = await api.get<Address[]>('/users/me/addresses');
    return response.data;
  },

  async create(data: Omit<Address, 'id' | 'userId'>): Promise<Address> {
    const response = await api.post<Address>('/users/me/addresses', data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/me/addresses/${id}`);
  },
};

export default orderService;
