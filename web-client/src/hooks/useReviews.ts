'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  reviewsService,
  CreateReviewPayload,
  MerchantReviewsResponse,
  DriverReviewsResponse,
  Review,
} from '@/services/reviews.service';

// Query keys
export const reviewsKeys = {
  all: ['reviews'] as const,
  merchant: (id: string) => [...reviewsKeys.all, 'merchant', id] as const,
  driver: (id: string) => [...reviewsKeys.all, 'driver', id] as const,
  canReview: (orderId: string) => [...reviewsKeys.all, 'canReview', orderId] as const,
};

/**
 * Hook to get merchant reviews
 */
export function useMerchantReviews(merchantId: string, page = 1, limit = 10) {
  return useQuery<MerchantReviewsResponse>({
    queryKey: [...reviewsKeys.merchant(merchantId), page, limit],
    queryFn: () => reviewsService.getMerchantReviews(merchantId, page, limit),
    enabled: !!merchantId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get driver reviews
 */
export function useDriverReviews(driverId: string, page = 1, limit = 10) {
  return useQuery<DriverReviewsResponse>({
    queryKey: [...reviewsKeys.driver(driverId), page, limit],
    queryFn: () => reviewsService.getDriverReviews(driverId, page, limit),
    enabled: !!driverId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to check if can review an order
 */
export function useCanReviewOrder(orderId: string) {
  return useQuery<boolean>({
    queryKey: reviewsKeys.canReview(orderId),
    queryFn: () => reviewsService.canReviewOrder(orderId),
    enabled: !!orderId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create a review
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, CreateReviewPayload>({
    mutationFn: (payload) => reviewsService.createReview(payload),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: reviewsKeys.all });
      
      // Invalidate the can-review check for this order
      queryClient.invalidateQueries({
        queryKey: reviewsKeys.canReview(data.orderId),
      });
    },
  });
}
