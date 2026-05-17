'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  canReadFeed,
  canReadAgenda,
  canSeeExposants,
  canRequestRdv,
  canContactExposant,
  canSeeContactDetails,
  canUseChat,
  hasUnlimitedMessaging,
  canExchangeWith,
  hasReachedExchangeLimit,
  getDailyExchangeLimit,
  type PermissionUser,
  type PermissionTarget,
} from '@/lib/permissions';

export function usePermissions() {
  const { profile, user } = useAuth();

  const permissionUser: PermissionUser | null = useMemo(() => {
    if (!profile) return null;
    return {
      role: profile.role,
      access_level: (profile as Record<string, unknown>).access_level as string | null ?? 'classic',
      id: user?.id,
    };
  }, [profile, user?.id]);

  const isClassicVisitor = useMemo(() => {
    if (!permissionUser) return false;
    return permissionUser.role === 'visiteur' && permissionUser.access_level === 'classic';
  }, [permissionUser]);

  return useMemo(() => {
    if (!permissionUser) {
      return {
        loading: true,
        canReadFeed: false,
        canReadAgenda: false,
        canSeeExposants: false,
        canRequestRdv: false,
        canContactExposant: false,
        canSeeContactDetails: false,
        canUseChat: false,
        hasUnlimitedMessaging: false,
        isClassicVisitor: false,
        canExchangeWith: (_target: PermissionTarget) => false,
        hasReachedLimit: false,
        dailyLimit: getDailyExchangeLimit(),
      };
    }

    const p = permissionUser;
    const profileData = profile as Record<string, unknown> | null;
    const dailyCount = (profileData?.daily_exchange_count as number) ?? 0;
    const lastReset = (profileData?.last_exchange_reset as string) ?? null;

    return {
      loading: false,
      canReadFeed: canReadFeed(p),
      canReadAgenda: canReadAgenda(p),
      canSeeExposants: canSeeExposants(p),
      canRequestRdv: canRequestRdv(p),
      canContactExposant: canContactExposant(p),
      canSeeContactDetails: canSeeContactDetails(p),
      canUseChat: canUseChat(p),
      hasUnlimitedMessaging: hasUnlimitedMessaging(p),
      isClassicVisitor,
      canExchangeWith: (target: PermissionTarget) => canExchangeWith(p, target),
      hasReachedLimit: hasUnlimitedMessaging(p) ? false : hasReachedExchangeLimit(dailyCount, lastReset),
      dailyLimit: getDailyExchangeLimit(),
    };
  }, [permissionUser, profile, isClassicVisitor]);
}
