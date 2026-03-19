import api from './api';

// ===========================================
// SPONSOR TYPES
// ===========================================

export type SponsorPlacement = 
  | 'HOME_BANNER'
  | 'CATEGORY_HEADER'
  | 'FEED_INLINE'
  | 'SEARCH_RESULTS'
  | 'LISTING_DETAIL'
  | 'FEATURED_CAROUSEL';

export interface Sponsor {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
  placement: SponsorPlacement;
  category: string | null;
  city: string | null;
  priority: number;
  clickCount: number;
  impressionCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface SponsorResponse {
  data: Sponsor[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ===========================================
// SPONSOR SERVICE
// ===========================================

export const sponsorService = {
  /**
   * Get sponsors by placement
   */
  async getByPlacement(
    placement: SponsorPlacement,
    city?: string,
    category?: string
  ): Promise<Sponsor[]> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (category) params.append('category', category);

    const queryString = params.toString();
    const url = `/sponsors/placement/${placement}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data.data || response.data || [];
  },

  /**
   * Get home page banners
   */
  async getHomeBanners(city?: string): Promise<Sponsor[]> {
    return this.getByPlacement('HOME_BANNER', city);
  },

  /**
   * Get featured carousel sponsors
   */
  async getFeaturedCarousel(city?: string, category?: string): Promise<Sponsor[]> {
    return this.getByPlacement('FEATURED_CAROUSEL', city, category);
  },

  /**
   * Get feed inline sponsors
   */
  async getFeedSponsors(city?: string): Promise<Sponsor[]> {
    return this.getByPlacement('FEED_INLINE', city);
  },

  /**
   * Get category header sponsors
   */
  async getCategoryHeader(category: string, city?: string): Promise<Sponsor[]> {
    return this.getByPlacement('CATEGORY_HEADER', city, category);
  },

  /**
   * Get search results sponsors
   */
  async getSearchSponsors(city?: string, category?: string): Promise<Sponsor[]> {
    return this.getByPlacement('SEARCH_RESULTS', city, category);
  },

  /**
   * Get listing detail sponsors
   */
  async getListingDetailSponsors(category?: string): Promise<Sponsor[]> {
    return this.getByPlacement('LISTING_DETAIL', undefined, category);
  },

  /**
   * Record a click on a sponsor
   */
  async recordClick(sponsorId: string): Promise<void> {
    await api.post(`/sponsors/${sponsorId}/click`);
  },

  /**
   * Record an impression on a sponsor
   */
  async recordImpression(sponsorId: string): Promise<void> {
    try {
      await api.post(`/sponsors/${sponsorId}/impression`);
    } catch {
      // Silent fail for impressions
    }
  },

  /**
   * Get all active sponsors
   */
  async getAllActive(page = 1, limit = 20): Promise<SponsorResponse> {
    const response = await api.get(`/sponsors?page=${page}&limit=${limit}&active=true`);
    return response.data;
  },
};

export default sponsorService;
