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
  const { activeConversationId, refreshUnreadCount, refreshNotifications } = useNotificationState();
  const myIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    myIdRef.current = user.id;

    // ─── Nouvelles publications ─────────────────────────────────────────
    // On ne fetch plus le profil de l'auteur — on utilise le générique
    // (les posts n'ont pas les infos auteur dans le payload Realtime)
    const postChannel = supabaseClient
      .channel('notifications-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          const post = payload.new as Post;
          const myId = myIdRef.current;
          if (!myId || post.author_id === myId) return;

          const preview = post.content?.length > 80
            ? post.content.slice(0, 80) + '…'
            : post.content || '';

          playMessageSound();

          toast(t('notifications.new_post'), {
            description: preview,
            action: {
              label: t('notifications.view'),
              onClick: () => { window.location.href = `/feed#${post.id}`; },
            },
            duration: 4000,
          });
        }
      )
      .subscribe();

    // ─── Notifications Générales (Likes, Commentaires, Mentions, Messages) ─
    // Les triggers DB enrichissent le champ `data` avec sender_name
    // → plus besoin de fetcher le profil côté client
    const notificationChannel = supabaseClient
      .channel('realtime-notifications-general')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;

          // Utiliser sender_name depuis le champ data si dispo, sinon générique
          const senderName = n.data?.sender_name || t('notifications.someone');

          let message = '';
          switch (n.type) {
            case 'like': message = t('notifications.liked_post', { name: senderName }); break;
            case 'comment': message = t('notifications.commented_post', { name: senderName }); break;
            case 'mention_post': message = t('notifications.mentioned_post', { name: senderName }); break;
            case 'mention_comment': message = t('notifications.mentioned_comment', { name: senderName }); break;
            case 'new_ticket': message = t('notifications.new_ticket', { name: senderName, subject: n.data?.subject || '' }); break;
            case 'ticket_reply': message = t('notifications.ticket_reply', { name: senderName }); break;
            case 'new_message':
              if (n.data?.conversation_id === activeConversationId) return;
              message = t('notifications.new_message_from', { name: senderName });
              refreshUnreadCount();
              break;
            default: message = t('notifications.new_activity', { name: senderName });
          }

          playMessageSound();
          refreshNotifications();

          toast(t('notifications.title'), {
            description: message,
            action: {
              label: t('notifications.view'),
              onClick: () => {
                if (n.data?.post_id) window.location.href = `/feed#${n.data.post_id}`;
                else if (n.data?.conversation_id) window.location.href = `/chat?conv=${n.data.conversation_id}`;
                else if (n.data?.ticket_id) {
                  if (user.user_metadata?.role === 'admin') {
                    window.location.href = `/admin/tickets/${n.data.ticket_id}`;
                  } else {
                    window.location.href = `/support/${n.data.ticket_id}`;
                  }
                }
              },
            },
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(postChannel);
      supabaseClient.removeChannel(notificationChannel);
    };
  }, [user, activeConversationId, refreshUnreadCount, refreshNotifications]);
}

