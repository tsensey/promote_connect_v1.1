'use client';

import { useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';

export type BlockType = 'messages' | 'rdv' | 'complete';

export interface BlockedUser {
  blocked_id: string;
  reason: string;
  block_type: BlockType;
}

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  messages: 'Messages uniquement',
  rdv: 'Rendez-vous uniquement',
  complete: 'Blocage complet',
};

export function useBlockedUsers() {
  const { user } = useAuth();
  const myId = user?.id;
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBlockedUsers = useCallback(async () => {
    if (!myId) return;

    setLoading(true);
    const { data } = await supabaseClient
      .from('blocked_users')
      .select('blocked_id, reason, block_type')
      .eq('blocker_id', myId) as unknown as {
        data: { blocked_id: string; reason: string | null; block_type: BlockType | null }[] | null;
        error: unknown;
      };

    if (data) {
      setBlockedUsers(data.map((d) => ({
        blocked_id: d.blocked_id,
        reason: d.reason || '',
        block_type: d.block_type || 'complete',
      })));
    }
    setLoading(false);
  }, [myId]);

  const blockUser = useCallback(async (blockedId: string, reason = 'harassment', blockType: BlockType = 'complete') => {
    if (!myId) return { error: new Error('Not authenticated') };

    const { error } = await (supabaseClient.from('blocked_users').upsert as any)({
      blocker_id: myId,
      blocked_id: blockedId,
      reason,
      block_type: blockType,
    }, { onConflict: 'blocker_id,blocked_id' });

    if (!error) {
      setBlockedUsers((prev) => {
        const filtered = prev.filter(b => b.blocked_id !== blockedId);
        return [...filtered, { blocked_id: blockedId, reason, block_type: blockType }];
      });
    }
    return { error };
  }, [myId]);

  const unblockUser = useCallback(async (blockedId: string) => {
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
  }, [myId]);

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
    BLOCK_TYPE_LABELS,
  };
}

export { BLOCK_TYPE_LABELS };
