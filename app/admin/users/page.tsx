'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ban,
  Building2,
  CheckCircle2,
  Copy,
  Globe2,
  KeyRound,
  Store,
  Loader2,
  Mail,
  MoreVertical,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  company: string | null;
  role: string | null;
  sector: string | null;
  country: string | null;
  pavillon: string | null;
  is_active: boolean;
  access_level: string;
  created_at: string;
  exposant_id: string | null;
  subscription_ends_at: string | null;
  subscription_tier: string | null;
}

const SECTORS = [
  'Agriculture',
  'Agroalimentaire',
  'Artisanat',
  'Automobile',
  'Banque & Finance',
  'BTP & Construction',
  'Commerce',
  'Communication & Medias',
  'Education & Formation',
  'Energie',
  'Hotellerie & Restauration',
  'Immobilier',
  'Industrie',
  'Informatique & Tech',
  'Logistique & Transport',
  'Sante',
  'Services',
  'Telecommunications',
  'Tourisme',
];

const COUNTRIES = [
  'Algerie', 'Allemagne', 'Belgique', 'Benin', 'Burkina Faso', 'Cameroun',
  'Canada', 'Chine', 'Congo', "Cote d'Ivoire", 'Egypte', 'Espagne',
  'Etats-Unis', 'France', 'Gabon', 'Ghana', 'Guinee', 'Inde', 'Italie',
  'Japon', 'Mali', 'Maroc', 'Nigeria', 'Royaume-Uni', 'Senegal', 'Togo',
  'Tunisie', 'Turquie',
];

const NOMBRE_EMPLOYES = ['1-10', '11-50', '51-200', '200+'];

const SECTOR_KEYS: Record<string, string> = {
  'Agriculture': 'admin.sector.agriculture',
  'Agroalimentaire': 'admin.sector.agroalimentaire',
  'Artisanat': 'admin.sector.artisanat',
  'Automobile': 'admin.sector.automobile',
  'Banque & Finance': 'admin.sector.banque_finance',
  'BTP & Construction': 'admin.sector.btp_construction',
  'Commerce': 'admin.sector.commerce',
  'Communication & Medias': 'admin.sector.communication_medias',
  'Education & Formation': 'admin.sector.education_formation',
  'Energie': 'admin.sector.energie',
  'Hotellerie & Restauration': 'admin.sector.hotellerie_restauration',
  'Immobilier': 'admin.sector.immobilier',
  'Industrie': 'admin.sector.industrie',
  'Informatique & Tech': 'admin.sector.informatique_tech',
  'Logistique & Transport': 'admin.sector.logistique_transport',
  'Sante': 'admin.sector.sante',
  'Services': 'admin.sector.services',
  'Telecommunications': 'admin.sector.telecommunications',
  'Tourisme': 'admin.sector.tourisme',
};

const COUNTRY_KEYS: Record<string, string> = {
  'Algerie': 'admin.country.algerie',
  'Allemagne': 'admin.country.allemagne',
  'Belgique': 'admin.country.belgique',
  'Benin': 'admin.country.benin',
  'Burkina Faso': 'admin.country.burkina_faso',
  'Cameroun': 'admin.country.cameroun',
  'Canada': 'admin.country.canada',
  'Chine': 'admin.country.chine',
  'Congo': 'admin.country.congo',
  "Cote d'Ivoire": 'admin.country.cote_ivoire',
  'Egypte': 'admin.country.egypte',
  'Espagne': 'admin.country.espagne',
  'Etats-Unis': 'admin.country.etats_unis',
  'France': 'admin.country.france',
  'Gabon': 'admin.country.gabon',
  'Ghana': 'admin.country.ghana',
  'Guinee': 'admin.country.guinee',
  'Inde': 'admin.country.inde',
  'Italie': 'admin.country.italie',
  'Japon': 'admin.country.japon',
  'Mali': 'admin.country.mali',
  'Maroc': 'admin.country.maroc',
  'Nigeria': 'admin.country.nigeria',
  'Royaume-Uni': 'admin.country.royaume_uni',
  'Senegal': 'admin.country.senegal',
  'Togo': 'admin.country.togo',
  'Tunisie': 'admin.country.tunisie',
  'Turquie': 'admin.country.turquie',
};

