'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

export interface UserPreferences {
  id: string;
  profile_id: string;
  language: 'fr' | 'en';
  notify_messages: boolean;
  notify_rdv: boolean;
  notify_newsletter: boolean;
  notify_feed: boolean;
  notify_sound: boolean;
  created_at: string;
  updated_at: string;
}

const defaultPreferences = {
  language: 'fr' as const,
  notify_messages: true,
  notify_rdv: true,
  notify_newsletter: true,
  notify_feed: true,
  notify_sound: true,
};

export function useSettings() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        const { data: session } = await supabaseClient.auth.getSession();
        const uid = session?.session?.user?.id;
        if (!uid) {
          if (mounted) setPreferences(null);
          return;
        }
        if (mounted) setUserId(uid);

        const { data } = await supabaseClient
          .from('user_preferences')
          .select('*')
          .eq('profile_id', uid)
          .maybeSingle();

        if (data) {
          if (mounted) setPreferences(data as UserPreferences);
        } else {
          const { data: inserted } = await supabaseClient
            .from('user_preferences')
            .insert({ profile_id: uid, ...defaultPreferences })
            .select()
            .maybeSingle();

          if (inserted && mounted) {
            setPreferences(inserted as UserPreferences);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const updatePreferences = useCallback(
    async (updates: Partial<Omit<UserPreferences, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>) => {
      if (!userId) return { success: false, error: 'Not authenticated' } as const;
      setSaving(true);
      try {
        const { data, error } = await supabaseClient
          .from('user_preferences')
          .update(updates)
          .eq('profile_id', userId)
          .select()
          .maybeSingle();

        if (error) throw error;
        if (data) setPreferences(data as UserPreferences);
        return { success: true } as const;
      } catch {
        return { success: false, error: 'Failed to update preferences' } as const;
      } finally {
        setSaving(false);
      }
    },
    [userId]
  );

  const updateProfile = useCallback(
    async (updates: { full_name?: string; company?: string; sector?: string | null; country?: string | null; pavillon?: string | null; avatar_url?: string | null }) => {
      if (!userId) return { success: false, error: 'Not authenticated' } as const;
      setSaving(true);
      try {
        const { error } = await supabaseClient
          .from('profiles')
          .update(updates)
          .eq('id', userId);

        if (error) throw error;
        return { success: true } as const;
      } catch {
        return { success: false, error: 'Failed to update profile' } as const;
      } finally {
        setSaving(false);
      }
    },
    [userId]
  );

  return {
    preferences,
    loading,
    saving,
    updatePreferences,
    updateProfile,
  };
}
