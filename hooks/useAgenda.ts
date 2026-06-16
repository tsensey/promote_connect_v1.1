import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { isNativePlatform } from '@/lib/capacitor';
import type { Database } from '@/types/database.types';

type Evenement = Database['public']['Tables']['evenements']['Row'];
type RendezVous = Database['public']['Tables']['rendez_vous']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface EnrichedRdv extends RendezVous {
  other_user: Profile | null;
}

// ─── Fetchers ──────────────────────────────────────────────────────────────

async function fetchEvenements(): Promise<Evenement[]> {
  const { data, error } = await supabaseClient
    .from('evenements')
    .select('*')
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchRendezVous(): Promise<EnrichedRdv[]> {
  const { data: session } = await supabaseClient.auth.getSession();
  const myId = session?.session?.user?.id;
  if (!myId) return [];

  const { data, error } = await supabaseClient
    .from('rendez_vous')
    .select('*')
    .or(`demandeur_id.eq.${myId},destinataire_id.eq.${myId}`)
    .order('starts_at', { ascending: true });

  if (error) throw error;

  const rawRdvs = data || [];
  const otherUserIds = rawRdvs
    .map((rdv) => (rdv.demandeur_id === myId ? rdv.destinataire_id : rdv.demandeur_id))
    .filter(Boolean) as string[];

  const profileMap = new Map<string, Profile>();
  if (otherUserIds.length > 0) {
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('id, full_name, company, avatar_url, role')
      .in('id', otherUserIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p);
    }
  }

  return rawRdvs.map((rdv) => ({
    ...rdv,
    other_user:
      rdv.demandeur_id === myId
        ? profileMap.get(rdv.destinataire_id ?? '') ?? null
        : profileMap.get(rdv.demandeur_id ?? '') ?? null,
  }));
}

// ─── Hook événements ────────────────────────────────────────────────────────

export function useEvenements() {
  const { data: evenements = [], isLoading: loading, error } = useQuery({
    queryKey: ['evenements'],
    queryFn: fetchEvenements,
    staleTime: 5 * 60 * 1000,    // 5 minutes — le programme change rarement
    gcTime: 30 * 60 * 1000,
  });

  return {
    evenements,
    loading,
    error: error as Error | null,
  };
}

// ─── Hook rendez-vous ────────────────────────────────────────────────────────

export function useRendezVous() {
  const queryClient = useQueryClient();

  const { data: rdvs = [], isLoading: loading, error } = useQuery({
    queryKey: ['rendez_vous'],
    queryFn: fetchRendezVous,
    staleTime: 60 * 1000,    // 1 minute — les RDV changent plus souvent
    gcTime: 10 * 60 * 1000,
  });

  // Realtime : invalidation du cache au lieu de re-fetch direct
  useEffect(() => {
    const channel = supabaseClient
      .channel('rdv-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rendez_vous' },
        () => {
          // Invalide le cache React Query → re-fetch automatique
          queryClient.invalidateQueries({ queryKey: ['rendez_vous'] });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [queryClient]);

  const fetchRdvs = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['rendez_vous'] });
  }, [queryClient]);

  const createRdv = useCallback(
    async (destinataireId: string, startsAt: string, endsAt: string, notes?: string) => {
      const { data: session } = await supabaseClient.auth.getSession();
      const myId = session?.session?.user?.id;
      if (!myId) throw new Error('Not authenticated');

      let data: { id?: string; status?: string };

      if (isNativePlatform()) {
        const result = await supabaseClient.functions.invoke('generate-rdv', {
          body: {
            demandeur_id: myId,
            destinataire_id: destinataireId,
            starts_at: startsAt,
            ends_at: endsAt,
            notes,
          },
        });
        if (result.error) throw result.error;
        data = result.data as { id?: string; status?: string };
      } else {
        const res = await fetch('/api/generate-rdv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            demandeur_id: myId,
            destinataire_id: destinataireId,
            starts_at: startsAt,
            ends_at: endsAt,
            notes,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Erreur lors de la création du rendez-vous');
        }

        data = await res.json();
      }

      // Invalider le cache pour forcer un re-fetch
      await queryClient.invalidateQueries({ queryKey: ['rendez_vous'] });
      return data;
    },
    [queryClient]
  );

  const notifyRdvStatus = useCallback(async (rdvId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    try {
      await fetch('/api/rdv/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rdv_id: rdvId, actor_id: myId }),
      });
    } catch {
      // Échec d'envoi d'email non critique
    }
  }, []);

  const updateRdvStatus = useCallback(
    async (rdvId: string, status: 'confirmed' | 'cancelled') => {
      // Optimistic update
      queryClient.setQueryData(['rendez_vous'], (prev: EnrichedRdv[] | undefined) =>
        (prev || []).map((rdv) => (rdv.id === rdvId ? { ...rdv, status } : rdv))
      );

      const { error } = await supabaseClient
        .from('rendez_vous')
        .update({ status })
        .eq('id', rdvId);

      if (error) {
        // Rollback en cas d'erreur
        queryClient.invalidateQueries({ queryKey: ['rendez_vous'] });
        throw error;
      }

      // Notification in-app gérée par trigger DB (migration 072)
      // Envoi email non bloquant
      notifyRdvStatus(rdvId);
    },
    [queryClient, notifyRdvStatus]
  );

  return { rdvs, loading, error: error as Error | null, createRdv, updateRdvStatus, fetchRdvs };
}
