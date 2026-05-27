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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
          trial_ends_at, created_at,
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
      toast.error('Erreur lors du chargement des abonnements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

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

      toast.success('Niveau d\'abonnement mis à jour');
      await fetchUsers();
    } catch (e) {
      toast.error('Erreur lors de la mise à jour de l\'abonnement');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            Abonnements v1.1
          </p>
          <h1 className="text-4xl text-foreground">Gestion des accès</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Gérez les tiers d'abonnements, les suspensions et le sponsoring des entreprises.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entreprises</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnés PAID</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Essais Gratuits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.free}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comptes Actifs</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspendus/Bloqués</CardTitle>
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
                placeholder="Rechercher une entreprise..."
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
                  {tier === 'all' ? 'Tous les Tiers' : tier === 'paid' ? 'PAID' : 'Free Trial'}
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
                  {status === 'all' ? 'Tous statuts' : status}
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
              <p className="text-sm text-muted-foreground">Aucun résultat</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
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
                        {user.subscription_tier === 'paid' ? 'PAID' : 'Free Trial'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.account_status === 'active' ? (
                          <Badge variant="default" className="rounded-full bg-emerald-500/15 text-emerald-700">
                            <CheckCircle2 className="mr-1 size-3" />
                            Actif
                          </Badge>
                        ) : user.account_status === 'suspended' ? (
                          <Badge variant="destructive" className="rounded-full bg-orange-500/15 text-orange-700 border-orange-200">
                            <Ban className="mr-1 size-3" />
                            Suspendu
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="rounded-full">
                            <Ban className="mr-1 size-3" />
                            Bloqué
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.subscription_tier === 'paid' ? (
                        <div>
                          Expire le: <br/>
                          {user.subscription_ends_at ? new Date(user.subscription_ends_at).toLocaleDateString() : 'N/A'}
                        </div>
                      ) : (
                        <div>
                          Essai termine le: <br/>
                          {user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString() : 'N/A'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}>
                          <MoreVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={() => handleUpdateTier(user.id, user.subscription_tier === 'paid' ? 'free_trial' : 'paid')}
                            disabled={actionLoading === user.id}
                          >
                            <Crown className="mr-2 size-4" />
                            {user.subscription_tier === 'paid' ? 'Passer en Free Trial' : 'Passer en PAID'}
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
        </CardContent>
      </Card>
    </div>
  );
}
