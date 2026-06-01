'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabaseClient } from '@/lib/supabase/client';
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
      toast.error('Erreur', { description: 'Impossible de charger les signalements.' });
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

  const updateReportStatus = async (reportId: string, newStatus: 'reviewed' | 'dismissed' | 'actioned') => {
    try {
      const { error } = await supabaseClient
        .from('reports')
        .update({ status: newStatus, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', reportId);

      if (error) throw error;
      
      toast.success('Statut mis à jour', { description: `Signalement marqué comme ${newStatus}` });
      loadReports();
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error('Erreur', { description: "Impossible de mettre à jour le signalement." });
    }
  };

  const suspendAccount = async (profileId: string, email: string) => {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ account_status: 'suspended', suspended_at: new Date().toISOString() })
        .eq('id', profileId);
        
      if (error) throw error;

      toast.success('Compte suspendu', { description: `Le compte ${email} a été suspendu.` });
      loadReports();
    } catch (err: any) {
      console.error('Suspension error:', err);
      toast.error('Erreur', { description: "Impossible de suspendre le compte." });
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
          <h1 className="text-2xl font-bold tracking-tight">Modération des Signalements</h1>
          <p className="text-muted-foreground">
            Gérez les signalements (spam, harcèlement) et modérez les comptes signalés.
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
                  placeholder="Rechercher par nom..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="reviewed">Examiné</SelectItem>
                  <SelectItem value="actioned">Action prise</SelectItem>
                  <SelectItem value="dismissed">Classé sans suite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadReports} disabled={loading}>
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Signalé par</TableHead>
                  <TableHead>Compte signalé</TableHead>
                  <TableHead>Raison / Détails</TableHead>
                  <TableHead>Statut du compte</TableHead>
                  <TableHead>Statut du signalement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      Aucun signalement trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(report.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{report.reporter?.full_name || 'Inconnu'}</div>
                        <div className="text-xs text-muted-foreground">{report.reporter?.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-destructive">{report.reported?.full_name || 'Inconnu'}</div>
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
                              <span className="sr-only">Actions</span>
                              <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl w-full" >
                            {report.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => updateReportStatus(report.id, 'reviewed')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Marquer comme examiné
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateReportStatus(report.id, 'dismissed')}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Classer sans suite
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                suspendAccount(report.reported.id, report.reported.email);
                                updateReportStatus(report.id, 'actioned');
                              }}
                              disabled={report.reported?.account_status === 'suspended'}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspendre ce compte
                            </DropdownMenuItem>
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
