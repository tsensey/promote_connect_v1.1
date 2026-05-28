'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase/client';
import { DateSeparator } from '@/components/chat/MessageBubble';
import { isSameDay } from '@/lib/chat/utils';
import {
  ArrowLeft, Send, Clock, AlertCircle, Ticket, LifeBuoy,
  Loader2, User, Building2, CheckCircle2, XCircle, Play,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface AdminTicketDetail {
  id: string;
  subject: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  created_at: string | null;
  profile_id: string | null;
  profiles?: {
    full_name: string | null;
    company: string | null;
  } | null;
}

interface SupportMessage {
  id: string;
  ticket_id: string | null;
  sender_id: string | null;
  content: string;
  is_admin: boolean;
  created_at: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  resolved: 'bg-muted text-muted-foreground border-border/60',
  closed: 'bg-muted text-muted-foreground border-border/60',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-muted text-muted-foreground border-border/60',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'admin.tickets.status_open',
  in_progress: 'admin.tickets.status_progress',
  resolved: 'admin.tickets.status_resolved',
  closed: 'admin.tickets.status_closed',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'admin.ticket_detail.priority_low',
  medium: 'admin.ticket_detail.priority_medium',
  high: 'admin.ticket_detail.priority_high',
};

export default function AdminTicketDetailPage() {
  const { t, locale } = useTranslation();
  const params = useParams();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<AdminTicketDetail | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [ticketRes, messagesRes] = await Promise.all([
          supabaseClient
            .from('support_tickets')
            .select('*, profiles(full_name, company)')
            .eq('id', ticketId)
            .single(),
          supabaseClient
            .from('support_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true }),
        ]);

        if (!mounted) return;

        if (ticketRes.error) throw ticketRes.error;
        if (messagesRes.error) throw messagesRes.error;

        setTicket(ticketRes.data as unknown as AdminTicketDetail);
        setMessages((messagesRes.data || []) as SupportMessage[]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('admin.ticket_detail.load_error'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    const channel = supabaseClient
      .channel(`admin-ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as SupportMessage]);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets',
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          if (mounted) {
            const updated = payload.new as AdminTicketDetail;
            setTicket((prev) => prev ? { ...prev, status: updated.status, priority: updated.priority } : prev);
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabaseClient.removeChannel(channel);
    };
  }, [ticketId, t]);

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      if (!session?.session?.user) return;

      const { data, error } = await supabaseClient
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: session.session.user.id,
          content: content.trim(),
          is_admin: true,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => [...prev, data as SupportMessage]);
      }

      await supabaseClient
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString(), status: 'in_progress' })
        .eq('id', ticketId);

      setContent('');
    } catch {
      toast.error(t('admin.ticket_detail.send_error'));
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setUpdating(true);
    try {
      const { error } = await supabaseClient
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;
      setTicket((prev) => prev ? { ...prev, status } : prev);
      toast.success(t('admin.tickets.updated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.tickets.update_error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-28 animate-pulse rounded-2xl bg-muted/80" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-16 animate-pulse rounded-2xl bg-muted/80',
                i % 2 === 0 ? 'ml-12' : 'mr-12',
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <Card className="surface-panel border-0 max-w-5xl mx-auto">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="size-8 text-destructive/60" />
          </div>
          <div>
            <p className="text-xl font-heading font-semibold text-foreground">
              {t('admin.ticket_detail.load_error')}
            </p>
          </div>
          <Link href="/admin/tickets">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="mr-2 size-4" />
              {t('admin.ticket_detail.back')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <Link
        href="/admin/tickets"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('admin.ticket_detail.back')}
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
        <div className="bg-amber-600 relative px-6 py-6">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-amber-100">
                <Ticket className="size-4 shrink-0" />
                <span className="truncate font-mono text-xs tracking-wider">
                  #{ticketId.slice(0, 8)}
                </span>
              </div>
              <h1 className="mt-1.5 text-2xl font-heading font-semibold text-white break-words">
                {ticket.subject}
              </h1>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Badge
                className={cn(
                  'rounded-full border text-xs font-medium',
                  PRIORITY_STYLES[ticket.priority || 'medium'],
                )}
              >
                {t(PRIORITY_LABELS[ticket.priority || 'medium'])}
              </Badge>
              <Badge
                className={cn(
                  'rounded-full border text-xs font-medium',
                  STATUS_STYLES[ticket.status || 'open'],
                )}
              >
                {t(STATUS_LABELS[ticket.status || 'open'])}
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-b border-border/40 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-10 border-2 border-background ring-2 ring-muted/30">
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                  <User className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {ticket.profiles?.full_name || t('admin.tickets.default_user')}
                </p>
                {ticket.profiles?.company && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="size-3" />
                    {ticket.profiles.company}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={updating || ticket.status === 'in_progress'}
                onClick={() => handleStatusChange('in_progress')}
              >
                {updating ? (
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                ) : (
                  <Play className="size-3.5 mr-1" />
                )}
                {t('admin.tickets.take')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={updating || ticket.status === 'resolved' || ticket.status === 'closed'}
                onClick={() => handleStatusChange('resolved')}
              >
                <CheckCircle2 className="size-3.5 mr-1" />
                {t('admin.tickets.resolve')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={updating || ticket.status === 'closed'}
                onClick={() => handleStatusChange('closed')}
              >
                <XCircle className="size-3.5 mr-1" />
                {t('admin.tickets.close')}
              </Button>
            </div>
          </div>

          {ticket.description && (
            <div className="mt-4">
              <p className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          )}

          {ticket.created_at && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground/60">
              <Clock className="size-3.5 shrink-0" />
              {t('admin.ticket_detail.created_on')}{' '}
              {new Date(ticket.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
        <div className="border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            <LifeBuoy className="size-3.5" />
            {t('admin.ticket_detail.conversation')}
            <span className="ml-1 text-muted-foreground/40">
              ({messages.length} {messages.length > 1 ? t('admin.ticket_detail.messages_plural') : t('admin.ticket_detail.messages_singular')})
            </span>
          </div>
        </div>

        <div className="space-y-1 px-6 py-4 max-h-[60vh] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50">
                <Send className="size-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('admin.ticket_detail.no_messages')}
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const prev = messages[i - 1];
                const showDateSeparator = !prev || !isSameDay(prev.created_at ?? '', msg.created_at ?? '');
                const isAdmin = msg.is_admin;

                return (
                  <div key={msg.id}>
                    {showDateSeparator && msg.created_at && (
                      <div className="py-3">
                        <DateSeparator date={msg.created_at} />
                      </div>
                    )}
                    <div
                      className={cn(
                        'flex items-start gap-3 group',
                        isAdmin && 'flex-row-reverse',
                      )}
                    >
                      <Avatar className={cn(
                        'size-9 shrink-0 border-2 border-background',
                        isAdmin ? 'ring-2 ring-amber-500/20' : 'ring-2 ring-primary/15',
                      )}>
                        <AvatarFallback
                          className={cn(
                            'text-xs font-semibold',
                            isAdmin
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-primary/10 text-primary',
                          )}
                        >
                          {isAdmin ? t('admin.ticket_detail.initial_support') : t('admin.ticket_detail.initial_visitor')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col max-w-[85%] sm:max-w-[70%] gap-1">
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                            isAdmin
                              ? 'bg-amber-50 text-foreground ring-1 ring-amber-200/50 dark:bg-amber-950/20 dark:ring-amber-800/30 rounded-tr-sm'
                              : 'bg-muted/70 text-foreground ring-1 ring-border/30 rounded-tl-sm',
                          )}
                        >
                          {msg.content}
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-2 px-1',
                            isAdmin ? 'justify-end' : '',
                          )}
                        >
                          <span className="text-[11px] text-muted-foreground/50">
                            {new Date(msg.created_at || '').toLocaleTimeString(
                              locale === 'en' ? 'en-US' : 'fr-FR',
                              { hour: '2-digit', minute: '2-digit' },
                            )}
                          </span>
                          <span className={cn(
                            'text-[10px] font-medium uppercase tracking-wider',
                            isAdmin ? 'text-amber-500/50' : 'text-primary/40',
                          )}>
                            {isAdmin
                              ? t('admin.ticket_detail.admin_badge')
                              : t('admin.ticket_detail.user_badge')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {ticket.status !== 'closed' ? (
          <div className="border-t border-border/40 px-6 py-4">
            <div className="flex gap-3">
              <Textarea
                placeholder={t('admin.ticket_detail.message_placeholder')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="min-h-[44px] flex-1 resize-none rounded-xl border-amber-200/60 bg-amber-50/30 focus:bg-card focus:border-amber-300/60 dark:bg-amber-950/10 dark:border-amber-800/40 text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={!content.trim() || sending}
                className="shrink-0 self-end rounded-xl px-5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {sending ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="size-4" />
                )}
                <span className="ml-2 hidden sm:inline">{t('common.send')}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t border-border/40 px-6 py-4">
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <AlertCircle className="size-4 shrink-0" />
              {t('admin.ticket_detail.ticket_closed')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
