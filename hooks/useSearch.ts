import { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import type { SearchEntity, SearchResult, SearchResponse } from '@/types/search';

interface UseSearchOptions {
  types?: SearchEntity[];
  limit?: number;
  page?: number;
}

interface UseSearchResult {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  total: number;
  facets: Record<SearchEntity, number> | null;
  search: (query: string) => void;
  clear: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

const VALID_TYPES: SearchEntity[] = ['exposant', 'produit', 'evenement', 'post', 'espace'];

export function useSearch(options: UseSearchOptions = {}): UseSearchResult {
  const { types, limit = 10 } = options;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<Record<SearchEntity, number> | null>(null);
  const [page, setPage] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const executeSearch = useCallback(async (searchQuery: string, searchPage: number, append: boolean) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      setFacets(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const searchTypes = types && types.length > 0 ? types : VALID_TYPES;

      const { data: results, error: searchError } = await supabaseClient.rpc('search_all' as any, {
        search_query: searchQuery,
        result_types: searchTypes,
        result_limit: limit,
        result_offset: searchPage * limit,
      });

      if (searchError) throw new Error(`Search failed: ${searchError.message}`);

      const { data: counts } = await supabaseClient.rpc('search_count' as any, {
        search_query: searchQuery,
        result_types: searchTypes,
      });

      const facetsMap = Object.fromEntries(VALID_TYPES.map((t) => [t, 0])) as Record<SearchEntity, number>;
      if (counts && Array.isArray(counts)) {
        for (const row of counts as Array<{ entity_type: string; count: number }>) {
          if (VALID_TYPES.includes(row.entity_type as SearchEntity)) {
            facetsMap[row.entity_type as SearchEntity] = row.count;
          }
        }
      }

      const totalCount = Object.values(facetsMap).reduce((a, b) => a + b, 0);

      const mapped: SearchResult[] = (results || []).map((r: Record<string, unknown>) => ({
        entity_type: r.entity_type as SearchEntity,
        entity_id: r.entity_id as string,
        title: r.title as string,
        description: r.description as string | null,
        url: r.url as string,
        metadata: r.metadata as Record<string, unknown>,
        rank: r.rank as number,
      }));

      if (append) {
        setResults((prev) => [...prev, ...mapped]);
      } else {
        setResults(mapped);
      }
      setTotal(totalCount);
      setFacets(facetsMap);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [limit, types]);

  const search = useCallback((newQuery: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery(newQuery);
    setPage(0);

    debounceRef.current = setTimeout(() => {
      executeSearch(newQuery, 0, false);
    }, 300);
  }, [executeSearch]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setTotal(0);
    setFacets(null);
    setPage(0);
    abortRef.current?.abort();
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    executeSearch(query, nextPage, true);
  }, [page, query, executeSearch]);

  const hasMore = results.length < total;

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return {
    results,
    loading,
    error,
    total,
    facets,
    search,
    clear,
    loadMore,
    hasMore,
  };
}
