'use client';

import { useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

export type BlockType = 'messages' | 'rdv' | 'complete';

export interface BlockedUser {
  blocked_id: string;
  reason: string;
}

export function useBlockedUsers() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBlockedUsers = useCallback(async () => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    setLoading(true);
    const { data } = await supabaseClient
      .from('blocked_users')
      .select('blocked_id, reason')
      .eq('blocker_id', myId);

    if (data) {
      setBlockedUsers(data as BlockedUser[]);
    }
    setLoading(false);
  }, []);

  const blockUser = useCallback(async (blockedId: string, reason = 'harassment') => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return { error: new Error('Not authenticated') };

    const { error } = await supabaseClient.from('blocked_users').upsert({
      blocker_id: myId,
      blocked_id: blockedId,
      reason,
    }, { onConflict: 'blocker_id,blocked_id' });

    if (!error) {
      setBlockedUsers((prev) => {
        const filtered = prev.filter(b => b.blocked_id !== blockedId);
        return [...filtered, { blocked_id: blockedId, reason }];
      });
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
      setBlockedUsers((prev) => prev.filter((b) => b.blocked_id !== blockedId));
    }
    return { error };
  }, []);



  const isBlocked = useCallback(
    (userId: string) => {
      return blockedUsers.some(b => b.blocked_id === userId);
    },
    [blockedUsers]
  );

  return {
    blockedUsers,
    loading,
    loadBlockedUsers,
    blockUser,
    unblockUser,

    isBlocked,
  };
}
