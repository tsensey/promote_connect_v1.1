'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface AccessRow {
  id: string;
  full_name: string | null;
  company: string | null;
  role: string | null;
  is_active: boolean;
  created_at: string | null;
}

export default function AdminAccessPage() {
  const { t, locale } = useTranslation();
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<AccessRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState<AccessRow | null>(null);
  const [newRole, setNewRole] = useState('');

  const token = session?.access_token || null;

  const fetchAccounts = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (response.ok) {
        setAccounts(payload.users || []);
      }
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchAccounts(); }, [fetchAccounts]);

  const filteredAccounts = useMemo(() => {
    const query = search.toLowerCase();
    return accounts.filter((account) =>
      `${account.full_name || ''} ${account.company || ''} ${account.role || ''}`
        .toLowerCase()
        .includes(query)
    );
  }, [accounts, search]);

  const stats = useMemo(
    () => ({
      total: accounts.length,
      admins: accounts.filter((account) => account.role === 'admin').length,
      members: accounts.filter((account) => account.role !== 'admin').length,
      suspended: accounts.filter((account) => !account.is_active).length,
    }),
    [accounts]
  );

  async function handleChangeRole(userId: string, role: string) {
    if (!token) return;
    setActionLoading(userId);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userId, role }),
      });

      if (response.ok) {
        toast.success('Role modifie');
        setShowRoleDialog(null);
        await fetchAccounts();
      } else {
        const payload = await response.json();
        toast.error(payload.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur reseau');
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
        body: JSON.stringify({ id: userId, is_active: !currentlyActive }),
      });

      if (response.ok) {
        toast.success(currentlyActive ? 'Compte suspendu' : 'Compte reactive');
        await fetchAccounts();
      }
    } catch {
      toast.error('Erreur reseau');
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

      if (response.ok) {
        toast.success('Compte supprime');
        setShowDeleteDialog(null);
        await fetchAccounts();
      }
    } catch {
      toast.error('Erreur reseau');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
          {t('admin.abonnes.title')}
        </p>
        <h1 className="text-4xl text-foreground">{t('admin.abonnes.subtitle')}</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          {t('admin.abonnes.desc')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title={t('admin.abonnes.comptes')} value={stats.total} icon={Users} />
        <StatCard title={t('admin.abonnes.admins')} value={stats.admins} icon={Shield} />
        <StatCard title={t('admin.abonnes.members')} value={stats.members} icon={Users} />
        <StatCard title="Suspendus" value={stats.suspended} icon={Ban} />
      </div>

      <div className="surface-panel">
        <div className="border-b border-border/70 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('admin.abonnes.search')}
              className="pl-10"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.abonnes.col_user')}</TableHead>
              <TableHead>{t('admin.abonnes.col_company')}</TableHead>
              <TableHead>{t('admin.abonnes.col_role')}</TableHead>
              <TableHead>{t('admin.abonnes.col_access')}</TableHead>
              <TableHead>{t('admin.abonnes.col_date')}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><div className="h-5 w-32 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-24 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-16 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium text-foreground">{account.full_name || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{account.company || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full">
                      {account.role || 'visiteur'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {account.is_active ? (
                      <Badge className="rounded-full bg-emerald-500/15 text-emerald-700">
                        <CheckCircle2 className="mr-1 size-3" />
                        {t('admin.abonnes.active')}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="rounded-full">
                        <Ban className="mr-1 size-3" />
                        Suspendu
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {account.created_at ? new Date(account.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}>
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          onClick={() => {
                            setShowRoleDialog(account);
                            setNewRole(account.role || 'visiteur');
                          }}
                        >
                          <UserCheck className="mr-2 size-4" />
                          Changer le role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleSuspend(account.id, account.is_active)}
                          disabled={actionLoading === account.id}
                        >
                          {account.is_active ? (
                            <Ban className="mr-2 size-4" />
                          ) : (
                            <CheckCircle2 className="mr-2 size-4" />
                          )}
                          {account.is_active ? 'Suspendre' : 'Reactiv er'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(account.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {t('admin.abonnes.no_results')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Cette action est irreversible. Toutes les donnees liees seront supprimees.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowDeleteDialog(null)}>
              Annuler
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
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showRoleDialog} onOpenChange={(open) => !open && setShowRoleDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Changer le role</DialogTitle>
            <DialogDescription>
              {showRoleDialog ? `Role de ${showRoleDialog.full_name}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(value) => value && setNewRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selectionner un role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visiteur">Visiteur</SelectItem>
                <SelectItem value="exposant">Exposant</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowRoleDialog(null)}>
              Annuler
            </Button>
            <Button
              className="rounded-xl"
              disabled={actionLoading === showRoleDialog?.id || !showRoleDialog}
              onClick={() => showRoleDialog && handleChangeRole(showRoleDialog.id, newRole)}
            >
              {actionLoading === showRoleDialog?.id ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <UserCheck className="mr-2 size-4" />
              )}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface-panel flex items-center gap-3 p-5">
      <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
