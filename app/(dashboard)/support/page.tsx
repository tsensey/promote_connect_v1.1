'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupportTickets } from '@/hooks/useSupport';
import { LifeBuoy, Plus, MessageCircle, BookOpen, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    question: 'Comment acceder a mon espace PROMOTE-CONNECT ?',
    answer: 'Connectez-vous avec les identifiants envoyes par l administrateur PROMOTE-CONNECT. Si vous n avez rien recu, contactez le support pour qu un acces vous soit reprovisionne.',
  },
  {
    question: 'Combien de temps dure mon acces ?',
    answer: 'Les comptes provisionnes par l administrateur ont acces a l ensemble de la plateforme tant qu ils restent actifs dans l administration.',
  },
  {
    question: 'Comment contacter un exposant ?',
    answer: 'Rendez-vous dans l Annuaire, selectionnez un exposant et cliquez sur "Contacter". Une conversation privee sera creee automatiquement.',
  },
  {
    question: 'Comment recevoir la newsletter ?',
    answer: 'Inscrivez-vous dans la section Newsletter. Vous pouvez choisir la frequence et les secteurs qui vous interessent.',
  },
  {
    question: 'Mes conversations sont-elles securisees ?',
    answer: 'Oui, les conversations sont chiffrees et accessibles uniquement aux participants. Le contenu n est jamais partage avec des tiers.',
  },
];

export default function SupportPage() {
  const router = useRouter();
  const { tickets, createTicket } = useSupportTickets();
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets' | 'faq'>('faq');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ticket = await createTicket(ticketForm.subject, ticketForm.description, ticketForm.priority);
      setShowNewTicket(false);
      setTicketForm({ subject: '', description: '', priority: 'medium' });
      toast.success('Ticket cree avec succes');
      router.push(`/support/${ticket.id}`);
    } catch {
      toast.error('Erreur lors de la creation du ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = FAQ_DATA.filter(
    (faq) =>
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      open: 'bg-green-100 text-green-700',
      in_progress: 'bg-blue-100 text-blue-700',
      resolved: 'bg-slate-100 text-slate-600',
    };
    const labels: Record<string, string> = {
      open: 'Ouvert',
      in_progress: 'En cours',
      resolved: 'Resolu',
    };
    return <Badge className={colors[status || 'open']}>{labels[status || 'open']}</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-slate-100 text-slate-600',
    };
    const labels: Record<string, string> = {
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Basse',
    };
    return <Badge className={colors[priority || 'medium']}>{labels[priority || 'medium']}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100">
            <LifeBuoy className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Support technique</h1>
            <p className="mt-1 text-muted-foreground">Obtenez de l aide avant, pendant et apres le salon.</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {(['faq', 'tickets', 'chat'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'faq' ? 'FAQ' : tab === 'tickets' ? 'Tickets' : 'Chat support'}
            </Button>
          ))}
        </div>
      </Card>

      {activeTab === 'faq' && (
        <Card className="p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-slate-900">Questions frequentes</h2>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une question..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            {filteredFaqs.map((faq, index) => (
              <FaqAccordion key={index} item={faq} />
            ))}
            {filteredFaqs.length === 0 && (
              <p className="text-center text-muted-foreground py-6">Aucun resultat pour &quot;{faqSearch}&quot;</p>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'tickets' && (
        <Card className="p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Mes tickets</h2>
            <Button
              size="sm"
              onClick={() => setShowNewTicket(!showNewTicket)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau ticket
            </Button>
          </div>

          {showNewTicket && (
            <form onSubmit={handleCreateTicket} className="mb-4 rounded-lg border border-border bg-muted p-4 space-y-3">
              <Input
                placeholder="Sujet du ticket"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                required
              />
              <Textarea
                placeholder="Description du probleme..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                rows={4}
              />
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={ticketForm.priority === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTicketForm({ ...ticketForm, priority: p })}
                  >
                    {p === 'low' ? 'Basse' : p === 'medium' ? 'Moyenne' : 'Haute'}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Creer le ticket
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewTicket(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}

          {tickets.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted p-4 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-muted-foreground">Aucun ticket ouvert.</p>
              <p className="text-sm text-muted-foreground">Creez un ticket pour obtenir de l aide.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-white p-4 transition hover:shadow-sm"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">{ticket.subject}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Cree le {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('fr-FR') : '-'}
                      {' - '}
                      {ticket.message_count} message{ticket.message_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'chat' && (
        <Card className="p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-slate-900">Chat support</h2>
          <p className="mt-2 text-muted-foreground">Notre equipe est disponible du lundi au vendredi, 9h-18h.</p>
          <div className="mt-4 rounded-lg border border-border bg-muted p-6 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-muted-foreground font-medium">Chat support temporairement indisponible</p>
            <p className="mt-1 text-sm text-muted-foreground">Veuillez creer un ticket ou nous contacter par email.</p>
            <a
              href="mailto:support@promote-connect.com"
              className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 underline"
            >
              support@promote-connect.com
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left transition hover:bg-muted"
      >
        <span className="font-medium text-slate-900 pr-4">{item.question}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}
