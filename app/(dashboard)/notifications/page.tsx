'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, Check, Trash2, MessageSquare, Heart, AtSign, CalendarDays, X, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { useNotificationState, Notification } from '@/lib/notification-context';
import { supabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';

export default function NotificationsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const {
    notifications,
    unreadNotificationsCount,
    markAsRead,
    markAllAsRead,
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
      router.push(isAdmin ? `/admin/tickets/${n.data.ticket_id}` : `/support/${n.data.ticket_id}`);
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

      // Notification in-app gérée par trigger DB
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
        return <Heart className="size-4 fill-red-500 text-red-500" />;
      case 'comment':
        return <MessageSquare className="size-4 text-blue-500" />;
      case 'mention_post':
      case 'mention_comment':
        return <AtSign className="size-4 text-primary" />;
      case 'rdv_request':
        return <CalendarDays className="size-4 text-amber-500" />;
      case 'rdv_confirmed':
        return <CheckCheck className="size-4 text-emerald-500" />;
      case 'rdv_cancelled':
        return <X className="size-4 text-red-500" />;
      case 'rdv_reminder':
        return <Bell className="size-4 text-blue-500" />;
      default:
        return <Bell className="size-4 text-muted-foreground" />;
    }
  };

  const getMessage = (n: Notification) => {
    const senderName = n.sender?.full_name && n.sender?.company
      ? `${n.sender.full_name} (${n.sender.company})`
      : n.sender?.full_name || n.sender?.company || t('notifications.someone');

    switch (n.type) {
      case 'like': return t('notifications.liked_post', { name: senderName });
      case 'comment': return t('notifications.commented_post', { name: senderName });
      case 'mention_post': return t('notifications.mentioned_post', { name: senderName });
      case 'mention_comment': return t('notifications.mentioned_comment', { name: senderName });
      case 'new_ticket': return t('notifications.new_ticket', { name: senderName, subject: n.data?.subject || '' });
      case 'ticket_reply': return t('notifications.ticket_reply', { name: senderName });
      case 'new_message': return t('notifications.new_message_from', { name: senderName });
      case 'rdv_request': return t('notifications.rdv_request', { name: senderName });
      case 'rdv_confirmed': return t('notifications.rdv_confirmed', { name: senderName });
      case 'rdv_cancelled': return t('notifications.rdv_cancelled', { name: senderName });
      case 'rdv_reminder': return t('notifications.rdv_reminder', { name: senderName, hours: n.data?.hours_before || '2' });
      default: return t('notifications.new_activity', { name: senderName });
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Bell className="size-8 text-primary" />
          {t('notifications.title')}
          {unreadNotificationsCount > 0 && (
            <span className="flex items-center justify-center rounded-full bg-primary px-2.5 py-0.5 text-sm font-bold text-primary-foreground">
              {unreadNotificationsCount}
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          {unreadNotificationsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="hidden sm:flex gap-2"
            >
              <Check className="size-4" />
              {t('notifications.mark_all_read')}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2"
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">Vider</span>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="p-4 bg-muted/50 rounded-full mb-4">
              <Bell className="size-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t('notifications.empty_title')}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {t('notifications.empty_desc')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "p-4 sm:p-6 transition-colors hover:bg-muted/30 cursor-pointer flex flex-col sm:flex-row gap-4",
                  !n.is_read && "bg-primary/5"
                )}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative shrink-0">
                    <Avatar className="size-12 border border-border/60">
                      <AvatarImage src={n.sender?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary uppercase">
                        {n.sender?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-background p-1 ring-2 ring-background shadow-sm">
                      {getIcon(n.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={cn(
                      "text-base text-foreground leading-snug",
                      !n.is_read && "font-medium"
                    )}>
                      {getMessage(n)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), {
                          locale: locale === 'en' ? enUS : fr,
                          addSuffix: true
                        })}
                      </span>
                      {!n.is_read && (
                        <span className="flex size-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions spécifiques (RDV) */}
                {n.type === 'rdv_request' && n.data?.rdv_id && user?.id !== n.sender_id && (
                  <div className="flex gap-2 sm:flex-col shrink-0 mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading === n.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleRdvAction(n.id, n.data.rdv_id, 'confirmed');
                      }}
                      className="flex-1 sm:flex-none border-emerald-200 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400"
                    >
                      {actionLoading === n.id ? (
                        <span className="size-4 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
                      ) : (
                        <Check className="size-4 mr-2" />
                      )}
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading === n.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleRdvAction(n.id, n.data.rdv_id, 'cancelled');
                      }}
                      className="flex-1 sm:flex-none border-red-200 bg-red-50/50 text-red-600 hover:bg-red-100 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400"
                    >
                      <X className="size-4 mr-2" />
                      Refuser
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
