'use client';

import { useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

export function useBlockedUsers() {
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBlockedUsers = useCallback(async () => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    setLoading(true);
    const { data } = await supabaseClient
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', myId);

    if (data) {
      setBlockedUserIds(data.map((b) => b.blocked_id));
    }
    setLoading(false);
  }, []);

  const blockUser = useCallback(async (blockedId: string, reason = 'harassment') => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return { error: new Error('Not authenticated') };

    const { error } = await supabaseClient.from('blocked_users').insert({
      blocker_id: myId,
      blocked_id: blockedId,
      reason,
    });

    if (!error) {
      setBlockedUserIds((prev) => [...prev, blockedId]);
    }
    return { error };
  }, []);

  const unblockUser = useCallback(async (blockedId: string) => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return { error: new Error('Not authenticated') };

    const { error } = await supabaseClient
      .from('blocked_users')
      .delete()
      .eq('blocker_id', myId)
      .eq('blocked_id', blockedId);

    if (!error) {
      setBlockedUserIds((prev) => prev.filter((id) => id !== blockedId));
    }
    return { error };
  }, []);

  const isBlocked = useCallback(
    (userId: string) => blockedUserIds.includes(userId),
    [blockedUserIds]
  );

  return {
    blockedUserIds,
    loading,
    loadBlockedUsers,
    blockUser,
    unblockUser,
    isBlocked,
  };
}
