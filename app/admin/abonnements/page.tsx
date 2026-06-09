'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ban,
  Building2,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Search,
  Star,
  Shield,
  CreditCard,
  Crown
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { supabaseClient } from '@/lib/supabase/client';
import { AdminPagination } from '@/components/shared/AdminPagination';


interface SubscriptionRow {
  id: string;
  full_name: string;
  company: string | null;
  role: string | null;
  account_status: string | null;
  subscription_tier: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  is_featured: boolean;
  quota_override_messages: number | null;
  quota_override_posts: number | null;
  quota_override_vitrine: number | null;
}

export default function AdminAbonnementsPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const [users, setUsers] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'blocked'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDateDialog, setShowDateDialog] = useState<SubscriptionRow | null>(null);
  const [newDate, setNewDate] = useState('');
  const [showQuotaDialog, setShowQuotaDialog] = useState<SubscriptionRow | null>(null);
  const [quotaForm, setQuotaForm] = useState({ messages: '', posts: '', vitrine: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteExposant, setDeleteExposant] = useState(true);

  const token = session?.access_token || null;

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Filtrer les admins
      if (user.role === 'admin') return false;
      
      const haystack = `${user.full_name} ${user.company || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesTier = tierFilter === 'all' || user.subscription_tier === tierFilter;
      const matchesStatus = statusFilter === 'all' || user.account_status === statusFilter;
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [tierFilter, search, statusFilter, users]);

  const stats = useMemo(
    () => ({
      total: filteredUsers.length,
      paid: filteredUsers.filter((user) => user.subscription_tier === 'paid').length,
      free: filteredUsers.filter((user) => user.subscription_tier === 'free_trial').length,
      active: filteredUsers.filter((user) => user.account_status === 'active').length,
      suspended: filteredUsers.filter((user) => user.account_status === 'suspended').length,
    }),
    [filteredUsers]
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    try {
      // Récupérer les profils et joindre les exposants pour is_featured
      const { data, error } = await supabaseClient
        .from('profiles')
        .select(`
          id, full_name, company, role, account_status, subscription_tier, 
          trial_ends_at, created_at, quota_override_messages, quota_override_posts, quota_override_vitrine,
          exposants!exposants_profile_id_fkey(is_featured)
        `)
        .neq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = data.map((d: any) => ({
        ...d,
        is_featured: d.exposants?.[0]?.is_featured || false
      }));

      setUsers(formatted);
    } catch {
      toast.error(t('admin.abonnements.toast_load_error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, tierFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  async function handleUpdateTier(userId: string, newTier: string) {
    if (!token) return;
    setActionLoading(userId);

    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ 
          subscription_tier: newTier,
          // Si on passe en PAID, on pourrait définir subscription_ends_at à +1 an ici
          // Si on repasse en free_trial, on efface l'abonnement
          ...(newTier === 'paid' 
              ? { subscription_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() } 
              : { subscription_ends_at: null })
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success(t('admin.abonnements.toast_tier_updated'));
      await fetchUsers();
    } catch (e) {
      toast.error(t('admin.abonnements.toast_update_error'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateDate() {
    if (!token || !showDateDialog) return;
    setActionLoading(showDateDialog.id);

    try {
      const field = showDateDialog.subscription_tier === 'paid' ? 'subscription_ends_at' : 'trial_ends_at';
      const dateValue = newDate ? new Date(newDate).toISOString() : null;
      
      const updateData = field === 'subscription_ends_at' 
        ? { subscription_ends_at: dateValue } 
        : { trial_ends_at: dateValue };

      const { error } = await supabaseClient
        .from('profiles')
        .update(updateData)
        .eq('id', showDateDialog.id);

      if (error) throw error;

      toast.success(t('admin.abonnements.toast_date_updated'));
      setShowDateDialog(null);
      await fetchUsers();
    } catch {
      toast.error(t('admin.abonnements.toast_date_error'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateStatus(userId: string, newStatus: string) {
    if (!token) return;
    setActionLoading(userId);

    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ 
          account_status: newStatus,
          is_active: newStatus === 'active', // Legacy compat
          ...(newStatus === 'suspended' ? { suspended_at: new Date().toISOString() } : {}),
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Statut du compte mis à jour');
      await fetchUsers();
    } catch {
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateQuota() {
    if (!token || !showQuotaDialog) return;
    setActionLoading(showQuotaDialog.id);

    try {
      const updateData: Record<string, unknown> = {};
      if (quotaForm.messages !== '') updateData.quota_override_messages = Number(quotaForm.messages);
      else updateData.quota_override_messages = null;
      if (quotaForm.posts !== '') updateData.quota_override_posts = Number(quotaForm.posts);
      else updateData.quota_override_posts = null;
      if (quotaForm.vitrine !== '') updateData.quota_override_vitrine = Number(quotaForm.vitrine);
      else updateData.quota_override_vitrine = null;

      const { error } = await supabaseClient
        .from('profiles')
        .update(updateData as never)
        .eq('id', showQuotaDialog.id);

      if (error) throw error;

      toast.success('Quotas individuels mis à jour');
      setShowQuotaDialog(null);
      await fetchUsers();
    } catch {
      toast.error('Erreur lors de la mise à jour des quotas');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleFeatured(userId: string, currentlyFeatured: boolean) {
    setActionLoading(userId);

    try {
      // Trouver l'exposant correspondant
      const { data: exposant, error: findError } = await supabaseClient
        .from('exposants')
        .select('id')
        .eq('profile_id', userId)
        .single();

      if (findError || !exposant) throw new Error('Exposant non trouvé');

      const { error } = await supabaseClient
        .from('exposants')
        .update({ is_featured: !currentlyFeatured })
        .eq('id', exposant.id);

      if (error) throw error;

      toast.success(currentlyFeatured ? 'Sponsoring retiré' : 'Sponsoring activé');
      await fetchUsers();
    } catch {
      toast.error('Erreur lors de la mise à jour du sponsoring');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkDelete() {
    if (!token || selectedIds.length === 0) return;

    setActionLoading('bulk');

    try {
      const response = await fetch(`/api/admin/users?ids=${selectedIds.join(',')}&deleteExposant=${deleteExposant}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || 'Erreur lors de la suppression en masse');
        return;
      }

      toast.success('Utilisateurs supprimés avec succès');
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      await fetchUsers();
    } catch {
      toast.error('Erreur réseau lors de la suppression en masse');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            {t('admin.abonnements.title')} v1.1
          </p>
          <h1 className="text-4xl text-foreground">{t('admin.abonnements.title')}</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {t('admin.abonnements.desc')}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteConfirm(true)} className="rounded-xl">
              <Ban className="mr-2 size-4" /> Supprimer ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.abonnements.card_total')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.abonnements.card_paid')}</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.abonnements.card_free')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.free}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.abonnements.card_active')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.abonnements.card_suspended')}</CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspended}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-panel border-0">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('admin.abonnements.search')}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'paid', 'free_trial'].map((tier) => (
                <Button
                  key={tier}
                  variant={tierFilter === tier ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => setTierFilter(tier)}
                >
                  {tier === 'all' ? t('admin.abonnements.all_tiers') : tier === 'paid' ? t('admin.abonnements.badge_paid') : t('admin.abonnements.badge_free')}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'suspended', 'blocked'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? t('admin.abonnements.all_statuses') : status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-panel border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="surface-subtle py-12 text-center">
              <Shield className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('admin.abonnements.no_results')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedIds.includes(u.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newIds = new Set(selectedIds);
                          paginatedUsers.forEach(u => newIds.add(u.id));
                          setSelectedIds(Array.from(newIds));
                        } else {
                          const newIds = selectedIds.filter(id => !paginatedUsers.some(u => u.id === id));
                          setSelectedIds(newIds);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>{t('admin.abonnements.col_company')}</TableHead>
                  <TableHead>{t('admin.abonnements.col_tier')}</TableHead>
                  <TableHead>{t('admin.abonnements.col_status')}</TableHead>
                  <TableHead>{t('admin.abonnements.col_dates')}</TableHead>
                  <TableHead className="text-right">{t('admin.abonnements.col_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds([...selectedIds, user.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== user.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 border border-border/70">
                          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                            {user.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground flex items-center gap-2">
                            {user.company || user.full_name}
                            {user.is_featured && (
                              <Star className="size-3 text-amber-500 fill-amber-500" />
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.full_name} • {user.role}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.subscription_tier === 'paid' ? 'default' : 'outline'}
                        className={`rounded-full ${
                          user.subscription_tier === 'paid'
                            ? 'bg-amber-500/15 text-amber-700 border-amber-200'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {user.subscription_tier === 'paid' ? t('admin.abonnements.badge_paid') : t('admin.abonnements.badge_free')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.account_status === 'active' ? (
                          <Badge variant="default" className="rounded-full bg-emerald-500/15 text-emerald-700">
                            <CheckCircle2 className="mr-1 size-3" />
                            {t('admin.abonnements.badge_active')}
                          </Badge>
                        ) : user.account_status === 'suspended' ? (
                          <Badge variant="destructive" className="rounded-full bg-orange-500/15 text-orange-700 border-orange-200">
                            <Ban className="mr-1 size-3" />
                            {t('admin.abonnements.badge_suspended')}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="rounded-full">
                            <Ban className="mr-1 size-3" />
                            {t('admin.abonnements.badge_blocked')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.subscription_tier === 'paid' ? (
                        <div>
                          {t('admin.abonnements.label_expires')} <br/>
                          {user.subscription_ends_at ? new Date(user.subscription_ends_at).toLocaleDateString() : 'N/A'}
                        </div>
                      ) : (
                        <div>
                          {t('admin.abonnements.label_trial_ends')} <br/>
                          {user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString() : 'N/A'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}>
                          <MoreVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-full">
                          <DropdownMenuItem
                            onClick={() => handleUpdateTier(user.id, user.subscription_tier === 'paid' ? 'free_trial' : 'paid')}
                            disabled={actionLoading === user.id}
                          >
                            <Crown className="mr-2 size-4" />
                            {user.subscription_tier === 'paid' ? 'Passer en Free Trial' : 'Passer en PAID'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => {
                              setShowDateDialog(user);
                              const date = user.subscription_tier === 'paid' ? user.subscription_ends_at : user.trial_ends_at;
                              setNewDate(date ? new Date(date).toISOString().split('T')[0] : '');
                            }}
                            disabled={actionLoading === user.id}
                          >
                            <CreditCard className="mr-2 size-4" />
                            Modifier la date d'expiration
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setShowQuotaDialog(user);
                              setQuotaForm({
                                messages: user.quota_override_messages?.toString() ?? '',
                                posts: user.quota_override_posts?.toString() ?? '',
                                vitrine: user.quota_override_vitrine?.toString() ?? '',
                              });
                            }}
                            disabled={actionLoading === user.id}
                          >
                            <Shield className="mr-2 size-4" />
                            Modifier les quotas individuels
                          </DropdownMenuItem>
                          
                          {user.subscription_tier === 'paid' && user.role === 'exposant' && (
                            <DropdownMenuItem
                              onClick={() => handleToggleFeatured(user.id, user.is_featured)}
                              disabled={actionLoading === user.id}
                            >
                              <Star className="mr-2 size-4" />
                              {user.is_featured ? 'Retirer le sponsoring' : 'Activer le sponsoring'}
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {user.account_status !== 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(user.id, 'active')}
                              disabled={actionLoading === user.id}
                            >
                              <CheckCircle2 className="mr-2 size-4" />
                              Réactiver
                            </DropdownMenuItem>
                          )}
                          {user.account_status !== 'suspended' && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(user.id, 'suspended')}
                              disabled={actionLoading === user.id}
                            >
                              <Ban className="mr-2 size-4" />
                              Suspendre
                            </DropdownMenuItem>
                          )}
                          {user.account_status !== 'blocked' && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(user.id, 'blocked')}
                              disabled={actionLoading === user.id}
                              className="text-destructive"
                            >
                              <Ban className="mr-2 size-4" />
                              Bloquer définitivement
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
          
          {!loading && filteredUsers.length > 0 && (
            <AdminPagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!showDateDialog} onOpenChange={(open) => !open && setShowDateDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la date d'expiration</DialogTitle>
            <DialogDescription>
              {showDateDialog && (
                <>
                  Définir la nouvelle date de fin {showDateDialog.subscription_tier === 'paid' ? "d'abonnement" : "d'essai"} pour {showDateDialog.company || showDateDialog.full_name}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de fin</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowDateDialog(null)}>
              Annuler
            </Button>
            <Button className="rounded-xl" disabled={actionLoading === showDateDialog?.id} onClick={handleUpdateDate}>
              {actionLoading === showDateDialog?.id && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showQuotaDialog} onOpenChange={(open) => !open && setShowQuotaDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier les quotas individuels</DialogTitle>
            <DialogDescription>
              {showQuotaDialog && (
                <>Définir des limites personnalisées pour {showQuotaDialog.company || showQuotaDialog.full_name}. Laisser vide pour utiliser les valeurs par défaut.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Messages quotidiens max</label>
              <Input
                type="number"
                min="0"
                placeholder="Défaut plateforme"
                value={quotaForm.messages}
                onChange={(e) => setQuotaForm({ ...quotaForm, messages: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Publications max</label>
              <Input
                type="number"
                min="0"
                placeholder="Défaut plateforme"
                value={quotaForm.posts}
                onChange={(e) => setQuotaForm({ ...quotaForm, posts: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Offres vitrine max</label>
              <Input
                type="number"
                min="0"
                placeholder="Défaut plateforme"
                value={quotaForm.vitrine}
                onChange={(e) => setQuotaForm({ ...quotaForm, vitrine: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowQuotaDialog(null)}>
              Annuler
            </Button>
            <Button className="rounded-xl" disabled={actionLoading === showQuotaDialog?.id} onClick={handleUpdateQuota}>
              {actionLoading === showQuotaDialog?.id && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression en masse</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer les {selectedIds.length} utilisateurs sélectionnés ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteExposant}
                onChange={(e) => setDeleteExposant(e.target.checked)}
                className="mt-0.5 size-4"
              />
              <div className="text-sm">
                <span className="font-medium">Supprimer aussi les profils exposants liés</span>
                <p className="mt-0.5 text-muted-foreground">
                  Si cochée, les vitrines et produits des exposants sélectionnés seront également supprimés.
                </p>
              </div>
            </label>
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => setShowBulkDeleteConfirm(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl"
                disabled={actionLoading === 'bulk'}
                onClick={handleBulkDelete}
              >
                {actionLoading === 'bulk' && <Loader2 className="mr-2 size-4 animate-spin" />}
                Supprimer définitivement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
