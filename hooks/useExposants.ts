import { useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Exposant = Database['public']['Tables']['exposants']['Row'];

interface Espace {
  id: string;
  code: string;
  nom: string;
  type: string;
}

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
  const [filters, setFilters] = useState<{ secteurs: string[]; pavillons: string[]; pays: string[]; espaces: Espace[] }>({
    secteurs: [],
    pavillons: [],
    pays: [],
    espaces: [],
  });

  useEffect(() => {
    let mounted = true;

    const fetchExposants = async () => {
      try {
        let query = supabaseClient.from('exposants').select('*, profiles!exposants_profile_id_fkey(subscription_tier, account_status)', { count: 'exact' });

        const { data: sessionData } = await supabaseClient.auth.getSession();
        const myId = sessionData?.session?.user?.id;

        // IDs à exclure : bloqués + suspendus/bloqués
        const excludeIds = new Set<string>();

        if (myId) {
          const { data: blocks } = await supabaseClient
            .from('blocked_users')
            .select('blocker_id, blocked_id')
            .or(`blocker_id.eq.${myId},blocked_id.eq.${myId}`);

          if (blocks && blocks.length > 0) {
            blocks.forEach(b => {
              const id = b.blocker_id === myId ? b.blocked_id : b.blocker_id;
              if (id) excludeIds.add(id);
            });
          }
        }

        // Exclure les comptes suspendus ou bloqués
        const { data: inactiveProfiles } = await supabaseClient
          .from('profiles')
          .select('id')
          .in('account_status', ['suspended', 'blocked']);

        if (inactiveProfiles) {
          inactiveProfiles.forEach(p => excludeIds.add(p.id));
        }

        if (excludeIds.size > 0) {
          query = query.not('profile_id', 'in', `(${Array.from(excludeIds).join(',')})`);
        }

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
      const [secteursRes, pavillonsRes, paysRes, espData] = await Promise.all([
        supabaseClient.from('exposants').select('secteur').not('secteur', 'is', null).limit(200),
        supabaseClient.from('exposants').select('pavillon').not('pavillon', 'is', null).limit(200),
        supabaseClient.from('exposants').select('pays').not('pays', 'is', null).limit(200),
        supabaseClient.from('espaces').select('id, code, nom, type').order('sort_order', { ascending: true }),
      ]);

      const unique = (arr: ({ [key: string]: string | null } | null)[] | null, key: string): string[] =>
        Array.from(new Set((arr || []).map((e) => e?.[key]).filter((v): v is string => Boolean(v))));

      setFilters({
        secteurs: unique(secteursRes.data, 'secteur'),
        pavillons: unique(pavillonsRes.data, 'pavillon'),
        pays: unique(paysRes.data, 'pays'),
        espaces: (espData.data || []) as Espace[],
      });
    };
    fetchFilterOptions();
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setExposants([]);
    setLoading(true);
  }, []);

  return { exposants, loading, error, filterOptions: filters, totalCount, page, pageSize, goToPage };
}
