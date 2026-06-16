'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, Check, Trash2, MessageSquare, Heart, AtSign, CalendarDays, X, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { useNotificationState, Notification } from '@/lib/notification-context';
import { supabaseClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/auth/context';

export function NotificationDropdown() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const {
    notifications,
    unreadNotificationsCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    dismissNotification,
    clearNotifications,
  } = useNotificationState();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin';
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await markAsRead(n.id);
    }

    if (n.data?.post_id) {
      router.push(`/feed#${n.data.post_id}`);
    } else if (n.data?.conversation_id) {
      router.push(`/chat?conv=${n.data.conversation_id}`);
    } else if (n.data?.ticket_id) {
      router.push(isAdmin ? `/admin/tickets/${n.data.ticket_id}` : `/support/ticket?id=${n.data.ticket_id}`);
    } else if (n.type?.startsWith('rdv_')) {
      router.push('/agenda');
    }
  };

  const handleRdvAction = async (notificationId: string, rdvId: string, status: 'confirmed' | 'cancelled') => {
    setActionLoading(notificationId);
    try {
      await supabaseClient
        .from('rendez_vous')
        .update({ status })
        .eq('id', rdvId);

      dismissNotification(notificationId);

      // Notification in-app gérée par trigger DB (migration 072)
      // Envoi email non bloquant
      fetch('/api/rdv/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rdv_id: rdvId, actor_id: user?.id }),
      }).catch(() => {});
    } catch (err) {
      console.error('Erreur action RDV:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="size-3 fill-red-500 text-red-500" />;
      case 'comment':
        return <MessageSquare className="size-3 text-blue-500" />;
      case 'mention_post':
      case 'mention_comment':
        return <AtSign className="size-3 text-primary" />;
      case 'rdv_request':
        return <CalendarDays className="size-3 text-amber-500" />;
      case 'rdv_confirmed':
        return <CheckCheck className="size-3 text-emerald-500" />;
      case 'rdv_cancelled':
        return <X className="size-3 text-red-500" />;
      case 'rdv_reminder':
        return <Bell className="size-3 text-blue-500" />;
      default:
        return <Bell className="size-3 text-muted-foreground" />;
    }
  };

  const getMessage = (n: Notification) => {
    const senderName = n.sender?.full_name && n.sender?.company
      ? `${n.sender.full_name} (${n.sender.company})`
      : n.sender?.full_name || n.sender?.company || t('notifications.someone');

    switch (n.type) {
      case 'like':
        return t('notifications.liked_post', { name: senderName });
      case 'comment':
        return t('notifications.commented_post', { name: senderName });
      case 'mention_post':
        return t('notifications.mentioned_post', { name: senderName });
      case 'mention_comment':
        return t('notifications.mentioned_comment', { name: senderName });
      case 'new_ticket':
        return t('notifications.new_ticket', { name: senderName, subject: n.data?.subject || '' });
      case 'ticket_reply':
        return t('notifications.ticket_reply', { name: senderName });
      case 'new_message':
        return t('notifications.new_message_from', { name: senderName });
      case 'rdv_request':
        return t('notifications.rdv_request', { name: senderName });
      case 'rdv_confirmed':
        return t('notifications.rdv_confirmed', { name: senderName });
      case 'rdv_cancelled':
        return t('notifications.rdv_cancelled', { name: senderName });
      case 'rdv_reminder':
        return t('notifications.rdv_reminder', { name: senderName, hours: n.data?.hours_before || '2' });
      default:
        return t('notifications.new_activity', { name: senderName });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground size-9"
      >
        <Bell className="size-4" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 py-px text-[10px] font-bold text-primary-foreground ring-2 ring-background">
            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-xl p-0 border-border/40 overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border/40">
          <DropdownMenuLabel className="p-0 font-bold text-base">
            {t('notifications.title')}
          </DropdownMenuLabel>
          {unreadNotificationsCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
              className="h-8 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg flex gap-1.5"
            >
              <Check className="size-3.5" />
              {t('notifications.mark_all_read')}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="p-3 bg-muted rounded-full mb-3">
                <Bell className="size-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {t('notifications.empty_title')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('notifications.empty_desc')}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((n) => (
                <div key={n.id}>
                  <DropdownMenuItem
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer transition-colors focus:bg-muted/50",
                      !n.is_read && "bg-primary/5 font-medium"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="size-10 border border-border/40">
                        <AvatarImage src={n.sender?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary uppercase">
                          {n.sender?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background p-1 ring-1 ring-border/20">
                        {getIcon(n.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm text-foreground leading-snug line-clamp-2">
                        {getMessage(n)}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), {
                            locale: locale === 'en' ? enUS : fr,
                            addSuffix: true
                          })}
                        </span>
                        {!n.is_read && (
                          <div className="size-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  {/* Boutons Accepter/Refuser pour les demandes de RDV */}
                  {n.type === 'rdv_request' && n.data?.rdv_id && user?.id !== n.sender_id && (
                    <div className="flex gap-2 px-3 pb-3 pt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === n.id}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await handleRdvAction(n.id, n.data.rdv_id, 'confirmed');
                        }}
                        className="flex-1 h-8 rounded-lg text-xs border-emerald-200 bg-emerald-50/80 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400 gap-1"
                      >
                        {actionLoading === n.id ? (
                          <span className="size-3 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === n.id}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await handleRdvAction(n.id, n.data.rdv_id, 'cancelled');
                        }}
                        className="flex-1 h-8 rounded-lg text-xs border-red-200 bg-red-50/80 text-red-600 hover:bg-red-100 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400 gap-1"
                      >
                        <X className="size-3.5" />
                        Refuser
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t border-border/40 bg-muted/10">
            <Button
              variant="ghost"
              className="w-full h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/notifications')}
            >
              {t('notifications.see_all')}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
