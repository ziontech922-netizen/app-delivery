// Search types matching backend DTOs

export interface SearchMerchantResult {
  id: string;
  name: string;
  tradeName: string | null;
  logoUrl: string | null;
  isOpen: boolean;
  rating: number | null;
  reviewCount: number;
  deliveryFee: number;
  estimatedTime: string | null;
  distance?: number;
}

export interface SearchProductResult {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  merchantId: string;
  merchantName: string;
  merchantLogoUrl: string | null;
  isAvailable: boolean;
}

export interface SearchResult {
  merchants: SearchMerchantResult[];
  products: SearchProductResult[];
  totalMerchants: number;
  totalProducts: number;
  query: string;
}

export interface AutocompleteResult {
  type: 'merchant' | 'product';
  id: string;
  text: string;
  subtext: string | null;
  imageUrl: string | null;
}

export interface SearchQuery {
  q: string;
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
}
