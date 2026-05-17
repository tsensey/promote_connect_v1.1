'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTicketMessages } from '@/hooks/useSupport';
import { DateSeparator } from '@/components/chat/MessageBubble';
import { isSameDay } from '@/lib/chat/utils';
import { ArrowLeft, Send, Clock, AlertCircle, Ticket, LifeBuoy } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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

export default function TicketDetailPage() {
  const { t, locale } = useTranslation();
  const params = useParams();
  const ticketId = params.ticketId as string;

  const STATUS_LABELS: Record<string, string> = {
    open: t('support.tickets.status_open'),
    in_progress: t('support.tickets.status_in_progress'),
    resolved: t('support.tickets.status_resolved'),
    closed: t('support.tickets.status_closed'),
  };

  const PRIORITY_LABELS: Record<string, string> = {
    low: t('support.tickets.priority_low'),
    medium: t('support.tickets.priority_medium'),
    high: t('support.tickets.priority_high'),
  };

  const { messages, ticket, loading, error, sendMessage } = useTicketMessages(ticketId);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(content);
      setContent('');
    } catch {
      toast.error(t('support.ticket.send_error'));
    } finally {
      setSending(false);
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
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
        <div className="brand-gradient h-28 animate-pulse rounded-2xl" />
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

  if (error || !ticket) {
    return (
      <Card className="surface-panel border-0 max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="size-8 text-destructive/60" />
          </div>
          <div>
            <p className="text-xl font-heading font-semibold text-foreground">
              {t('support.ticket.load_error')}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('support.ticket.load_error_desc')}
            </p>
          </div>
          <Link href="/support">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="mr-2 size-4" />
              {t('support.ticket.back')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <Link
        href="/support"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('support.ticket.back')}
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
        <div className="brand-gradient relative px-6 py-6">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-white/70">
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
                  'rounded-full border text-xs font-medium shadow-sm',
                  PRIORITY_STYLES[ticket.priority || 'medium'],
                )}
              >
                {PRIORITY_LABELS[ticket.priority || 'medium']}
              </Badge>
              <Badge
                className={cn(
                  'rounded-full border text-xs font-medium shadow-sm',
                  STATUS_STYLES[ticket.status || 'open'],
                )}
              >
                {STATUS_LABELS[ticket.status || 'open']}
              </Badge>
            </div>
          </div>
        </div>

        {ticket.description && (
          <div className="border-b border-border/40 px-6 py-4">
            <p className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
              {ticket.description}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground/60">
              <Clock className="size-3.5 shrink-0" />
              {t('support.ticket.created_on')}{' '}
              {new Date(ticket.created_at || '').toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
              {t('support.ticket.at')}{' '}
              {new Date(ticket.created_at || '').toLocaleTimeString(locale === 'en' ? 'en-US' : 'fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            <LifeBuoy className="size-3.5" />
            {t('support.ticket.conversation')}
            <span className="ml-1 text-muted-foreground/40">
              ({t('support.ticket.message_count', { count: messages.length, s: messages.length !== 1 ? 's' : '' })})
            </span>
          </div>
        </div>

        <div ref={messagesContainerRef} className="space-y-1 px-6 py-4 max-h-[60vh] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50">
                <Send className="size-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('support.ticket.no_messages')}
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
                        !isAdmin && 'flex-row-reverse',
                      )}
                    >
                      <Avatar className={cn(
                        'size-9 shrink-0 border-2 border-background shadow-sm',
                        isAdmin ? 'ring-2 ring-primary/15' : 'ring-2 ring-muted/30',
                      )}>
                        <AvatarFallback
                          className={cn(
                            'text-xs font-semibold',
                            isAdmin
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {isAdmin ? 'S' : 'V'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col max-w-[85%] sm:max-w-[70%] gap-1">
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
                            isAdmin
                              ? 'bg-primary/5 text-foreground ring-1 ring-primary/10 rounded-tl-sm'
                              : 'bg-muted/70 text-foreground ring-1 ring-border/30 rounded-tr-sm',
                          )}
                        >
                          {msg.content}
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-2 px-1',
                            isAdmin ? '' : 'justify-end',
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
                            isAdmin ? 'text-primary/40' : 'text-muted-foreground/30',
                          )}>
                            {isAdmin ? 'Support' : 'Vous'}
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
                placeholder={t('support.ticket.message_placeholder')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="min-h-[44px] flex-1 resize-none rounded-xl border-border/60 bg-muted/30 focus:bg-card text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={!content.trim() || sending}
                className="shrink-0 self-end rounded-xl px-5"
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
              {t('support.ticket.closed')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
