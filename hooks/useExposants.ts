import { useQuery } from '@tanstack/react-query';
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

// ─── Fetcher des options de filtres ──────────────────────────────────────────
// Fusionné en 2 requêtes au lieu de 4 (secteur+pavillon+pays en une seule)
async function fetchFilterOptions() {
  const [filtersRes, espData] = await Promise.all([
    // Une seule requête pour tous les filtres textuels
    supabaseClient
      .from('exposants')
      .select('secteur, pavillon, pays')
      .not('secteur', 'is', null)
      .limit(500),
    supabaseClient
      .from('espaces')
      .select('id, code, nom, type')
      .order('sort_order', { ascending: true }),
  ]);

  const rows = filtersRes.data || [];
  const unique = <T>(arr: T[]): T[] => Array.from(new Set(arr));

  return {
    secteurs: unique(rows.map((e) => e.secteur).filter(Boolean) as string[]),
    pavillons: unique(rows.map((e) => e.pavillon).filter(Boolean) as string[]),
    pays: unique(rows.map((e) => e.pays).filter(Boolean) as string[]),
    espaces: (espData.data || []) as Espace[],
  };
}

// ─── Fetcher principal exposants ──────────────────────────────────────────────
async function fetchExposants(
  search: string,
  secteur: string,
  pavillon: string,
  pays: string,
  page: number,
  pageSize: number,
) {
  // Récupérer session + bloqués + suspendus en parallèle
  const [sessionRes, inactiveRes] = await Promise.all([
    supabaseClient.auth.getSession(),
    supabaseClient
      .from('profiles')
      .select('id')
      .in('account_status', ['suspended', 'blocked']),
  ]);

  const myId = sessionRes.data?.session?.user?.id;
  const excludeIds = new Set<string>(
    (inactiveRes.data || []).map((p) => p.id),
  );

  // Récupérer les blocages seulement si on est connecté
  if (myId) {
    const { data: blocks } = await supabaseClient
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${myId},blocked_id.eq.${myId}`);

    (blocks || []).forEach((b) => {
      const id = b.blocker_id === myId ? b.blocked_id : b.blocker_id;
      if (id) excludeIds.add(id);
    });
  }

  let query = supabaseClient
    .from('exposants')
    .select('*, profiles!exposants_profile_id_fkey(subscription_tier, account_status)', { count: 'exact' });

  if (excludeIds.size > 0) {
    query = query.not('profile_id', 'in', `(${Array.from(excludeIds).join(',')})`);
  }

  if (search.trim()) {
    query = query.or(
      `nom.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`,
    );
  }
  if (secteur && secteur !== 'all') query = query.eq('secteur', secteur);
  if (pavillon && pavillon !== 'all') query = query.eq('pavillon', pavillon);
  if (pays && pays !== 'all') query = query.eq('pays', pays);

  const { data, error, count } = await query
    .order('is_featured', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return { data: data || [], count };
}

// ─── Hook exposants ───────────────────────────────────────────────────────────
export function useExposants(options: UseExposantsOptions = {}) {
  const {
    search = '',
    secteur = '',
    pavillon = '',
    pays = '',
    page = 0,
    pageSize = PAGE_SIZE,
  } = options;

  const exposantsQuery = useQuery({
    queryKey: ['exposants', { search, secteur, pavillon, pays, page, pageSize }],
    queryFn: () => fetchExposants(search, secteur, pavillon, pays, page, pageSize),
    staleTime: 2 * 60 * 1000,      // 2 minutes de cache
    gcTime: 10 * 60 * 1000,        // 10 minutes en mémoire
    placeholderData: (prev) => prev, // Garde les données précédentes pendant le rechargement
  });

  const filtersQuery = useQuery({
    queryKey: ['exposants-filters'],
    queryFn: fetchFilterOptions,
    staleTime: 10 * 60 * 1000,     // 10 minutes — les filtres changent rarement
    gcTime: 30 * 60 * 1000,
  });

  return {
    exposants: (exposantsQuery.data?.data || []) as (Exposant & {
      profiles: { subscription_tier: string | null; account_status: string | null } | null;
    })[],
    loading: exposantsQuery.isLoading,
    error: exposantsQuery.error as Error | null,
    totalCount: exposantsQuery.data?.count ?? null,
    filterOptions: filtersQuery.data ?? {
      secteurs: [],
      pavillons: [],
      pays: [],
      espaces: [],
    },
    page,
    pageSize,
  };
}
