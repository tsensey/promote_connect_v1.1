'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTicketMessages } from '@/hooks/useSupport';
import { ArrowLeft, Send, Clock, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Resolu',
  closed: 'Ferme',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-slate-100 text-slate-600',
  closed: 'bg-slate-100 text-slate-500',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticketId as string;
  const { messages, ticket, loading, error, sendMessage } = useTicketMessages(ticketId);
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
      toast.error('Erreur lors de l envoi du message');
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
      <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="h-12 rounded-2xl bg-slate-200 animate-pulse w-32" />
          <div className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-16 rounded-2xl bg-slate-200 animate-pulse ${i % 2 === 0 ? 'ml-12' : 'mr-12'}`} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-3" />
            <p className="text-red-600">Impossible de charger ce ticket.</p>
            <Link href="/support" className="mt-3 inline-flex text-sm text-blue-600 underline">
              Retour au support
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/support" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Retour au support
          </Link>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{ticket.subject}</h1>
                {ticket.description && (
                  <p className="mt-2 text-sm text-slate-600">{ticket.description}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Badge className={STATUS_COLORS[ticket.status || 'open']}>
                  {STATUS_LABELS[ticket.status || 'open']}
                </Badge>
                <Badge className={PRIORITY_COLORS[ticket.priority || 'medium']}>
                  {PRIORITY_LABELS[ticket.priority || 'medium']}
                </Badge>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              Cree le {new Date(ticket.created_at || '').toLocaleDateString('fr-FR')} a{' '}
              {new Date(ticket.created_at || '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 mb-4">
            Conversation ({messages.length} message{messages.length !== 1 ? 's' : ''})
          </h2>

          {messages.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Aucun message pour le moment. Posez votre question ci-dessous.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${msg.is_admin ? '' : 'flex-row-reverse'}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback
                      className={`text-xs font-medium ${
                        msg.is_admin ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {msg.is_admin ? 'S' : 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.is_admin
                        ? 'bg-blue-50 text-blue-900'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="mt-1 text-xs opacity-60">
                      {new Date(msg.created_at || '').toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
              className="flex-1 resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!content.trim() || sending || ticket.status === 'closed'}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {ticket.status === 'closed' && (
            <p className="mt-2 text-xs text-slate-400 text-center">
              Ce ticket est ferme. Vous ne pouvez plus envoyer de messages.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
