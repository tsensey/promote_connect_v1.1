'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { useNotificationState } from '@/lib/notification-context';
import { playMessageSound } from '@/lib/notification-sound';
import { useTranslation } from '@/lib/i18n';
import type { Database } from '@/types/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];

export function useNotifications() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { activeConversationId } = useNotificationState();
  const myIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    myIdRef.current = user.id;

    // ─── Messages entrants ──────────────────────────────────────────────
    const messageChannel = supabaseClient
      .channel('notifications-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const msg = payload.new as Message;
          const myId = myIdRef.current;
          if (!myId) return;
          if (msg.sender_id === myId) return;
          if (msg.conversation_id === activeConversationId) return;

          const { data: conv } = await supabaseClient
            .from('conversations')
            .select('participant_a, participant_b')
            .eq('id', msg.conversation_id!)
            .single();

          if (!conv) return;
          if (conv.participant_a !== myId && conv.participant_b !== myId) return;

          const { data: sender } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', msg.sender_id!)
            .single();

          const senderName = sender?.full_name ?? t('notifications.someone');
          const preview = msg.content
            ? msg.content.length > 60 ? msg.content.slice(0, 60) + '…' : msg.content
            : msg.attachment_type === 'image'
              ? t('notifications.photo')
              : msg.attachment_type === 'document'
                ? t('notifications.document')
                : msg.product_attachment
                  ? t('notifications.product')
                  : t('notifications.new_message');

          playMessageSound();

          toast(senderName, {
            description: preview,
            action: {
              label: t('notifications.view'),
              onClick: () => {
                window.location.href = `/chat?conv=${msg.conversation_id}`;
              },
            },
            duration: 5000,
          });
        }
      )
      .subscribe();

    // ─── Nouvelles publications ─────────────────────────────────────────
    const postChannel = supabaseClient
      .channel('notifications-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        async (payload) => {
          const post = payload.new as Post;
          const myId = myIdRef.current;
          if (!myId) return;
          if (post.author_id === myId) return;

          const { data: author } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', post.author_id)
            .single();

          const authorName = author?.full_name ?? t('notifications.someone');
          const preview = post.content.length > 80
            ? post.content.slice(0, 80) + '…'
            : post.content;

          toast(t('notifications.new_post'), {
            description: `${authorName} : ${preview}`,
            action: {
              label: t('notifications.view'),
              onClick: () => {
                window.location.href = `/feed#${post.id}`;
              },
            },
            duration: 4000,
          });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(messageChannel);
      supabaseClient.removeChannel(postChannel);
    };
  }, [user, activeConversationId]);
}
