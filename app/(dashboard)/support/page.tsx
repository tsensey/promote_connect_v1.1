'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupportTickets } from '@/hooks/useSupport';
import {
  LifeBuoy,
  Plus,
  MessageCircle,
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FaqItem {
  question: string;
  answer: string;
}

export default function SupportPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { tickets, createTicket } = useSupportTickets();
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets' | 'faq'>('faq');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'medium',
  });
  const [submitting, setSubmitting] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');

  const FAQ_DATA: FaqItem[] = [
    {
      question: t('support.faq1_q'),
      answer: t('support.faq1_a'),
    },
    {
      question: t('support.faq2_q'),
      answer: t('support.faq2_a'),
    },
    {
      question: t('support.faq3_q'),
      answer: t('support.faq3_a'),
    },
    {
      question: t('support.faq4_q'),
      answer: t('support.faq4_a'),
    },
    {
      question: t('support.faq5_q'),
      answer: t('support.faq5_a'),
    },
  ];

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ticket = await createTicket(
        ticketForm.subject,
        ticketForm.description,
        ticketForm.priority,
      );
      setShowNewTicket(false);
      setTicketForm({ subject: '', description: '', priority: 'medium' });
      toast.success(t('support.tickets.created'));
      router.push(`/support/${ticket.id}`);
    } catch {
      toast.error(t('support.tickets.create_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = FAQ_DATA.filter(
    (faq) =>
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearch.toLowerCase()),
  );

  const getStatusBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      open: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      resolved: 'bg-muted text-muted-foreground border-border/60',
    };
    const labels: Record<string, string> = {
      open: t('common.open'),
      in_progress: t('common.in_progress'),
      resolved: t('common.resolved'),
    };
    return (
      <Badge
        className={cn(
          'rounded-full border text-xs',
          colors[status || 'open'],
        )}
      >
        {labels[status || 'open']}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string | null) => {
    const colors: Record<string, string> = {
      high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      low: 'bg-muted text-muted-foreground border-border/60',
    };
    const labels: Record<string, string> = {
      high: t('support.tickets.priority_high'),
      medium: t('support.tickets.priority_medium'),
      low: t('support.tickets.priority_low'),
    };
    return (
      <Badge
        className={cn(
          'rounded-full border text-xs',
          colors[priority || 'medium'],
        )}
      >
        {labels[priority || 'medium']}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-3xl font-heading text-foreground">
          {t('support.title')}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          {t('support.desc')}
        </p>
      </div>

      <Card className="surface-panel border-0">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <LifeBuoy className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                {t('support.assistance')}
              </p>
              <h2 className="text-2xl font-heading text-foreground">
                {t('support.how_help')}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['faq', 'tickets', 'chat'] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="rounded-full"
              >
                {tab === 'faq' ? (
                  <BookOpen className="mr-1.5 size-3.5" />
                ) : tab === 'tickets' ? (
                  <Ticket className="mr-1.5 size-3.5" />
                ) : (
                  <MessageCircle className="mr-1.5 size-3.5" />
                )}
                {tab === 'faq' ? t('support.tab_faq') : tab === 'tickets' ? t('support.tab_tickets') : t('support.tab_chat')}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeTab === 'faq' && (
        <Card className="surface-panel border-0">
          <CardContent className="space-y-4 p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('support.faq_search')}
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="h-11 rounded-xl border-border/70 bg-card pl-11"
              />
            </div>

            <div className="space-y-2">
              {filteredFaqs.map((faq, index) => (
                <FaqAccordion key={index} item={faq} />
              ))}
              {filteredFaqs.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <BookOpen className="size-12 text-muted-foreground/30" />
                  <p className="text-base font-medium text-foreground">
                    {t('support.faq_no_results', { query: faqSearch })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'tickets' && (
        <Card className="surface-panel border-0">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading text-foreground">
                {t('support.tickets.title')}
              </h2>
              <Button
                size="sm"
                onClick={() => setShowNewTicket(!showNewTicket)}
                className="rounded-xl"
              >
                <Plus className="mr-1.5 size-4" />
                {t('support.tickets.new')}
              </Button>
            </div>

            {showNewTicket && (
              <form
                onSubmit={handleCreateTicket}
                className="rounded-xl border border-border/60 bg-muted/40 p-5 space-y-4"
              >
                <Input
                  placeholder={t('support.tickets.subject_placeholder')}
                  value={ticketForm.subject}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, subject: e.target.value })
                  }
                  required
                  className="rounded-xl"
                />
                <Textarea
                  placeholder={t('support.tickets.desc_placeholder')}
                  value={ticketForm.description}
                  onChange={(e) =>
                    setTicketForm({
                      ...ticketForm,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  className="rounded-xl"
                />
                <div className="flex flex-wrap gap-2">
                  {['low', 'medium', 'high'].map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={ticketForm.priority === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setTicketForm({ ...ticketForm, priority: p })
                      }
                      className="rounded-full"
                    >
                      {p === 'low'
                        ? t('support.tickets.priority_low')
                        : p === 'medium'
                          ? t('support.tickets.priority_medium')
                          : t('support.tickets.priority_high')}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    size="sm"
                    className="rounded-xl"
                  >
                    {submitting && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {t('support.create')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewTicket(false)}
                    className="rounded-xl"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            )}

            {tickets.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Ticket className="size-12 text-muted-foreground/30" />
                <p className="text-base font-medium text-foreground">
                  {t('support.tickets.no_tickets')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('support.tickets.no_tickets_hint')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/support/${ticket.id}`}
                    className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary">
                        {ticket.subject}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('support.ticket.created_on')}{' '}
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleDateString(
                              locale === 'en' ? 'en-US' : 'fr-FR',
                            )
                          : '-'}
                        {' \u2014 '}
                        {t('support.ticket.message_count', { count: ticket.message_count, s: ticket.message_count !== 1 ? 's' : '' })}
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
          </CardContent>
        </Card>
      )}

      {activeTab === 'chat' && (
        <Card className="surface-panel border-0">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <MessageCircle className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-heading text-foreground">
                  {t('support.chat.title')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('support.chat.desc')}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/40 p-8 text-center">
              <MessageCircle className="mx-auto size-12 text-muted-foreground/30" />
              <p className="mt-4 text-lg font-semibold text-foreground">
                {t('support.chat.unavailable')}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('support.chat.unavailable_hint')}
              </p>
              <a
                href="mailto:support@promote-connect.com"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                support@promote-connect.com
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/60 bg-card transition-all hover:border-primary/20">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/30"
      >
        <span className="pr-4 text-sm font-semibold text-foreground">
          {item.question}
        </span>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="border-t border-border/60 px-5 py-4 text-sm leading-7 text-muted-foreground">
          {item.answer}
        </div>
      )}
    </div>
  );
}
