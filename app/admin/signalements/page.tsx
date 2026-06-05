'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import {
  Flag,
  Loader2,
  Search,
  CheckCircle2,
  Ban,
  Trash2,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AdminPagination } from '@/components/shared/AdminPagination';
import { useTranslation } from '@/lib/i18n';


interface ReportRow {
  id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  created_at: string;
  reporter: { id: string; full_name: string; email: string };
  reported: { id: string; full_name: string; email: string; account_status: string };
}

export default function SignalementsPage() {
  const { t } = useTranslation();
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'admin')) {
      router.replace('/app');
    }
  }, [authLoading, user, profile, router]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabaseClient
        .from('reports')
        .select(`
          id, reason, details, status, created_at,
          reporter:profiles!reports_reporter_id_fkey(id, full_name),
          reported:profiles!reports_reported_id_fkey(id, full_name, account_status)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'pending' | 'reviewed' | 'dismissed' | 'actioned');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Type assertion because auth_users is a joined relation not exactly typed here
      const mappedData: ReportRow[] = (data as any[]).map(d => ({
        ...d,
        reporter: {
          id: d.reporter?.id,
          full_name: d.reporter?.full_name,
          email: 'N/A', // Email non accessible directement via profils publics
        },
        reported: {
          id: d.reported?.id,
          full_name: d.reported?.full_name,
          account_status: d.reported?.account_status,
          email: 'N/A', // Email non accessible
        }
      }));

      // In-memory text search
      if (search) {
        const lowerSearch = search.toLowerCase();
        setReports(mappedData.filter(r => 
          r.reported.full_name?.toLowerCase().includes(lowerSearch) ||
          r.reporter.full_name?.toLowerCase().includes(lowerSearch) ||
          r.reason.toLowerCase().includes(lowerSearch)
        ));
      } else {
        setReports(mappedData);
      }
    } catch (err: any) {
      console.error('Error loading reports:', err);
      toast.error(t('common.error'), { description: t('admin.signalements.toast_load_error') });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadReports();
    }
  }, [loadReports, user, profile]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE);
  const paginatedReports = reports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const updateReportStatus = async (reportId: string, newStatus: 'pending' | 'reviewed' | 'dismissed' | 'actioned') => {
    try {
      const updateData: Database['public']['Tables']['reports']['Update'] = { status: newStatus };
      if (newStatus === 'pending') {
        updateData.reviewed_by = null;
        updateData.reviewed_at = null;
        updateData.review_notes = null;
      } else {
        updateData.reviewed_by = user?.id;
        updateData.reviewed_at = new Date().toISOString();
      }

      const { error } = await supabaseClient
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;
      
      toast.success(t('admin.signalements.toast_status_updated'));
      loadReports();
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(t('common.error'), { description: t('admin.signalements.toast_update_error') });
    }
  };

  const suspendAccount = async (profileId: string, email: string) => {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          account_status: 'suspended',
          is_active: false,
          suspended_at: new Date().toISOString(),
        })
        .eq('id', profileId);
        
      if (error) throw error;

      toast.success(t('admin.signalements.toast_account_suspended'));
      loadReports();
      return true;
    } catch (err: any) {
      console.error('Suspension error:', err);
      toast.error(t('common.error'), { description: t('admin.signalements.toast_suspend_error') });
      return false;
    }
  };

  const reactivateAccount = async (profileId: string, email: string) => {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          account_status: 'active',
          is_active: true,
          suspended_at: null,
          suspended_reason: null,
        })
        .eq('id', profileId);
        
      if (error) throw error;

      toast.success(t('admin.signalements.toast_account_reactivated'));
      loadReports();
    } catch (err: any) {
      console.error('Reactivation error:', err);
      toast.error(t('common.error'), { description: t('admin.signalements.toast_reactivate_error') });
    }
  };

  if (authLoading || !user || profile?.role !== 'admin') {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
          <Flag className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.signalements.title')}</h1>
          <p className="text-muted-foreground">
            {t('admin.signalements.desc')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('admin.signalements.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('admin.signalements.all_statuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.signalements.all_statuses')}</SelectItem>
                  <SelectItem value="pending">{t('admin.signalements.pending')}</SelectItem>
                  <SelectItem value="reviewed">{t('admin.signalements.reviewed')}</SelectItem>
                  <SelectItem value="actioned">{t('admin.signalements.actioned')}</SelectItem>
                  <SelectItem value="dismissed">{t('admin.signalements.dismissed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadReports} disabled={loading}>
              {t('admin.signalements.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.signalements.col_date')}</TableHead>
                  <TableHead>{t('admin.signalements.col_reported_by')}</TableHead>
                  <TableHead>{t('admin.signalements.col_reported_account')}</TableHead>
                  <TableHead>{t('admin.signalements.col_reason')}</TableHead>
                  <TableHead>{t('admin.signalements.col_account_status')}</TableHead>
                  <TableHead>{t('admin.signalements.col_report_status')}</TableHead>
                  <TableHead className="text-right">{t('admin.abonnements.col_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {t('admin.signalements.no_results')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(report.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{report.reporter?.full_name || t('admin.signalements.unknown')}</div>
                        <div className="text-xs text-muted-foreground">{report.reporter?.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-destructive">{report.reported?.full_name || t('admin.signalements.unknown')}</div>
                        <div className="text-xs text-muted-foreground">{report.reported?.email}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="font-medium capitalize">{report.reason}</div>
                        {report.details && (
                          <div className="truncate text-xs text-muted-foreground" title={report.details}>
                            {report.details}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.reported?.account_status === 'active' ? 'outline' : 'destructive'}>
                          {report.reported?.account_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={report.status === 'pending' ? 'destructive' : report.status === 'dismissed' ? 'outline' : 'default'}
                          className="capitalize"
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                              <span className="sr-only">{t('admin.abonnements.col_actions')}</span>
                              <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl w-full" >
                            {report.status === 'pending' ? (
                              <>
                                <DropdownMenuItem onClick={() => updateReportStatus(report.id, 'reviewed')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  {t('admin.signalements.mark_reviewed')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateReportStatus(report.id, 'dismissed')}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('admin.signalements.mark_dismissed')}
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => updateReportStatus(report.id, 'pending')}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                {t('admin.signalements.mark_pending')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {report.reported?.account_status === 'suspended' ? (
                              <DropdownMenuItem
                                className="text-emerald-600 focus:text-emerald-600"
                                onClick={() => reactivateAccount(report.reported.id, report.reported.email)}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {t('admin.signalements.reactivate')}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={async () => {
                                  const ok = await suspendAccount(report.reported.id, report.reported.email);
                                  if (ok) {
                                    updateReportStatus(report.id, 'actioned');
                                  }
                                }}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                {t('admin.signalements.suspend')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {!loading && reports.length > 0 && (
            <AdminPagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
