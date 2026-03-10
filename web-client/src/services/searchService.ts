import { api } from './api';
import { SearchResult, AutocompleteResult, SearchQuery } from '@/types/search';

export const searchService = {
  /**
   * Full-text search for merchants and products
   */
  async search(params: SearchQuery): Promise<SearchResult> {
    const response = await api.get<SearchResult>('/search', { params });
    return response.data;
  },

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(q: string, limit = 8): Promise<AutocompleteResult[]> {
    if (!q || q.length < 2) {
      return [];
    }
    const response = await api.get<AutocompleteResult[]>('/search/autocomplete', {
      params: { q, limit },
    });
    return response.data;
  },
};
