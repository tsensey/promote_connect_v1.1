'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { supabaseClient } from '@/lib/supabase/client';

export interface QuotaStatus {
  loading: boolean;
  messages: { current: number; limit: number };
  posts: { current: number; limit: number; override: number | null };
  vitrine: { current: number; limit: number; override: number | null };
  dailyExchangeCount: number;
  subscriptionTier: string | null;
  accountStatus: string | null;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useQuotaStatus(): QuotaStatus {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    messages: { current: number; limit: number };
    posts: { current: number; limit: number; override: number | null };
    vitrine: { current: number; limit: number; override: number | null };
    dailyExchangeCount: number;
    subscriptionTier: string | null;
    accountStatus: string | null;
  }>({
    messages: { current: 0, limit: 10 },
    posts: { current: 0, limit: 2, override: null },
    vitrine: { current: 0, limit: 2, override: null },
    dailyExchangeCount: 0,
    subscriptionTier: null,
    accountStatus: null,
  });

  const fetchQuota = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const profileId = (profile as Record<string, unknown> | null)?.id as string | undefined;
      if (!profileId) {
        setLoading(false);
        return;
      }

      const { data: pData } = await supabaseClient
        .from('profiles')
        .select('subscription_tier, account_status, daily_exchange_count, quota_override_posts, quota_override_vitrine')
        .eq('id', profileId)
        .single();

      const profileRow = pData as unknown as {
        subscription_tier: string | null;
        account_status: string | null;
        daily_exchange_count: number | null;
        quota_override_posts: number | null;
        quota_override_vitrine: number | null;
      } | null;

      if (!profileRow) {
        setLoading(false);
        return;
      }

      const [{ count: postCount }, { count: msgCount }, exposantsRes, configRes] = await Promise.all([
        supabaseClient.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', profileId),
        supabaseClient.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', profileId),
        supabaseClient.from('exposants').select('id').eq('profile_id', profileId),
        supabaseClient.from('platform_config').select('key, value').in('key', [
          'daily_message_limit', 'max_posts_free_trial', 'max_vitrine_offers_free_trial',
        ]),
      ]);

      const exposantIds = (exposantsRes.data as unknown as { id: string }[] | null)?.map((e: { id: string }) => e.id) ?? [];
      const { count: vitrineCount } = exposantIds.length > 0
        ? await supabaseClient.from('produits').select('id', { count: 'exact', head: true }).in('exposant_id', exposantIds)
        : { count: 0 };

      const configData = configRes.data as unknown as { key: string; value: unknown }[] | null;
      const configMap = Object.fromEntries(configData?.map((r: { key: string; value: unknown }) => [r.key, r.value]) ?? []);
      const dailyLimit = Number(configMap['daily_message_limit'] ?? 10);
      const postLimit = profileRow.quota_override_posts ?? Number(configMap['max_posts_free_trial'] ?? 2);
      const vitrineLimit = profileRow.quota_override_vitrine ?? Number(configMap['max_vitrine_offers_free_trial'] ?? 2);

      setData({
        messages: { current: msgCount ?? 0, limit: dailyLimit },
        posts: { current: postCount ?? 0, limit: postLimit, override: profileRow.quota_override_posts },
        vitrine: { current: vitrineCount ?? 0, limit: vitrineLimit, override: profileRow.quota_override_vitrine },
        dailyExchangeCount: profileRow.daily_exchange_count ?? 0,
        subscriptionTier: profileRow.subscription_tier,
        accountStatus: profileRow.account_status,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des quotas');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return { ...data, loading, error, refresh: fetchQuota };
}
