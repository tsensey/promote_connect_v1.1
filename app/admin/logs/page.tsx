'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Download,
  Filter,
  History,
  Loader2,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string | null;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  create_profiles: 'Création compte',
  update_profiles: 'Modification compte',
  delete_profiles: 'Suppression compte',
  create_exposants: 'Création exposant',
  update_exposants: 'Modification exposant',
  delete_exposants: 'Suppression exposant',
  create_espaces: 'Création espace',
  update_espaces: 'Modification espace',
  delete_espaces: 'Suppression espace',
  create_evenements: 'Création événement',
  update_evenements: 'Modification événement',
  delete_evenements: 'Suppression événement',
  create_support_tickets: 'Création ticket',
  update_support_tickets: 'Modification ticket',
  delete_support_tickets: 'Suppression ticket',
  create_messages: 'Envoi message',
  create_rendez_vous: 'Création RDV',
  update_rendez_vous: 'Modification RDV',
  delete_rendez_vous: 'Suppression RDV',
  create_posts: 'Création publication',
};

function getActionColor(action: string): string {
  if (action.startsWith('create')) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  if (action.startsWith('update')) return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
  if (action.startsWith('delete')) return 'bg-red-500/10 text-red-700 dark:text-red-300';
  return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
}

function getEntityLabel(type: string): string {
  const labels: Record<string, string> = {
    profiles: 'Compte',
    exposants: 'Exposant',
    espaces: 'Espace',
    evenements: 'Événement',
    support_tickets: 'Ticket',
    messages: 'Message',
    rendez_vous: 'RDV',
    posts: 'Publication',
  };
  return labels[type] || type;
}

const ACTIONS = [
  'all',
  'create_profiles',
  'update_profiles',
  'delete_profiles',
  'create_exposants',
  'update_exposants',
  'delete_exposants',
  'create_espaces',
  'update_espaces',
  'delete_espaces',
  'create_evenements',
  'update_evenements',
  'delete_evenements',
  'create_support_tickets',
  'update_support_tickets',
  'delete_support_tickets',
  'create_messages',
  'create_rendez_vous',
  'update_rendez_vous',
  'delete_rendez_vous',
  'create_posts',
];

const ENTITY_TYPES = [
  'all',
  'profiles',
  'exposants',
  'espaces',
  'evenements',
  'support_tickets',
  'messages',
  'rendez_vous',
  'posts',
];

const ROLES = ['all', 'admin', 'exposant', 'visiteur'];

export default function AdminLogsPage() {
  const { t, locale } = useTranslation();
  const { session } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const limit = 50;

  const token = session?.access_token || null;

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (search) params.set('search', search);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (entityFilter !== 'all') params.set('entity_type', entityFilter);
      if (roleFilter !== 'all') params.set('actor_role', roleFilter);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const response = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error('Erreur chargement logs');
        return;
      }

      setLogs(payload.logs || []);
      setTotal(payload.total || 0);
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, actionFilter, entityFilter, roleFilter, startDate, endDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLogs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  const stats = useMemo(() => ({
    total,
    creates: logs.filter((l) => l.action.startsWith('create')).length,
    updates: logs.filter((l) => l.action.startsWith('update')).length,
    deletes: logs.filter((l) => l.action.startsWith('delete')).length,
  }), [logs, total]);

  async function handleExportCSV() {
    if (!token) return;

    try {
      const params = new URLSearchParams();
      params.set('limit', '5000');
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (entityFilter !== 'all') params.set('entity_type', entityFilter);
      if (roleFilter !== 'all') params.set('actor_role', roleFilter);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const response = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json();
      const allLogs: AuditLog[] = payload.logs || [];

      const header = 'Date;Acteur;Email;Role;Action;Type;Entité ID';
      const rows = allLogs.map((log) =>
        [
          new Date(log.created_at).toLocaleString('fr-FR'),
          log.actor_id,
          log.actor_email || '',
          log.actor_role,
          log.action,
          log.entity_type,
          log.entity_id || '',
        ].join(';')
      );

      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur export');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            Audits & Traçabilité
          </p>
          <h1 className="text-4xl text-foreground">Journal d&apos;activité</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Consultez l&apos;historique de toutes les actions effectuées sur la plateforme
            (admin, exposants, visiteurs) avec filtres avancés.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={handleExportCSV}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => { setPage(1); void fetchLogs(); }}>
            <RefreshCw className="mr-2 size-4" />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="surface-panel flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">Total actions</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stats.total}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
            <History className="size-5" />
          </div>
        </div>
        <div className="surface-panel flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">Créations</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stats.creates}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <History className="size-5" />
          </div>
        </div>
        <div className="surface-panel flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">Modifications</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stats.updates}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <History className="size-5" />
          </div>
        </div>
        <div className="surface-panel flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">Suppressions</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stats.deletes}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-red-500/10 text-red-700 dark:text-red-300">
            <History className="size-5" />
          </div>
        </div>
      </div>

      <Card className="surface-panel border-0">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Rechercher par email, action, type..."
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={actionFilter} onValueChange={(v) => { if (v !== null) { setActionFilter(v); setPage(1); } }}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a === 'all' ? 'Toutes les actions' : (ACTION_LABELS[a] || a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={(v) => { if (v !== null) { setEntityFilter(v); setPage(1); } }}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Type d'entité" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e === 'all' ? 'Tous les types' : getEntityLabel(e)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={(v) => { if (v !== null) { setRoleFilter(v); setPage(1); } }}>
                <SelectTrigger className="w-40">
                  <User className="mr-2 size-4" />
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r === 'all' ? 'Tous les rôles' : r === 'admin' ? 'Admin' : r === 'exposant' ? 'Exposant' : 'Visiteur'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-40"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-40"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-panel border-0">
        <CardHeader>
          <CardTitle>Journal d&apos;activité</CardTitle>
          <CardDescription>
            {total} entrée(s) — Page {page}/{totalPages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="surface-subtle py-12 text-center">
              <History className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aucune entrée trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Acteur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="size-3" />
                          {new Date(log.created_at).toLocaleString(locale === 'en' ? 'en-US' : 'fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {(log.actor_email || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{log.actor_email || 'Inconnu'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full text-xs">
                          {log.actor_role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full ${getActionColor(log.action)}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getEntityLabel(log.entity_type)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.entity_id ? log.entity_id.slice(0, 8) + '...' : '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
