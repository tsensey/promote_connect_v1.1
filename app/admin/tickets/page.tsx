'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Crown, LifeBuoy, Loader2, MessageSquare, Search, Star } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface AdminTicketRow {
  id: string;
  subject: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
  profile_id: string | null;
  profiles?: {
    full_name: string | null;
    company: string | null;
    subscription_tier: string | null;
  } | null;
}

const statusLabels: Record<string, string> = {
  open: 'admin.tickets.status_open',
  in_progress: 'admin.tickets.status_progress',
  resolved: 'admin.tickets.status_resolved',
  closed: 'admin.tickets.status_closed',
};

const statusClasses: Record<string, string> = {
  open: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  in_progress: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  resolved: 'bg-muted text-muted-foreground',
  closed: 'bg-muted text-muted-foreground/60',
};

const priorityClasses: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  high: 'bg-red-500/15 text-red-700 dark:text-red-300',
};

export default function AdminTicketsPage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<AdminTicketRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const loadTickets = async () => {
    const { data, error } = await supabaseClient
      .from('support_tickets')
      .select('*, profiles(full_name, company, subscription_tier)')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setTickets((data || []) as unknown as AdminTicketRow[]);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const { data, error } = await supabaseClient
        .from('support_tickets')
        .select('*, profiles(full_name, company, subscription_tier)')
        .order('updated_at', { ascending: false });

      if (!active) {
        return;
      }

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setTickets((data || []) as unknown as AdminTicketRow[]);
      setLoading(false);
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const updateStatus = async (ticketId: string, status: 'in_progress' | 'resolved' | 'closed') => {
    setUpdatingId(ticketId);

    try {
      const { error } = await supabaseClient
        .from('support_tickets')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) {
        throw error;
      }

      await loadTickets();
      toast.success(t('admin.tickets.toast_updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('admin.tickets.toast_update_error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    
    const cat = ticket.category || 'general';
    if (categoryFilter !== 'all' && cat !== categoryFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSubject = ticket.subject?.toLowerCase().includes(q) || false;
      const matchName = ticket.profiles?.full_name?.toLowerCase().includes(q) || false;
      const matchCompany = ticket.profiles?.company?.toLowerCase().includes(q) || false;
      if (!matchSubject && !matchName && !matchCompany) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
          {t('admin.tickets.title')}
        </p>
        <h1 className="text-4xl text-foreground">{t('admin.tickets.subtitle')}</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          {t('admin.tickets.desc')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t('admin.tickets.tickets_label')} value={filteredTickets.length} />
        <StatCard label={t('admin.tickets.open')} value={filteredTickets.filter((ticket) => ticket.status === 'open').length} />
        <StatCard label={t('admin.tickets.high_priority')} value={filteredTickets.filter((ticket) => ticket.priority === 'high').length} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder={t('admin.tickets.search_placeholder')} 
            className="pl-9 bg-background/50 border-white/5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || 'all')}>
            <SelectTrigger className="w-[180px] bg-background/50 border-white/5">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.tickets.filter_all_cat')}</SelectItem>
              <SelectItem value="general">{t('admin.tickets.category_general')}</SelectItem>
              <SelectItem value="upgrade">{t('admin.tickets.category_upgrade')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
            <SelectTrigger className="w-[180px] bg-background/50 border-white/5">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.tickets.filter_all_status')}</SelectItem>
              <SelectItem value="open">{t('admin.tickets.status_open')}</SelectItem>
              <SelectItem value="in_progress">{t('admin.tickets.status_in_progress')}</SelectItem>
              <SelectItem value="resolved">{t('admin.tickets.status_resolved')}</SelectItem>
              <SelectItem value="closed">{t('admin.tickets.status_closed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="surface-panel border-0">
        <CardHeader>
          <CardTitle>{t('admin.tickets.queue')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="surface-subtle py-12 text-center">
              <LifeBuoy className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('admin.tickets.no_tickets')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <article key={ticket.id} className="surface-subtle space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl text-foreground">{ticket.subject}</h2>
                        {(ticket.category === 'upgrade') ? (
                           <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
                             <Star className="mr-1 size-3" /> {t('admin.tickets.category_upgrade')}
                           </Badge>
                        ) : (
                           <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300">
                             <MessageSquare className="mr-1 size-3" /> {t('admin.tickets.category_general')}
                           </Badge>
                        )}
                        <Badge className={statusClasses[ticket.status || 'open']}>
                          {t(statusLabels[ticket.status || 'open'])}
                        </Badge>
                        <Badge className={priorityClasses[ticket.priority || 'medium']}>
                          {ticket.priority || 'medium'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {ticket.profiles?.full_name || t('admin.tickets.default_user')}{' '}
                        {ticket.profiles?.company ? ` - ${ticket.profiles.company}` : ''}
                      </p>
                      {ticket.profiles?.subscription_tier === 'paid' && (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 ml-2">
                          <Crown className="mr-1 size-3" /> Premium
                        </Badge>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>
                        {t('admin.tickets.created_on')}{' '}
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR')
                          : '-'}
                      </p>
                      <p>
                        {t('admin.tickets.updated_on')}{' '}
                        {ticket.updated_at
                          ? new Date(ticket.updated_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR')
                          : '-'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-muted-foreground">
                    {ticket.description || t('admin.tickets.no_description')}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Link 
                      href={`/admin/tickets/${ticket.id}`}
                      className={buttonVariants({ size: "sm", variant: "default", className: "rounded-full" })}
                    >
                      <MessageSquare className="size-3.5 mr-1.5" />
                      {t('admin.tickets.conversation_btn')}
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={updatingId === ticket.id}
                      onClick={() => updateStatus(ticket.id, 'in_progress')}
                    >
                      {updatingId === ticket.id ? <Loader2 className="size-4 animate-spin" /> : t('admin.tickets.take')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={updatingId === ticket.id}
                      onClick={() => updateStatus(ticket.id, 'resolved')}
                    >
                      {t('admin.tickets.resolve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={updatingId === ticket.id}
                      onClick={() => updateStatus(ticket.id, 'closed')}
                    >
                      {t('admin.tickets.close')}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="surface-panel border-0">
        <CardContent className="flex items-start gap-3 p-5 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 text-primary" />
          <p className="leading-6">
            {t('admin.tickets.footer_hint')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="surface-panel border-0">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
