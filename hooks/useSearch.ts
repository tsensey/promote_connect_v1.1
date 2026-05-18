import { useState, useEffect, useCallback, useRef } from 'react';
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
      const params = new URLSearchParams({
        q: searchQuery,
        page: String(searchPage),
        limit: String(limit),
      });
      if (types && types.length > 0) {
        params.set('types', types.join(','));
      }

      const res = await fetch(`/api/search?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Search failed');
      }

      const data: SearchResponse = await res.json();

      if (append) {
        setResults((prev) => [...prev, ...data.results]);
      } else {
        setResults(data.results);
      }
      setTotal(data.total);
      setFacets(data.facets.types as Record<SearchEntity, number>);
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
