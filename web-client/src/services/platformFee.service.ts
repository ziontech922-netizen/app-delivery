import api from './api';

export interface PlatformFee {
  id: string;
  name: string;
  description: string | null;
  percentage: number | null;
  fixedFee: number | null;
  deliveryFee: number | null;
  merchantId: string | null;
  merchantName?: string;
  minOrderValue: number | null;
  maxFee: number | null;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformFeeDto {
  name: string;
  description?: string;
  percentage?: number;
  fixedFee?: number;
  deliveryFee?: number;
  merchantId?: string;
  minOrderValue?: number;
  maxFee?: number;
  isActive?: boolean;
  priority?: number;
}

export interface UpdatePlatformFeeDto {
  name?: string;
  description?: string;
  percentage?: number;
  fixedFee?: number;
  deliveryFee?: number;
  merchantId?: string;
  minOrderValue?: number;
  maxFee?: number;
  isActive?: boolean;
  priority?: number;
}

export interface FeePreview {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  platformFee: number;
  discount: number;
  total: number;
  merchantNet: number;
  breakdown: {
    percentageFee: number;
    fixedFee: number;
    platformDeliveryFee: number;
  };
}

export const platformFeeService = {
  /**
   * Lista todas as taxas (admin)
   */
  async getAll(filters?: {
    isActive?: boolean;
    merchantId?: string;
  }): Promise<PlatformFee[]> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) {
      params.append('isActive', String(filters.isActive));
    }
    if (filters?.merchantId) {
      params.append('merchantId', filters.merchantId);
    }
    const response = await api.get<PlatformFee[]>(`/platform-fees?${params}`);
    return response.data;
  },

  /**
   * Busca taxa por ID
   */
  async getById(id: string): Promise<PlatformFee> {
    const response = await api.get<PlatformFee>(`/platform-fees/${id}`);
    return response.data;
  },

  /**
   * Cria nova taxa
   */
  async create(data: CreatePlatformFeeDto): Promise<PlatformFee> {
    const response = await api.post<PlatformFee>('/platform-fees', data);
    return response.data;
  },

  /**
   * Atualiza taxa
   */
  async update(id: string, data: UpdatePlatformFeeDto): Promise<PlatformFee> {
    const response = await api.put<PlatformFee>(`/platform-fees/${id}`, data);
    return response.data;
  },

  /**
   * Desativa taxa (soft delete)
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/platform-fees/${id}`);
  },

  /**
   * Remove taxa permanentemente
   */
  async hardDelete(id: string): Promise<void> {
    await api.delete(`/platform-fees/${id}/permanent`);
  },

  /**
   * Preview das taxas para um pedido
   */
  async previewFees(
    merchantId: string,
    subtotal: number,
    deliveryFee: number,
    discount: number = 0,
  ): Promise<FeePreview> {
    const response = await api.get<FeePreview>(
      `/platform-fees/preview/${merchantId}`,
      {
        params: { subtotal, deliveryFee, discount },
      },
    );
    return response.data;
  },

  /**
   * Busca taxa aplicável para um merchant
   */
  async getApplicableFee(merchantId: string): Promise<PlatformFee | null> {
    try {
      const response = await api.get(`/platform-fees/applicable/${merchantId}`);
      if (response.data.message) {
        return null;
      }
      return response.data;
    } catch {
      return null;
    }
  },
};
