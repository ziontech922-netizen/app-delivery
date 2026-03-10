import api from './api';
import type { Merchant, PaginatedResponse } from '@/types';

export interface MerchantQueryParams {
  page?: number;
  limit?: number;
  city?: string;
  isOpen?: boolean;
}

export const merchantService = {
  async list(params?: MerchantQueryParams): Promise<PaginatedResponse<Merchant>> {
    const response = await api.get<PaginatedResponse<Merchant>>('/merchants', { params });
    return response.data;
  },

  async getById(id: string): Promise<Merchant> {
    const response = await api.get<Merchant>(`/merchants/${id}`);
    return response.data;
  },
};

export default merchantService;
