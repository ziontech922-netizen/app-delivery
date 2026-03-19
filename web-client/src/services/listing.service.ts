import api from './api';

export interface Listing {
  id: string;
  userId: string;
  title: string;
  description?: string;
  price?: number;
  priceType: 'FIXED' | 'NEGOTIABLE' | 'FREE' | 'CONTACT';
  images: string[];
  audioUrl?: string;
  category: ListingCategory;
  subcategory?: string;
  tags: string[];
  city?: string;
  state?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  status: 'DRAFT' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REMOVED';
  viewCount: number;
  favoriteCount: number;
  isFeatured: boolean;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    userHandle?: string;
    avatarUrl?: string;
  };
}

export type ListingCategory =
  | 'PRODUCTS'
  | 'SERVICES'
  | 'VEHICLES'
  | 'REAL_ESTATE'
  | 'JOBS'
  | 'FOOD'
  | 'ELECTRONICS'
  | 'FASHION'
  | 'HOME_GARDEN'
  | 'SPORTS'
  | 'PETS'
  | 'OTHER';

export interface ListingQueryParams {
  page?: number;
  limit?: number;
  category?: ListingCategory;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  status?: string;
  sortBy?: 'createdAt' | 'price' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateListingDto {
  title: string;
  description?: string;
  price?: number;
  priceType?: 'FIXED' | 'NEGOTIABLE' | 'FREE' | 'CONTACT';
  images?: string[];
  audioUrl?: string;
  category: ListingCategory;
  subcategory?: string;
  tags?: string[];
  city?: string;
  state?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
}

export interface AiListingResponse {
  listing: Listing;
  aiExtraction: {
    title: string;
    description?: string;
    price?: number;
    priceType: string;
    category: string;
    subcategory?: string;
    tags: string[];
    confidence: number;
    rawInput: string;
  };
  transcription?: string;
}

export interface ListingResponse {
  data: Listing[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryStats {
  category: ListingCategory;
  count: number;
  label: string;
  icon: string;
}

export const listingService = {
  // Listar anúncios
  async list(params?: ListingQueryParams): Promise<ListingResponse> {
    const { data } = await api.get('/listings', { params });
    return data;
  },

  // Obter detalhes de um anúncio
  async getById(id: string): Promise<Listing> {
    const { data } = await api.get(`/listings/${id}`);
    return data;
  },

  // Criar anúncio diretamente
  async create(dto: CreateListingDto): Promise<Listing> {
    const { data } = await api.post('/listings', dto);
    return data;
  },

  // Criar anúncio a partir de texto (IA)
  async createFromText(
    text: string,
    images?: string[],
    city?: string,
    state?: string
  ): Promise<AiListingResponse> {
    const { data } = await api.post('/ai-listing/text', {
      text,
      images,
      city,
      state,
    });
    return data;
  },

  // Criar anúncio a partir de áudio (IA)
  async createFromAudio(
    audioUrl: string,
    images?: string[],
    city?: string,
    state?: string
  ): Promise<AiListingResponse> {
    const { data } = await api.post('/ai-listing/audio', {
      audioUrl,
      images,
      city,
      state,
    });
    return data;
  },

  // Preview extração de texto (sem criar)
  async previewText(text: string): Promise<{ preview: true; extraction: any }> {
    const { data } = await api.post('/ai-listing/preview', { text });
    return data;
  },

  // Atualizar anúncio
  async update(id: string, dto: Partial<CreateListingDto>): Promise<Listing> {
    const { data } = await api.put(`/listings/${id}`, dto);
    return data;
  },

  // Deletar anúncio
  async delete(id: string): Promise<void> {
    await api.delete(`/listings/${id}`);
  },

  // Meus anúncios
  async getMyListings(params?: ListingQueryParams): Promise<ListingResponse> {
    const { data } = await api.get('/listings/mine', { params });
    return data;
  },

  // Marcar como vendido
  async markAsSold(id: string): Promise<Listing> {
    const { data } = await api.post(`/listings/${id}/sold`);
    return data;
  },

  // Favoritar
  async favorite(id: string): Promise<void> {
    await api.post(`/listings/${id}/favorite`);
  },

  // Desfavoritar
  async unfavorite(id: string): Promise<void> {
    await api.delete(`/listings/${id}/favorite`);
  },

  // Meus favoritos
  async getMyFavorites(params?: ListingQueryParams): Promise<ListingResponse> {
    const { data } = await api.get('/listings/favorites', { params });
    return data;
  },

  // Obter estatísticas de categorias
  async getCategories(): Promise<CategoryStats[]> {
    const { data } = await api.get('/listings/categories');
    return data;
  },

  // Obter estatísticas gerais
  async getStats(city?: string): Promise<{
    totalListings: number;
    activeListings: number;
    categoryCounts: Record<string, number>;
  }> {
    const { data } = await api.get('/listings/stats', { params: { city } });
    return data;
  },
};

// Mapear categorias para labels e ícones
export const CATEGORY_INFO: Record<ListingCategory, { label: string; icon: string; color: string }> = {
  PRODUCTS: { label: 'Produtos', icon: 'Package', color: '#3B82F6' },
  SERVICES: { label: 'Serviços', icon: 'Wrench', color: '#8B5CF6' },
  VEHICLES: { label: 'Veículos', icon: 'Car', color: '#10B981' },
  REAL_ESTATE: { label: 'Imóveis', icon: 'Home', color: '#F59E0B' },
  JOBS: { label: 'Empregos', icon: 'Briefcase', color: '#EF4444' },
  FOOD: { label: 'Comida', icon: 'UtensilsCrossed', color: '#FF6B35' },
  ELECTRONICS: { label: 'Eletrônicos', icon: 'Smartphone', color: '#6366F1' },
  FASHION: { label: 'Moda', icon: 'Shirt', color: '#EC4899' },
  HOME_GARDEN: { label: 'Casa e Jardim', icon: 'Flower2', color: '#22C55E' },
  SPORTS: { label: 'Esportes', icon: 'Dumbbell', color: '#0EA5E9' },
  PETS: { label: 'Pets', icon: 'PawPrint', color: '#F97316' },
  OTHER: { label: 'Outros', icon: 'MoreHorizontal', color: '#6B7280' },
};

export default listingService;
