'use client';

import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/searchService';
import { SearchQuery, SearchResult, AutocompleteResult } from '@/types/search';

/**
 * Hook for full-text search with TanStack Query
 */
export function useSearch(params: SearchQuery | null) {
  return useQuery<SearchResult>({
    queryKey: ['search', params],
    queryFn: () => searchService.search(params!),
    enabled: !!params?.q && params.q.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes (previously cacheTime)
  });
}

/**
 * Hook for autocomplete suggestions
 */
export function useAutocomplete(query: string) {
  return useQuery<AutocompleteResult[]>({
    queryKey: ['autocomplete', query],
    queryFn: () => searchService.autocomplete(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 2, // 2 minutes
  });
}
