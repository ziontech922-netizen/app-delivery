import api from './api';
import type { Listing } from './listing.service';

// ===========================================
// FEED TYPES
// ===========================================

export type FeedItemType = 
  | 'NEW_LISTING'
  | 'PROMOTION'
  | 'NEW_MERCHANT'
  | 'SPONSORED'
  | 'ANNOUNCEMENT'
  | 'EVENT';

export interface FeedMerchant {
  id: string;
  tradeName: string;
  logoUrl: string | null;
  cuisineType: string | null;
  rating: number;
  deliveryTime: number;
}

export interface FeedSponsor {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
}

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  listing?: Listing;
  merchant?: FeedMerchant;
  sponsor?: FeedSponsor;
  createdAt: string;
}

export interface FeedQuery {
  city?: string;
  state?: string;
  type?: FeedItemType;
  latitude?: number;
  longitude?: number;
  page?: number;
  limit?: number;
}

export interface FeedResponse {
  data: FeedItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ===========================================
// FEED SERVICE
// ===========================================

export const feedService = {
  /**
   * Get community feed
   */
  async getFeed(query: FeedQuery = {}): Promise<FeedResponse> {
    const params = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const url = params.toString() ? `/feed?${params.toString()}` : '/feed';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get personalized feed based on user location and preferences
   */
  async getPersonalizedFeed(query: FeedQuery = {}): Promise<FeedResponse> {
    const params = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const url = params.toString() ? `/feed/personalized?${params.toString()}` : '/feed/personalized';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get feed items by type
   */
  async getFeedByType(type: FeedItemType, page = 1, limit = 20): Promise<FeedResponse> {
    const response = await api.get(`/feed?type=${type}&page=${page}&limit=${limit}`);
    return response.data;
  },

  /**
   * Get announcements
   */
  async getAnnouncements(page = 1, limit = 10): Promise<FeedResponse> {
    return this.getFeedByType('ANNOUNCEMENT', page, limit);
  },

  /**
   * Get promotions
   */
  async getPromotions(page = 1, limit = 10): Promise<FeedResponse> {
    return this.getFeedByType('PROMOTION', page, limit);
  },

  /**
   * Get new listings for feed
   */
  async getNewListings(page = 1, limit = 10): Promise<FeedResponse> {
    return this.getFeedByType('NEW_LISTING', page, limit);
  },

  /**
   * Get events
   */
  async getEvents(page = 1, limit = 10): Promise<FeedResponse> {
    return this.getFeedByType('EVENT', page, limit);
  },
};

export default feedService;
