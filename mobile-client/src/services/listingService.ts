import { api } from '../config/api';
import type { 
  Listing, 
  ListingQuery, 
  CreateListingInput, 
  PaginatedResponse,
  ListingCategoryInfo,
  AiListingResponse,
} from '../types';

// ===========================================
// LISTINGS API
// ===========================================

export const listingService = {
  // Listar anúncios
  async getListings(query: ListingQuery = {}): Promise<PaginatedResponse<Listing>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get(`/listings?${params.toString()}`);
    return response.data;
  },

  // Obter anúncio por ID
  async getListing(id: string): Promise<Listing> {
    const response = await api.get(`/listings/${id}`);
    return response.data;
  },

  // Listar anúncios de um usuário por handle
  async getListingsByUserHandle(userHandle: string, page = 1, limit = 20): Promise<PaginatedResponse<Listing>> {
    const response = await api.get(`/listings/user/${userHandle}?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Criar anúncio
  async createListing(data: CreateListingInput): Promise<Listing> {
    const response = await api.post('/listings', data);
    return response.data;
  },

  // Atualizar anúncio
  async updateListing(id: string, data: Partial<CreateListingInput>): Promise<Listing> {
    const response = await api.put(`/listings/${id}`, data);
    return response.data;
  },

  // Remover anúncio
  async deleteListing(id: string): Promise<void> {
    await api.delete(`/listings/${id}`);
  },

  // Obter categorias com contagem
  async getCategories(): Promise<ListingCategoryInfo[]> {
    const response = await api.get('/listings/categories');
    return response.data;
  },

  // Obter estatísticas
  async getStats(city?: string): Promise<{ total: number; byCategory: { category: string; count: number }[] }> {
    const url = city ? `/listings/stats?city=${city}` : '/listings/stats';
    const response = await api.get(url);
    return response.data;
  },

  // ===========================================
  // FAVORITES
  // ===========================================

  // Listar favoritos do usuário
  async getMyFavorites(page = 1, limit = 20): Promise<PaginatedResponse<Listing>> {
    const response = await api.get(`/listings/favorites/my?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Adicionar aos favoritos
  async addFavorite(listingId: string): Promise<void> {
    await api.post(`/listings/${listingId}/favorite`);
  },

  // Remover dos favoritos
  async removeFavorite(listingId: string): Promise<void> {
    await api.delete(`/listings/${listingId}/favorite`);
  },

  // ===========================================
  // AI LISTING
  // ===========================================

  // Criar anúncio a partir de texto (IA)
  async createFromText(text: string, images?: string[], city?: string, state?: string): Promise<AiListingResponse> {
    const response = await api.post('/ai-listing/text', { text, images, city, state });
    return response.data;
  },

  // Criar anúncio a partir de áudio (IA)
  async createFromAudio(audioUrl: string, images?: string[], city?: string, state?: string): Promise<AiListingResponse> {
    const response = await api.post('/ai-listing/audio', { audioUrl, images, city, state });
    return response.data;
  },

  // Preview da extração de dados (sem criar anúncio)
  async previewExtraction(text: string): Promise<{ preview: boolean; extraction: AiListingResponse['aiExtraction'] }> {
    const response = await api.post('/ai-listing/preview', { text });
    return response.data;
  },
};

export default listingService;
