import { useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
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
        .select(`
          *,
          demandeur:rendez_vous_demandeur_id_fkey(*),
          destinataire:rendez_vous_destinataire_id_fkey(*)
        `)
        .or(`demandeur_id.eq.${myId},destinataire_id.eq.${myId}`)
        .order('starts_at', { ascending: true });

      if (error) throw error;

      const rawRdvs = data || [];
      const enriched: EnrichedRdv[] = (rawRdvs as unknown as (RendezVous & {
        demandeur: Profile | null;
        destinataire: Profile | null;
      })[]).map((rdv) => ({
        ...rdv,
        other_user: rdv.demandeur_id === myId ? rdv.destinataire : rdv.demandeur,
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

      const { data, error } = await supabaseClient
        .from('rendez_vous')
        .insert({
          demandeur_id: myId,
          destinataire_id: destinataireId,
          starts_at: startsAt,
          ends_at: endsAt,
          notes,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      await fetchRdvs();
      return data;
    },
    [fetchRdvs]
  );

  const updateRdvStatus = useCallback(
    async (rdvId: string, status: 'confirmed' | 'cancelled') => {
      const { error } = await supabaseClient
        .from('rendez_vous')
        .update({ status })
        .eq('id', rdvId);

      if (error) throw error;
      await fetchRdvs();
    },
    [fetchRdvs]
  );

  const cancelRdv = useCallback(
    async (rdvId: string) => {
      const { error } = await supabaseClient
        .from('rendez_vous')
        .update({ status: 'cancelled' })
        .eq('id', rdvId);

      if (error) throw error;
      await fetchRdvs();
    },
    [fetchRdvs]
  );

  return { rdvs, loading, error, createRdv, updateRdvStatus, cancelRdv };
}