export default function AdminUsersPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [lastInvite, setLastInvite] = useState<{
    email: string;
    emailSent: boolean;
  } | null>(null);
  const [espaces, setEspaces] = useState<{ id: string; code: string; nom: string; type: string }[]>([]);
  const [unlinkedExposants, setUnlinkedExposants] = useState<{ id: string; nom: string; secteur: string | null; stand: string | null }[]>([]);
  const [linkExposantMode, setLinkExposantMode] = useState(false);
  const [exposantSearch, setExposantSearch] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    company: '',
    role: 'visiteur' as string,
    espace_id: '',
    sector: '',
    country: '',
    pavillon: '',
    stand: '',
    description: '',
    website: '',
    annee_creation: '',
    nombre_employes: '',
    generate_exposant: false,
    access_level: 'classic',
    exposant_id: '',
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState<UserRow | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newAccessLevel, setNewAccessLevel] = useState('classic');
  const [newSubscriptionEndDate, setNewSubscriptionEndDate] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState<UserRow | null>(null);
  const [passwordResult, setPasswordResult] = useState<{ new_password: string; email_sent: boolean } | null>(null);

  const token = session?.access_token || null;

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const haystack = `${user.full_name} ${user.company || ''} ${user.sector || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && user.is_active)
        || (statusFilter === 'suspended' && !user.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === 'admin').length,
      exposants: users.filter((user) => user.role === 'exposant').length,
      visiteurs: users.filter((user) => user.role === 'visiteur').length,
      suspended: users.filter((user) => !user.is_active).length,
      premium: users.filter((user) => user.access_level === 'premium').length,
    }),
    [users]
  );

  const fetchUsers = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(t('admin.users.load_error'));
        return;
      }

      setUsers(payload.users || []);
    } catch {
      toast.error(t('admin.users.network_error'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    if (!showCreateDialog || !token) return;
    Promise.all([
      fetch('/api/admin/espaces', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch('/api/admin/espaces/exposants?unlinked=true', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([espData, expData]) => {
        if (espData.espaces) setEspaces(espData.espaces);
        if (expData.exposants) setUnlinkedExposants(expData.exposants);
      })
      .catch(() => { });
  }, [showCreateDialog, token]);

  async function handleCreate() {
    if (!token) {
      toast.error(t('admin.users.no_session'));
      return;
    }

    if (!form.full_name || !form.email) {
      toast.error(t('admin.users.validation'));
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || t('admin.users.create_error'));
        return;
      }

      setLastInvite({
        email: form.email,
        emailSent: payload.email_sent,
      });

      setForm({
        full_name: '',
        email: '',
        company: '',
        role: 'visiteur',
        espace_id: '',
        sector: '',
        country: '',
        pavillon: '',
        stand: '',
        description: '',
        website: '',
        annee_creation: '',
        nombre_employes: '',
        generate_exposant: false,
        access_level: 'classic',
        exposant_id: '',
      });
      setLinkExposantMode(false);
      setShowCreateDialog(false);
      toast.success(
        payload.email_sent
          ? t('admin.users.created_email')
          : t('admin.users.created_manual')
      );
      await fetchUsers();
    } catch {
      toast.error(t('admin.users.create_server_error'));
    } finally {
      setCreating(false);
    }
  }

  async function handleChangeRole(userId: string, newRoleValue: string) {
    if (!token) return;
    setActionLoading(userId);

    try {
      const body: Record<string, unknown> = { id: userId, role: newRoleValue };
      if (newAccessLevel) {
        body.access_level = newAccessLevel;
      }
      if (newAccessLevel === 'premium' && newSubscriptionEndDate) {
        body.subscription_ends_at = new Date(newSubscriptionEndDate).toISOString();
      }

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = await response.json();
        toast.error(payload.error || t('admin.users.role_change_error'));
        return;
      }

      toast.success(t('admin.users.role_changed'));
      setShowRoleDialog(null);
      await fetchUsers();
    } catch {
      toast.error(t('admin.users.role_change_network'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleSuspend(userId: string, currentlyActive: boolean) {
    if (!token) return;
    setActionLoading(userId);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: userId,
          is_active: !currentlyActive,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        toast.error(payload.error || t('admin.users.toggle_error'));
        return;
      }

      toast.success(currentlyActive ? t('admin.users.suspended') : t('admin.users.reactivated'));
      await fetchUsers();
    } catch {
      toast.error(t('admin.users.toggle_network'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetPassword(userId: string) {
    if (!token) return;
    setActionLoading(userId);

    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, send_email: true }),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || t('admin.users.reset_error'));
        return;
      }

      setPasswordResult({
        new_password: payload.new_password,
        email_sent: payload.email_sent,
      });
      toast.success(t('admin.users.reset_success'));
    } catch {
      toast.error(t('admin.users.reset_network'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(userId: string) {
    if (!token) return;

    setActionLoading(userId);

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || t('admin.users.delete_error'));
        return;
      }

      toast.success(t('admin.users.deleted'));
      setShowDeleteDialog(null);
      await fetchUsers();
    } catch {
      toast.error(t('admin.users.delete_network_error'));
    } finally {
      setActionLoading(null);
    }
  }

  async function copyInvite() {
    if (!lastInvite) return;

    const message = `Email: ${lastInvite.email}\n${t('admin.users.credentials_copied')}`;
    await navigator.clipboard.writeText(message);
    toast.success(t('admin.users.toast_copy_success'));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            {t('admin.users.title')}
          </p>
          <h1 className="text-4xl text-foreground">{t('admin.users.desc')}</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {t('admin.users.subtitle')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="rounded-xl">
          <UserPlus className="mr-2 size-4" />
          {t('admin.users.create_btn')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label={t('admin.users.total')} value={stats.total} icon={Users} tone="blue" />
        <StatCard label={t('admin.users.admins')} value={stats.admins} icon={Shield} tone="amber" />
        <StatCard label={t('admin.users.exposants')} value={stats.exposants} icon={Building2} tone="violet" />
        <StatCard label={t('admin.users.visiteurs')} value={stats.visiteurs} icon={Globe2} tone="emerald" />
        <StatCard label="Premium" value={stats.premium} icon={UserCheck} tone="amber" />
        <StatCard label={t('admin.users.suspended_label')} value={stats.suspended} icon={Ban} tone="red" />
      </div>

      {lastInvite && (
        <Card className="surface-panel border-0">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                {t('admin.users.last_created')}
              </p>
              <p className="text-lg font-semibold text-foreground">{lastInvite.email}</p>
              <p className="text-sm text-muted-foreground">
                {lastInvite.emailSent
                  ? t('admin.users.email_sent')
                  : t('admin.users.email_not_sent')}
              </p>
            </div>
            <Button variant="outline" onClick={copyInvite} className="rounded-xl bg-white/80">
              <Copy className="mr-2 size-4" />
              {t('admin.users.copy_credentials')}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="surface-panel border-0">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('admin.users.search')}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'exposant', 'visiteur', 'admin'].map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => setRoleFilter(role)}
                >
                  {role === 'all' ? t('admin.users.all_roles') : role}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'suspended'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? t('admin.users.all_status') : status === 'active' ? t('admin.users.active_status') : t('admin.users.suspended_status')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-panel border-0">
        <CardHeader>
          <CardTitle>{t('admin.users.list_title')}</CardTitle>
          <CardDescription>
            {t('admin.users.list_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="surface-subtle py-12 text-center">
              <Users className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('admin.users.no_results')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.users.col_user')}</TableHead>
                    <TableHead>{t('admin.users.col_role')}</TableHead>
                    <TableHead>Accès</TableHead>
                    <TableHead>{t('admin.users.col_status')}</TableHead>
                    <TableHead>{t('admin.users.col_profile')}</TableHead>
                    <TableHead>{t('admin.users.col_creation')}</TableHead>
                    <TableHead className="text-right">{t('admin.users.col_actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 border border-border/70">
                            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                              {user.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {user.full_name}
                            </p>
                            {user.email && (
                              <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            )}
                            <p className="truncate text-xs text-muted-foreground">
                              {[user.company, user.sector, user.country].filter(Boolean).join(' - ') || t('admin.users.profile_title')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full">
                          {user.role === 'admin' ? t('admin.logs.role_admin') : user.role === 'exposant' ? t('admin.logs.role_exposant') : t('admin.logs.role_visitor')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.access_level === 'premium' ? 'default' : 'outline'}
                          className={`rounded-full ${user.access_level === 'premium'
                            ? 'bg-amber-500/15 text-amber-700 border-amber-200'
                            : 'text-muted-foreground'
                            }`}
                        >
                          {user.access_level === 'premium' ? 'Premium' : 'Classic'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="default" className="rounded-full bg-emerald-500/15 text-emerald-700">
                            <CheckCircle2 className="mr-1 size-3" />
                            {t('admin.users.active_badge')}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="rounded-full">
                            <Ban className="mr-1 size-3" />
                            {t('admin.users.suspended_badge')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.role === 'exposant'
                          ? user.company || t('admin.users.pavillon', { pavillon: user.pavillon || '-' })
                          : user.company || t('admin.users.account_type')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}>
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl w-full">
                            <DropdownMenuItem
                              onClick={() => {
                                setShowRoleDialog(user);
                                setNewRole(user.role || 'visiteur');
                                setNewAccessLevel(user.access_level || 'classic');
                                setNewSubscriptionEndDate(
                                  user.subscription_ends_at
                                    ? new Date(user.subscription_ends_at).toISOString().split('T')[0]
                                    : ''
                                );
                              }}
                            >
                              <UserCheck className="mr-2 size-4" />
                              <span className="truncate">
                                {t('admin.users.role_change_menu')}
                              </span>
                            </DropdownMenuItem>
                            {user.role === 'exposant' && user.exposant_id && (
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin/exposants/${user.exposant_id}`)}
                              >
                                <Store className="mr-2 size-4" />
                                {t('admin.users.vitrine_menu')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setShowPasswordDialog(user);
                                setPasswordResult(null);
                              }}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              ) : (
                                <KeyRound className="mr-2 size-4" />
                              )}
                              {t('admin.users.reset_menu')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleSuspend(user.id, user.is_active)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              ) : user.is_active ? (
                                <Ban className="mr-2 size-4" />
                              ) : (
                                <CheckCircle2 className="mr-2 size-4" />
                              )}
                              {user.is_active ? t('admin.users.suspend_btn') : t('admin.users.reactivate_btn')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setShowDeleteDialog(user.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              {t('admin.users.delete_btn')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && paginatedUsers.length > 0 && (
            <AdminPagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.users.form_title')}</DialogTitle>
            <DialogDescription>
              {t('admin.users.form_desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t('admin.users.form_full_name')}</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                  placeholder={t('admin.users.form_full_name_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('admin.users.form_email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder={t('admin.users.form_email_placeholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">{t('admin.users.form_company')}</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                placeholder={t('admin.users.form_company_placeholder')}
              />
            </div>

            <div className="space-y-3">
              <Label>{t('admin.users.form_role')}</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={form.role === 'visiteur' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() =>
                    setForm({
                      ...form,
                      role: 'visiteur',
                      generate_exposant: false,
                    })
                  }
                >
                  {t('admin.users.form_visiteur')}
                </Button>
                <Button
                  type="button"
                  variant={form.role === 'exposant' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() =>
                    setForm({
                      ...form,
                      role: 'exposant',
                      generate_exposant: !linkExposantMode,
                      exposant_id: '',
                    })
                  }
                >
                  {t('admin.users.form_exposant')}
                </Button>
                <Button
                  type="button"
                  variant={form.role === 'admin' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() =>
                    setForm({
                      ...form,
                      role: 'admin',
                      generate_exposant: false,
                    })
                  }
                >
                  {t('admin.users.form_admin_role')}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Niveau d{'\u2019'}accès</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={form.access_level === 'classic' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setForm({ ...form, access_level: 'classic' })}
                >
                  Classic
                </Button>
                <Button
                  type="button"
                  variant={form.access_level === 'premium' ? 'default' : 'outline'}
                  className="rounded-xl bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                  onClick={() => setForm({ ...form, access_level: 'premium' })}
                >
                  Premium
                </Button>
              </div>
            </div>

            {form.role === 'exposant' && (
              <>
                <div className="space-y-3">
                  <Label>{t('admin.users.form_exposant_option')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={!linkExposantMode ? 'default' : 'outline'}
                      className="rounded-xl"
                      onClick={() => {
                        setLinkExposantMode(false);
                        setForm({ ...form, generate_exposant: true, exposant_id: '' });
                      }}
                    >
                      {t('admin.users.form_exposant_create')}
                    </Button>
                    <Button
                      type="button"
                      variant={linkExposantMode ? 'default' : 'outline'}
                      className="rounded-xl"
                      onClick={() => {
                        setLinkExposantMode(true);
                        setForm({ ...form, generate_exposant: false });
                      }}
                    >
                      {t('admin.users.form_exposant_link')}
                    </Button>
                  </div>
                </div>

                {linkExposantMode ? (
                  <div className="space-y-2">
                    <Label>{t('admin.users.form_link_exposant')}</Label>
                    <Input
                      placeholder={t('admin.users.form_link_exposant_placeholder')}
                      value={exposantSearch}
                      onChange={(e) => setExposantSearch(e.target.value)}
                    />
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                      {unlinkedExposants
                        .filter((e) => e.nom.toLowerCase().includes(exposantSearch.toLowerCase()))
                        .map((exp) => (
                          <button
                            key={exp.id}
                            type="button"
                            onClick={() => setForm({ ...form, exposant_id: exp.id })}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${form.exposant_id === exp.id ? 'bg-primary/10 font-medium text-primary' : ''
                              }`}
                          >
                            <span>{exp.nom}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {[exp.secteur, exp.stand].filter(Boolean).join(' · ') || ''}
                            </span>
                          </button>
                        ))}
                      {unlinkedExposants.filter((e) => e.nom.toLowerCase().includes(exposantSearch.toLowerCase())).length === 0 && (
                        <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                          {t('admin.users.form_link_exposant_no_results')}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.users.form_link_exposant_hint')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sector">{t('admin.users.form_sector')}</Label>
                        <select
                          id="sector"
                          value={form.sector}
                          onChange={(event) => setForm({ ...form, sector: event.target.value })}
                          className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                        >
                          <option value="">{t('admin.users.form_select')}</option>
                          {SECTORS.map((sector) => (
                            <option key={sector} value={sector}>{t(SECTOR_KEYS[sector] || sector)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">{t('admin.users.form_country')}</Label>
                        <select
                          id="country"
                          value={form.country}
                          onChange={(event) => setForm({ ...form, country: event.target.value })}
                          className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                        >
                          <option value="">{t('admin.users.form_select')}</option>
                          {COUNTRIES.map((country) => (
                            <option key={country} value={country}>{t(COUNTRY_KEYS[country] || country)}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="espace_id">{t('admin.users.form_pavillon')}</Label>
                      <select
                        id="espace_id"
                        value={form.espace_id}
                        onChange={(event) => {
                          const espace = espaces.find((e) => e.id === event.target.value);
                          setForm({
                            ...form,
                            espace_id: event.target.value,
                            pavillon: espace?.code || '',
                          });
                        }}
                        className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                      >
                        <option value="">{t('admin.users.form_select_space')}</option>
                        {espaces.map((espace) => (
                          <option key={espace.id} value={espace.id}>
                            {espace.type === 'pavillon' ? t('admin.espaces.type_pavillon') : t('admin.espaces.type_espace')} {espace.code} — {espace.nom}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.users.form_space_hint')}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="stand">{t('admin.users.form_stand')}</Label>
                        <Input
                          id="stand"
                          value={form.stand}
                          onChange={(event) => setForm({ ...form, stand: event.target.value })}
                          placeholder={t('admin.users.form_stand_placeholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">{t('admin.users.form_website')}</Label>
                        <Input
                          id="website"
                          type="url"
                          value={form.website}
                          onChange={(event) => setForm({ ...form, website: event.target.value })}
                          placeholder={t('admin.users.form_website_placeholder')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">{t('admin.users.form_description')}</Label>
                      <textarea
                        id="description"
                        value={form.description}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                        placeholder={t('admin.users.form_description_placeholder')}
                        className="flex min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="annee_creation">{t('admin.users.form_year')}</Label>
                        <Input
                          id="annee_creation"
                          value={form.annee_creation}
                          onChange={(event) => setForm({ ...form, annee_creation: event.target.value })}
                          placeholder={t('admin.users.form_year_placeholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nombre_employes">{t('admin.users.form_employees')}</Label>
                        <select
                          id="nombre_employes"
                          value={form.nombre_employes}
                          onChange={(event) => setForm({ ...form, nombre_employes: event.target.value })}
                          className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                        >
                          <option value="">{t('admin.users.form_employees_placeholder')}</option>
                          {NOMBRE_EMPLOYES.map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowCreateDialog(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="button" className="rounded-xl" disabled={creating} onClick={handleCreate}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('admin.users.form_creating')}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 size-4" />
                  {t('admin.users.form_submit_email')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.users.delete_title')}</DialogTitle>
            <DialogDescription>
              {t('admin.users.delete_desc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowDeleteDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={actionLoading === showDeleteDialog}
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
            >
              {actionLoading === showDeleteDialog ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              {t('admin.users.delete_permanent')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showPasswordDialog} onOpenChange={(open) => { if (!open) { setShowPasswordDialog(null); setPasswordResult(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.users.reset_title')}</DialogTitle>
            <DialogDescription>
              {showPasswordDialog
                ? `${t('admin.users.reset_for')} ${showPasswordDialog.full_name}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {passwordResult ? (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                {passwordResult.email_sent
                  ? t('admin.users.reset_email_sent')
                  : t('admin.users.reset_email_failed')}
              </p>
              <div className="rounded-xl border bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {t('admin.users.reset_new_password')}
                </p>
                <p className="text-2xl font-bold tracking-wider text-foreground text-center select-all">
                  {passwordResult.new_password}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => {
                  navigator.clipboard.writeText(passwordResult.new_password);
                  toast.success(t('admin.users.reset_copied'));
                }}
              >
                <Copy className="mr-2 size-4" />
                {t('admin.users.reset_copy_btn')}
              </Button>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                {t('admin.users.reset_confirm')}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => { setShowPasswordDialog(null); setPasswordResult(null); }}
            >
              {passwordResult ? t('common.close') : t('common.cancel')}
            </Button>
            {!passwordResult && (
              <Button
                className="rounded-xl"
                disabled={actionLoading === showPasswordDialog?.id || !showPasswordDialog}
                onClick={() => showPasswordDialog && handleResetPassword(showPasswordDialog.id)}
              >
                {actionLoading === showPasswordDialog?.id ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 size-4" />
                )}
                {t('admin.users.reset_confirm_btn')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showRoleDialog} onOpenChange={(open) => !open && setShowRoleDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('admin.users.role_title')}</DialogTitle>
            <DialogDescription>
              {showRoleDialog ? `${t('admin.users.role_for')} ${showRoleDialog.full_name}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={newRole} onValueChange={(value) => value && setNewRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.users.role_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visiteur">{t('admin.users.form_visiteur')}</SelectItem>
                  <SelectItem value="exposant">{t('admin.users.form_exposant')}</SelectItem>
                  <SelectItem value="admin">{t('admin.users.form_admin_role')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Niveau d{'\u2019'}accès</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={newAccessLevel === 'classic' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setNewAccessLevel('classic')}
                >
                  Classic
                </Button>
                <Button
                  type="button"
                  variant={newAccessLevel === 'premium' ? 'default' : 'outline'}
                  className="rounded-xl bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                  onClick={() => setNewAccessLevel('premium')}
                >
                  Premium
                </Button>
              </div>
            </div>
            {newAccessLevel === 'premium' && (
              <div className="space-y-2">
                <Label>Date de fin d'abonnement</Label>
                <Input
                  type="date"
                  value={newSubscriptionEndDate}
                  onChange={(e) => setNewSubscriptionEndDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowRoleDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              className="rounded-xl"
              disabled={actionLoading === showRoleDialog?.id || !showRoleDialog}
              onClick={() => {
                if (showRoleDialog) {
                  const updatedRole = newRole || showRoleDialog.role || 'visiteur';
                  handleChangeRole(showRoleDialog.id, updatedRole);
                }
              }}
            >
              {actionLoading === showRoleDialog?.id ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <UserCheck className="mr-2 size-4" />
              )}
              {t('admin.users.role_confirm_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'blue' | 'emerald' | 'violet' | 'amber' | 'red';
}) {
  const toneClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    red: 'bg-red-500/10 text-red-700 dark:text-red-300',
  };

  return (
    <div className="surface-panel flex items-center justify-between p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      </div>
      <div className={`flex size-12 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon className="size-5" />
      </div>
    </div>
  );
}
