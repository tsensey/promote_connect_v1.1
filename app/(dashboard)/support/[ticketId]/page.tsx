'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTicketMessages } from '@/hooks/useSupport';
import { ArrowLeft, Send, Clock, AlertCircle, Ticket } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Resolu',
  closed: 'Ferme',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-muted text-muted-foreground border-border/60',
  closed: 'bg-muted text-muted-foreground border-border/60',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-muted text-muted-foreground border-border/60',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-red-50 text-red-700 border-red-200',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticketId as string;
  const { messages, ticket, loading, error, sendMessage } =
    useTicketMessages(ticketId);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      toast.error("Erreur lors de l'envoi du message");
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
      <div className="space-y-6">
        <div className="surface-panel h-8 w-32 animate-pulse rounded-xl" />
        <div className="surface-panel h-28 animate-pulse rounded-xl border-0" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`h-16 animate-pulse rounded-xl bg-muted/80 ${i % 2 === 0 ? 'ml-12' : 'mr-12'}`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <Card className="surface-panel border-0">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertCircle className="size-16 text-destructive/30" />
          <div>
            <p className="text-xl font-heading font-semibold text-foreground">
              Impossible de charger ce ticket
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Le ticket n&apos;existe pas ou vous n&apos;y avez pas acces.
            </p>
          </div>
          <Link href="/support">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="mr-2 size-4" />
              Retour au support
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <Link
        href="/support"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour au support
      </Link>

      <Card className="surface-panel overflow-hidden border-0">
        <div className="brand-gradient px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Ticket className="size-4" />
                <span>Ticket #{ticketId.slice(0, 8)}</span>
              </div>
              <h1 className="mt-1 text-2xl font-heading font-semibold text-white">
                {ticket.subject}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                className={cn(
                  'rounded-full border text-xs font-medium',
                  PRIORITY_STYLES[ticket.priority || 'medium'],
                )}
              >
                {PRIORITY_LABELS[ticket.priority || 'medium']}
              </Badge>
              <Badge
                className={cn(
                  'rounded-full border text-xs font-medium',
                  STATUS_STYLES[ticket.status || 'open'],
                )}
              >
                {STATUS_LABELS[ticket.status || 'open']}
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className="p-5">
          {ticket.description && (
            <p className="text-sm leading-7 text-muted-foreground">
              {ticket.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            Cree le{' '}
            {new Date(ticket.created_at || '').toLocaleDateString('fr-FR')} a{' '}
            {new Date(ticket.created_at || '').toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="surface-panel border-0">
        <CardContent className="p-5">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            Conversation ({messages.length} message
            {messages.length !== 1 ? 's' : ''})
          </h2>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Send className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Aucun message pour le moment. Posez votre question ci-dessous.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.is_admin ? '' : 'flex-row-reverse'
                  }`}
                >
                  <Avatar className="size-9 shrink-0 border border-border/50">
                    <AvatarFallback
                      className={cn(
                        'text-xs font-medium',
                        msg.is_admin
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {msg.is_admin ? 'S' : 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 sm:max-w-[70%] ${
                      msg.is_admin
                        ? 'bg-primary/5 text-foreground ring-1 ring-primary/10'
                        : 'bg-muted/70 text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {new Date(msg.created_at || '').toLocaleTimeString(
                        'fr-FR',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Textarea
              placeholder="Ecrire votre message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="flex-1 resize-none rounded-xl border-border/60 bg-muted/50 focus:bg-white"
            />
            <Button
              onClick={handleSend}
              disabled={
                !content.trim() || sending || ticket.status === 'closed'
              }
              className="shrink-0 self-end rounded-xl"
            >
              <Send className="mr-2 size-4" />
              Envoyer
            </Button>
          </div>
          {ticket.status === 'closed' && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
              <AlertCircle className="size-3.5" />
              Ce ticket est ferme. Vous ne pouvez plus envoyer de messages.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


