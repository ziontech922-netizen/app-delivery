import api from './api';
import type { Merchant, PaginatedResponse } from '@/types';

export interface MerchantQueryParams {
  page?: number;
  limit?: number;
  city?: string;
  isOpen?: boolean;
}

export interface CreateMerchantDto {
  businessName: string;
  tradeName?: string;
  document: string;
  description?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  minimumOrder?: number;
  deliveryFee?: number;
  estimatedTime?: number;
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

  async create(data: CreateMerchantDto): Promise<Merchant> {
    const response = await api.post<Merchant>('/merchants', data);
    return response.data;
  },
};

export default merchantService;
