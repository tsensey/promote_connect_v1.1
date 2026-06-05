'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  canReadFeed,
  canReadAgenda,
  canViewVitrine,
  canAccessDirectory,
  canRequestRdv,
  canUseChat,
  canSeeContactDetails,
  hasUnlimitedMessaging,
  canBlockUsers,
  canReceiveNewsletter,
  canAccessSupport,
  canPublishPost,
  canPublishOffer,
  isEligibleForSponsoring,
  // Legacy
  canContactExposant,
  canExchangeWith,
  getDailyExchangeLimit,
  hasReachedExchangeLimit,
  type PermissionUser,
  type UserPermissions,
} from '@/lib/permissions';
import { shouldShowTrialBanner, getTrialDaysRemaining } from '@/lib/subscription-helpers';

export function usePermissions(): UserPermissions & {
  // Champs supplémentaires exposés par le hook
  isFreeTrial: boolean;
  isClassicVisitor: boolean; // Legacy compat
  showTrialBanner: boolean;
  trialDaysRemaining: number | null;
  canSeeExposants: boolean;
  canContactExposant: boolean;
  canExchangeWith: (target: { subscription_tier?: string | null }) => boolean;
  hasReachedLimit: boolean;
  dailyLimit: number;
} {
  const { profile, user } = useAuth();

  const permissionUser: PermissionUser | null = useMemo(() => {
    if (!profile) return null;
    return {
      id: user?.id,
      role: profile.role,
      subscription_tier: (profile as Record<string, unknown>).subscription_tier as string | null ?? 'free_trial',
      subscription_ends_at: (profile as Record<string, unknown>).subscription_ends_at as string | null ?? null,
      account_status: (profile as Record<string, unknown>).account_status as string | null ?? 'active',
      is_active: profile.is_active,
    };
  }, [profile, user?.id]);

  const trialEndsAt = useMemo(() => {
    return (profile as Record<string, unknown> | null)?.trial_ends_at as string | null ?? null;
  }, [profile]);

  const showTrialBanner = useMemo(() => {
    if (!permissionUser) return false;
    if (permissionUser.subscription_tier === 'paid') return false;
    return shouldShowTrialBanner(trialEndsAt);
  }, [permissionUser, trialEndsAt]);

  const trialDaysRemaining = useMemo(() => {
    if (!trialEndsAt) return null;
    return getTrialDaysRemaining(trialEndsAt);
  }, [trialEndsAt]);

  return useMemo(() => {
    const empty = {
      loading: true,
      // Compte
      isActive: false,
      isPaid: false,
      isAdmin: false,
      tier: null as null,
      isFreeTrial: false,
      isClassicVisitor: false,
      showTrialBanner: false,
      trialDaysRemaining: null as null,
      // Features
      canReadFeed: false,
      canReadAgenda: false,
      canViewVitrine: false,
      canAccessDirectory: false,
      canRequestRdv: false,
      canUseChat: false,
      canSeeContactDetails: false,
      hasUnlimitedMessaging: false,
      canBlockUsers: false,
      canReceiveNewsletter: false,
      canAccessSupport: false,
      canPublishPost: false,
      canPublishOffer: false,
      isEligibleForSponsoring: false,
      // Legacy
      canSeeExposants: false,
      canContactExposant: false,
      canExchangeWith: (_target: { subscription_tier?: string | null }) => false,
      hasReachedLimit: false,
      dailyLimit: getDailyExchangeLimit(),
    };

    if (!permissionUser) return empty;

    const p = permissionUser;
    const isPaidUser = p.subscription_tier === 'paid' || p.role === 'admin';
    const isAdminUser = p.role === 'admin';
    const isActiveUser = p.account_status === 'active' || p.is_active !== false;
    const dailyCount = (profile?.daily_exchange_count as number) ?? 0;
    const lastReset = (profile?.last_exchange_reset as string) ?? null;

    return {
      loading: false,
      // Compte
      isActive: isActiveUser,
      isPaid: isPaidUser,
      isAdmin: isAdminUser,
      tier: (p.subscription_tier as 'free_trial' | 'paid' | null) ?? null,
      isFreeTrial: !isPaidUser,
      isClassicVisitor: p.role === 'visiteur' && !isPaidUser,
      showTrialBanner,
      trialDaysRemaining,
      // Features v1.1
      canReadFeed: canReadFeed(p),
      canReadAgenda: canReadAgenda(p),
      canViewVitrine: canViewVitrine(p),
      canAccessDirectory: canAccessDirectory(p),
      canRequestRdv: canRequestRdv(p),
      canUseChat: canUseChat(p),
      canSeeContactDetails: canSeeContactDetails(p),
      hasUnlimitedMessaging: hasUnlimitedMessaging(p),
      canBlockUsers: canBlockUsers(p),
      canReceiveNewsletter: canReceiveNewsletter(p),
      canAccessSupport: canAccessSupport(p),
      canPublishPost: canPublishPost(p),
      canPublishOffer: canPublishOffer(p),
      isEligibleForSponsoring: isEligibleForSponsoring(p),
      // Legacy — compatibilité avec l'existant
      canSeeExposants: isActiveUser,
      canContactExposant: canContactExposant(p),
      canExchangeWith: (target) => canExchangeWith(p, target),
      hasReachedLimit: hasUnlimitedMessaging(p) ? false : hasReachedExchangeLimit(dailyCount, lastReset),
      dailyLimit: getDailyExchangeLimit(),
    };
  }, [permissionUser, profile, showTrialBanner, trialDaysRemaining]);
}
