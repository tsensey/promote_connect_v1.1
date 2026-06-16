'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import type { Exposant } from '@/types/exposant';

export type AppProfile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  | 'id' | 'full_name' | 'company' | 'role' | 'sector' | 'country'
  | 'pavillon' | 'avatar_url' | 'is_active' | 'created_at'
  | 'daily_exchange_count' | 'last_exchange_reset'
  | 'subscription_tier' | 'account_status' | 'trial_ends_at' | 'subscription_ends_at'
>;

export type AppExposant = Pick<
  Exposant,
  'id' | 'nom' | 'logo_url' | 'secteur' | 'pavillon' | 'stand' | 'pays' | 'description'
>;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: AppProfile | null;
  exposant: AppExposant | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const authContext = createContext<AuthContextValue | undefined>(undefined);

async function loadProfile(userId: string) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select(
      'id, full_name, company, role, sector, country, pavillon, avatar_url, is_active, created_at, daily_exchange_count, last_exchange_reset, subscription_tier, account_status, trial_ends_at, subscription_ends_at'
    )
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function loadExposant(profileId: string) {
  const { data, error } = await supabaseClient
    .from('exposants')
    .select('id, nom, logo_url, secteur, pavillon, stand, pays, description')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [exposant, setExposant] = useState<AppExposant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let isInitialLoad = true;

    const syncAuthState = async (nextSession?: Session | null) => {
      if (isInitialLoad) {
        setLoading(true);
      }

      const resolvedSession =
        nextSession ?? (await supabaseClient.auth.getSession()).data.session ?? null;

      if (!mounted) return;

      setSession(resolvedSession);
      setUser(resolvedSession?.user ?? null);

      if (!resolvedSession?.user) {
        setProfile(null);
        setExposant(null);
        if (isInitialLoad) setLoading(false);
        isInitialLoad = false;
        return;
      }

      try {
        const nextProfile = await loadProfile(resolvedSession.user.id);
        if (mounted) setProfile(nextProfile);
        if (mounted && nextProfile?.role === 'exposant') {
          const nextExposant = await loadExposant(resolvedSession.user.id);
          if (mounted) setExposant(nextExposant);
        } else {
          if (mounted) setExposant(null);
        }
      } catch {
        if (mounted) setProfile(null);
        if (mounted) setExposant(null);
      } finally {
        if (mounted && isInitialLoad) setLoading(false);
        isInitialLoad = false;
      }
    };

    void syncAuthState();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      void syncAuthState(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Real-time subscription pour détecter suspension/blocage immédiatement
  useEffect(() => {
    if (!user) return;

    let subMounted = true;

    const channel = supabaseClient
      .channel(`profile-status-${user.id}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: unknown) => {
          if (!subMounted) return;
          const { new: newProfile } = payload as { new: Record<string, unknown> };
          const accountStatus = newProfile.account_status as string | null;
          const isActive = newProfile.is_active as boolean | null;

          if (accountStatus === 'suspended' || accountStatus === 'blocked' || isActive === false) {
            supabaseClient.auth.signOut().catch(console.error);
          } else {
            setProfile(newProfile as unknown as AppProfile);
          }
        }
      )
      .subscribe();

    return () => {
      subMounted = false;
      supabaseClient.removeChannel(channel);
    };
  }, [user?.id]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setExposant(null);
      return;
    }

    const nextProfile = await loadProfile(user.id);
    setProfile(nextProfile);

    if (nextProfile?.role === 'exposant') {
      const nextExposant = await loadExposant(user.id);
      setExposant(nextExposant);
    } else {
      setExposant(null);
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return (
    <authContext.Provider
      value={{ user, session, profile, exposant, loading, refreshProfile, signIn, signOut }}
    >
      {children}
    </authContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(authContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
