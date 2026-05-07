import { useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Exposant = Database['public']['Tables']['exposants']['Row'];

interface UseExposantsOptions {
  search?: string;
  secteur?: string;
  pavillon?: string;
  pays?: string;
  page?: number;
  pageSize?: number;
}

const PAGE_SIZE = 20;

export function useExposants(options: UseExposantsOptions = {}) {
  const { search = '', secteur = '', pavillon = '', pays = '', page = 0, pageSize = PAGE_SIZE } = options;
  const [exposants, setExposants] = useState<Exposant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [filters, setFilters] = useState<{ secteurs: string[]; pavillons: string[]; pays: string[] }>({
    secteurs: [],
    pavillons: [],
    pays: [],
  });

  useEffect(() => {
    let mounted = true;

    const fetchExposants = async () => {
      try {
        let query = supabaseClient.from('exposants').select('*', { count: 'exact' });

        if (search.trim()) {
          query = query.or(
            `nom.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`
          );
        }
        if (secteur) {
          query = query.eq('secteur', secteur);
        }
        if (pavillon) {
          query = query.eq('pavillon', pavillon);
        }
        if (pays) {
          query = query.eq('pays', pays);
        }

        const { data, error, count } = await query
          .order('is_featured', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (mounted) {
          setExposants(data || []);
          setTotalCount(count);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchExposants();
    return () => {
      mounted = false;
    };
  }, [search, secteur, pavillon, pays, page, pageSize]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const { data } = await supabaseClient
        .from('exposants')
        .select('secteur, pavillon, pays')
        .limit(500);

      if (data) {
        setFilters({
          secteurs: Array.from(
            new Set(data.map((e) => e.secteur).filter((value): value is string => Boolean(value)))
          ),
          pavillons: Array.from(
            new Set(data.map((e) => e.pavillon).filter((value): value is string => Boolean(value)))
          ),
          pays: Array.from(
            new Set(data.map((e) => e.pays).filter((value): value is string => Boolean(value)))
          ),
        });
      }
    };
    fetchFilterOptions();
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setExposants([]);
    setLoading(true);
  }, []);

  return { exposants, loading, error, filterOptions: filters, totalCount, page, pageSize, goToPage };
}
