import { api } from '../config/api';
import type { 
  FeedItem, 
  FeedItemType,
  PaginatedResponse,
} from '../types';

// ===========================================
// COMMUNITY FEED API
// ===========================================

export interface FeedQuery {
  city?: string;
  state?: string;
  type?: FeedItemType;
  latitude?: number;
  longitude?: number;
  page?: number;
  limit?: number;
}

export const feedService = {
  // Obter feed da comunidade
  async getFeed(query: FeedQuery = {}): Promise<PaginatedResponse<FeedItem>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get(`/feed?${params.toString()}`);
    return response.data;
  },

  // Obter feed personalizado (baseado na localização do usuário)
  async getPersonalizedFeed(query: FeedQuery = {}): Promise<PaginatedResponse<FeedItem>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get(`/feed/personalized?${params.toString()}`);
    return response.data;
  },
};

export default feedService;
