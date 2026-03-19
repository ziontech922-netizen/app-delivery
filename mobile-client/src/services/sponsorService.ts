import { api } from '../config/api';
import type { Sponsor, SponsorPlacement } from '../types';

// ===========================================
// SPONSORS API
// ===========================================

export const sponsorService = {
  // Obter patrocinadores por posição
  async getByPlacement(placement: SponsorPlacement, city?: string, category?: string): Promise<Sponsor[]> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (category) params.append('category', category);
    
    const url = `/sponsors/placement/${placement}?${params.toString()}`;
    const response = await api.get(url);
    return response.data;
  },

  // Registrar clique em patrocinador
  async recordClick(sponsorId: string): Promise<void> {
    await api.post(`/sponsors/${sponsorId}/click`);
  },
};

export default sponsorService;
