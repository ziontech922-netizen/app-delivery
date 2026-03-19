import api from '../config/api';

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
}

export const platformFeeService = {
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
        return null; // Nenhuma taxa aplicável
      }
      return response.data;
    } catch {
      return null;
    }
  },
};
