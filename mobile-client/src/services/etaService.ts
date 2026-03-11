import api from '../config/api';

// =============================================
// TYPES
// =============================================

export interface MerchantEtaResult {
  merchantId: string;
  merchantName: string;
  estimatedDeliveryMinutes: number;
  deliveryRange: {
    min: number;
    max: number;
  };
  preparationTimeMinutes: number;
  deliveryTimeMinutes: number;
  distanceKm: number;
  isOpen: boolean;
  displayTime: string;
}

export interface OrderEtaResult {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  estimatedDeliveryTime: string | null;
  remainingMinutes: number | null;
  displayRemaining: string | null;
  breakdown: {
    preparationRemaining: number;
    deliveryRemaining: number;
  } | null;
  driverLocation: {
    latitude: number;
    longitude: number;
    distanceToDestinationKm: number;
  } | null;
  lastUpdated: string;
}

export interface EtaCalculationResult {
  estimatedDeliveryMinutes: number;
  estimatedDeliveryTime: string;
  displayTime: string;
  displayTotal: string;
  breakdown: {
    preparationTimeMinutes: number;
    driverToMerchantMinutes: number;
    merchantToCustomerMinutes: number;
    totalMinutes: number;
    totalRange: {
      min: number;
      max: number;
    };
  };
  distances: {
    driverToMerchantKm: number | null;
    merchantToCustomerKm: number;
    totalKm: number;
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: string[];
}

// =============================================
// SERVICE
// =============================================

export const etaService = {
  /**
   * Get ETA for a specific merchant
   */
  async getMerchantEta(
    merchantId: string,
    lat: number,
    lng: number,
  ): Promise<MerchantEtaResult> {
    const response = await api.get<MerchantEtaResult>(
      `/eta/merchant/${merchantId}`,
      { params: { lat, lng } },
    );
    return response.data;
  },

  /**
   * Get ETA for multiple merchants (bulk)
   */
  async getBulkMerchantEta(
    merchantIds: string[],
    lat: number,
    lng: number,
  ): Promise<MerchantEtaResult[]> {
    const response = await api.post<MerchantEtaResult[]>('/eta/merchants/bulk', {
      merchantIds,
      lat,
      lng,
    });
    return response.data;
  },

  /**
   * Calculate full ETA for delivery (before ordering)
   */
  async calculateEta(
    merchantId: string,
    customerLat: number,
    customerLng: number,
    driverLat?: number,
    driverLng?: number,
  ): Promise<EtaCalculationResult> {
    const response = await api.post<EtaCalculationResult>('/eta/calculate', {
      merchantId,
      customerLat,
      customerLng,
      driverLat,
      driverLng,
    });
    return response.data;
  },

  /**
   * Get live ETA for an order (during tracking)
   */
  async getOrderEta(orderId: string): Promise<OrderEtaResult> {
    const response = await api.get<OrderEtaResult>(`/eta/order/${orderId}`);
    return response.data;
  },

  /**
   * Calculate distance between two points
   */
  async calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): Promise<{ distanceKm: number; distanceMeters: number }> {
    const response = await api.get('/eta/distance', {
      params: { lat1, lng1, lat2, lng2 },
    });
    return response.data;
  },

  /**
   * Format minutes to display string
   */
  formatMinutes(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}min`;
  },

  /**
   * Format ETA range
   */
  formatRange(min: number, max: number): string {
    return `${min}-${max} min`;
  },
};

export default etaService;
