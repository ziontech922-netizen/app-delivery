import { api } from './api';

// Types
export interface Review {
  id: string;
  orderId: string;
  merchantRating: number;
  driverRating: number | null;
  merchantComment: string | null;
  driverComment: string | null;
  createdAt: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface MerchantReviewsResponse {
  reviews: Review[];
  averageRating: number | null;
  totalReviews: number;
  distribution: RatingDistribution;
}

export interface DriverReviewsResponse {
  reviews: Review[];
  averageRating: number | null;
  totalReviews: number;
  distribution: RatingDistribution;
}

export interface CreateReviewPayload {
  orderId: string;
  merchantRating: number;
  driverRating?: number;
  merchantComment?: string;
  driverComment?: string;
}

export interface CanReviewResponse {
  canReview: boolean;
}

class ReviewsService {
  /**
   * Create a review for an order
   */
  async createReview(payload: CreateReviewPayload): Promise<Review> {
    const response = await api.post<Review>('/reviews', payload);
    return response.data;
  }

  /**
   * Get reviews for a merchant
   */
  async getMerchantReviews(
    merchantId: string,
    page = 1,
    limit = 10
  ): Promise<MerchantReviewsResponse> {
    const response = await api.get<MerchantReviewsResponse>(
      `/reviews/merchant/${merchantId}`,
      { params: { page, limit } }
    );
    return response.data;
  }

  /**
   * Get reviews for a driver
   */
  async getDriverReviews(
    driverId: string,
    page = 1,
    limit = 10
  ): Promise<DriverReviewsResponse> {
    const response = await api.get<DriverReviewsResponse>(
      `/reviews/driver/${driverId}`,
      { params: { page, limit } }
    );
    return response.data;
  }

  /**
   * Check if customer can review an order
   */
  async canReviewOrder(orderId: string): Promise<boolean> {
    const response = await api.get<CanReviewResponse>(
      `/reviews/order/${orderId}/can-review`
    );
    return response.data.canReview;
  }
}

export const reviewsService = new ReviewsService();
