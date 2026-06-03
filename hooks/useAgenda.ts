import { useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { isNativePlatform } from '@/lib/capacitor';
import type { Database } from '@/types/database.types';

type Evenement = Database['public']['Tables']['evenements']['Row'];
type RendezVous = Database['public']['Tables']['rendez_vous']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface EnrichedRdv extends RendezVous {
  other_user: Profile | null;
}

export function useEvenements() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvenements = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('evenements')
          .select('*')
          .order('starts_at', { ascending: true });
        if (error) throw error;
        setEvenements(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchEvenements();
  }, []);

  return { evenements, loading, error };
}

export function useRendezVous() {
  const [rdvs, setRdvs] = useState<EnrichedRdv[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRdvs = useCallback(async () => {
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const myId = session?.session?.user?.id;
      if (!myId) return;

      const { data, error } = await supabaseClient
        .from('rendez_vous')
        .select('*')
        .or(`demandeur_id.eq.${myId},destinataire_id.eq.${myId}`)
        .order('starts_at', { ascending: true });

      if (error) throw error;

      const rawRdvs = data || [];
      const otherUserIds = rawRdvs.map((rdv) =>
        rdv.demandeur_id === myId ? rdv.destinataire_id : rdv.demandeur_id
      ).filter(Boolean) as string[];

      const profileMap = new Map<string, Profile>();
      if (otherUserIds.length > 0) {
        const { data: profiles } = await supabaseClient
          .from('profiles')
          .select('*')
          .in('id', otherUserIds);
        for (const p of profiles ?? []) {
          profileMap.set(p.id, p);
        }
      }

      const enriched: EnrichedRdv[] = rawRdvs.map((rdv) => ({
        ...rdv,
        other_user: rdv.demandeur_id === myId
          ? profileMap.get(rdv.destinataire_id ?? '') ?? null
          : profileMap.get(rdv.demandeur_id ?? '') ?? null,
      }));

      setRdvs(enriched);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRdvs();

    const channel = supabaseClient
      .channel('rdv-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rendez_vous' },
        () => {
          fetchRdvs();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [fetchRdvs]);

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

      await fetchRdvs();
      return data;
    },
    [fetchRdvs]
  );

  const updateRdvStatus = useCallback(
    async (rdvId: string, status: 'confirmed' | 'cancelled') => {
      setRdvs((prev) =>
        prev.map((rdv) => (rdv.id === rdvId ? { ...rdv, status } : rdv))
      );

      const { error } = await supabaseClient
        .from('rendez_vous')
        .update({ status })
        .eq('id', rdvId);

      if (error) {
        setRdvs((prev) =>
          prev.map((rdv) => (rdv.id === rdvId ? { ...rdv, status: rdv.status } : rdv))
        );
        throw error;
      }

      await fetchRdvs();
    },
    [fetchRdvs]
  );

  const cancelRdv = useCallback(
    async (rdvId: string) => {
      setRdvs((prev) =>
        prev.map((rdv) => (rdv.id === rdvId ? { ...rdv, status: 'cancelled' } : rdv))
      );

      const { error } = await supabaseClient
        .from('rendez_vous')
        .update({ status: 'cancelled' })
        .eq('id', rdvId);

      if (error) {
        setRdvs((prev) =>
          prev.map((rdv) => (rdv.id === rdvId ? { ...rdv, status: rdv.status } : rdv))
        );
        throw error;
      }

      await fetchRdvs();
    },
    [fetchRdvs]
  );

  return { rdvs, loading, error, createRdv, updateRdvStatus, cancelRdv };
}
