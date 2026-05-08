'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, LifeBuoy, Loader2 } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface AdminTicketRow {
  id: string;
  subject: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  created_at: string | null;
  updated_at: string | null;
  profile_id: string | null;
  profiles?: {
    full_name: string | null;
    company: string | null;
  } | null;
}

const statusLabels: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Resolu',
  closed: 'Ferme',
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
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<AdminTicketRow[]>([]);

  const loadTickets = async () => {
    const { data, error } = await supabaseClient
      .from('support_tickets')
      .select('*, profiles(full_name, company)')
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
        .select('*, profiles(full_name, company)')
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
      toast.success('Statut mis a jour.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Mise a jour impossible.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
          Support admin
        </p>
        <h1 className="text-4xl text-foreground">Tickets en cours</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Suivez les demandes des utilisateurs, priorisez les cas sensibles et faites avancer le support depuis le back-office.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Tickets" value={tickets.length} />
        <StatCard label="Ouverts" value={tickets.filter((ticket) => ticket.status === 'open').length} />
        <StatCard label="Priorite haute" value={tickets.filter((ticket) => ticket.priority === 'high').length} />
      </div>

      <Card className="surface-panel border-0">
        <CardHeader>
          <CardTitle>File de traitement</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="surface-subtle py-12 text-center">
              <LifeBuoy className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aucun ticket a traiter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="surface-subtle space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl text-foreground">{ticket.subject}</h2>
                        <Badge className={statusClasses[ticket.status || 'open']}>
                          {statusLabels[ticket.status || 'open']}
                        </Badge>
                        <Badge className={priorityClasses[ticket.priority || 'medium']}>
                          {ticket.priority || 'medium'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {ticket.profiles?.full_name || 'Utilisateur'}{' '}
                        {ticket.profiles?.company ? `- ${ticket.profiles.company}` : ''}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>
                        Cree le{' '}
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleDateString('fr-FR')
                          : '-'}
                      </p>
                      <p>
                        Mis a jour le{' '}
                        {ticket.updated_at
                          ? new Date(ticket.updated_at).toLocaleDateString('fr-FR')
                          : '-'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-muted-foreground">
                    {ticket.description || 'Aucune description complementaire.'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={updatingId === ticket.id}
                      onClick={() => updateStatus(ticket.id, 'in_progress')}
                    >
                      {updatingId === ticket.id ? <Loader2 className="size-4 animate-spin" /> : 'Prendre en charge'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={updatingId === ticket.id}
                      onClick={() => updateStatus(ticket.id, 'resolved')}
                    >
                      Resoudre
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={updatingId === ticket.id}
                      onClick={() => updateStatus(ticket.id, 'closed')}
                    >
                      Cloturer
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
            Cette vue couvre la supervision des tickets. Le support conversationnel utilisateur reste disponible dans l espace membre, avec archivage des echanges.
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
