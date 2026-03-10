import { api } from './api';

export interface ApplyCouponParams {
  code: string;
  merchantId: string;
  subtotal: number;
}

export interface ApplyCouponResponse {
  valid: boolean;
  error?: string;
  code?: string;
  type?: 'PERCENT' | 'FIXED';
  discount?: number;
  newTotal?: number;
  description?: string;
}

export interface CouponInfo {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  description?: string;
  minOrderValue?: number;
  maxDiscount?: number;
  merchantId?: string;
  expiresAt?: string;
}

export const couponService = {
  /**
   * Validate coupon and calculate discount
   */
  async validate(params: ApplyCouponParams): Promise<ApplyCouponResponse> {
    const response = await api.post<ApplyCouponResponse>('/coupons/validate', params);
    return response.data;
  },

  /**
   * Get coupon info by code (public)
   */
  async getByCode(code: string): Promise<CouponInfo> {
    const response = await api.get<CouponInfo>(`/coupons/code/${encodeURIComponent(code)}`);
    return response.data;
  },
};
