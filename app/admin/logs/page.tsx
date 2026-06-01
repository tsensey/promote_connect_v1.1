'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Download,
  Filter,
  History,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
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
import { AdminPagination } from '@/components/shared/AdminPagination';


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
  create_profiles: 'admin.logs.action_create_profiles',
  update_profiles: 'admin.logs.action_update_profiles',
  delete_profiles: 'admin.logs.action_delete_profiles',
  create_exposants: 'admin.logs.action_create_exposants',
  update_exposants: 'admin.logs.action_update_exposants',
  delete_exposants: 'admin.logs.action_delete_exposants',
  create_espaces: 'admin.logs.action_create_espaces',
  update_espaces: 'admin.logs.action_update_espaces',
  delete_espaces: 'admin.logs.action_delete_espaces',
  create_evenements: 'admin.logs.action_create_evenements',
  update_evenements: 'admin.logs.action_update_evenements',
  delete_evenements: 'admin.logs.action_delete_evenements',
  create_support_tickets: 'admin.logs.action_create_tickets',
  update_support_tickets: 'admin.logs.action_update_tickets',
  delete_support_tickets: 'admin.logs.action_delete_tickets',
  create_messages: 'admin.logs.action_create_messages',
  create_rendez_vous: 'admin.logs.action_create_rdv',
  update_rendez_vous: 'admin.logs.action_update_rdv',
  delete_rendez_vous: 'admin.logs.action_delete_rdv',
  create_posts: 'admin.logs.action_create_posts',
};

function getActionColor(action: string): string {
  if (action.startsWith('create')) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  if (action.startsWith('update')) return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
  if (action.startsWith('delete')) return 'bg-red-500/10 text-red-700 dark:text-red-300';
  return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
}

function getEntityLabel(type: string): string {
  const labels: Record<string, string> = {
    profiles: 'admin.logs.entity_profiles',
    exposants: 'admin.logs.entity_exposants',
    espaces: 'admin.logs.entity_espaces',
    evenements: 'admin.logs.entity_evenements',
    support_tickets: 'admin.logs.entity_tickets',
    messages: 'admin.logs.entity_messages',
    rendez_vous: 'admin.logs.entity_rdv',
    posts: 'admin.logs.entity_posts',
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
  const limit = 10;

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    try {
      let query = supabaseClient.from('audit_logs').select('*', { count: 'exact' });

      if (search) {
        query = query.or(`actor_email.ilike.%${search}%,action.ilike.%${search}%,entity_type.ilike.%${search}%`);
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (roleFilter !== 'all') {
        query = query.eq('actor_role', roleFilter);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const offset = (page - 1) * limit;
      const { data, count, error } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error(t('admin.logs.toast_load_error'));
        return;
      }

      setLogs((data || []) as AuditLog[]);
      setTotal(count || 0);
    } catch {
      toast.error(t('admin.logs.toast_network_error'));
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, entityFilter, roleFilter, startDate, endDate]);

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
    try {
      let query = supabaseClient.from('audit_logs').select('*');

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (roleFilter !== 'all') {
        query = query.eq('actor_role', roleFilter);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: allLogs, error } = await query
        .limit(5000)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const header = t('admin.logs.csv_header');
      const rows = (allLogs || []).map((log) =>
        [
          new Date(log.created_at ?? '').toLocaleString(locale === 'en' ? 'en-US' : 'fr-FR'),
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
      toast.error(t('admin.logs.toast_export_error'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            {t('admin.logs.title')}
          </p>
          <h1 className="text-4xl text-foreground">{t('admin.logs.subtitle')}</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {t('admin.logs.desc')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={handleExportCSV}>
            <Download className="mr-2 size-4" />
            {t('admin.logs.export')}
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => { setPage(1); void fetchLogs(); }}>
            <RefreshCw className="mr-2 size-4" />
            {t('admin.logs.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="surface-panel flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">{t('admin.logs.total_actions')}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stats.total}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
            <History className="size-5" />
          </div>
        </div>
        <div className="surface-panel flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">{t('admin.logs.creates')}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stats.creates}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <History className="size-5" />
          </div>
        </div>
        <div className="surface-panel flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">{t('admin.logs.updates')}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stats.updates}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <History className="size-5" />
          </div>
        </div>
        <div className="surface-panel flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">{t('admin.logs.deletes')}</p>
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
                placeholder={t('admin.logs.search_placeholder')}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={actionFilter} onValueChange={(v) => { if (v !== null) { setActionFilter(v); setPage(1); } }}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder={t('admin.logs.filter_action_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a === 'all' ? t('admin.logs.filter_all_actions') : t(ACTION_LABELS[a] || a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={(v) => { if (v !== null) { setEntityFilter(v); setPage(1); } }}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={t('admin.logs.filter_entity_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e === 'all' ? t('admin.logs.filter_all_types') : t(getEntityLabel(e))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={(v) => { if (v !== null) { setRoleFilter(v); setPage(1); } }}>
                <SelectTrigger className="w-40">
                  <User className="mr-2 size-4" />
                  <SelectValue placeholder={t('admin.logs.filter_role_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r === 'all' ? t('admin.logs.filter_all_roles') : r === 'admin' ? t('admin.logs.role_admin') : r === 'exposant' ? t('admin.logs.role_exposant') : t('admin.logs.role_visitor')}
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
          <CardTitle>{t('admin.logs.list_title')}</CardTitle>
          <CardDescription>
            {t('admin.logs.entries_count', { total })} — {t('admin.logs.page_info', { page, total: totalPages || 1 })}
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
              <p className="text-sm text-muted-foreground">{t('admin.logs.no_results')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.logs.col_date')}</TableHead>
                    <TableHead>{t('admin.logs.col_actor')}</TableHead>
                    <TableHead>{t('admin.logs.col_role')}</TableHead>
                    <TableHead>{t('admin.logs.col_action')}</TableHead>
                    <TableHead>{t('admin.logs.col_type')}</TableHead>
                    <TableHead className="text-right">{t('admin.logs.col_details')}</TableHead>
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
                          <span className="text-sm font-medium">{log.actor_email || t('admin.logs.unknown')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full text-xs">
                          {log.actor_role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full ${getActionColor(log.action)}`}>
                          {t(ACTION_LABELS[log.action] || log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t(getEntityLabel(log.entity_type))}
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
            <AdminPagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={setPage} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
