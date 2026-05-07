'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Copy,
  Globe2,
  Loader2,
  MoreVertical,
  Search,
  Trash2,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  full_name: string;
  company: string | null;
  role: string | null;
  sector: string | null;
  country: string | null;
  pavillon: string | null;
  subscription_status: string | null;
  subscription_ends_at: string | null;
  created_at: string;
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
  'Algerie',
  'Allemagne',
  'Belgique',
  'Benin',
  'Burkina Faso',
  'Cameroun',
  'Canada',
  'Chine',
  'Congo',
  "Cote d'Ivoire",
  'Egypte',
  'Espagne',
  'Etats-Unis',
  'France',
  'Gabon',
  'Ghana',
  'Guinee',
  'Inde',
  'Italie',
  'Japon',
  'Mali',
  'Maroc',
  'Nigeria',
  'Royaume-Uni',
  'Senegal',
  'Togo',
  'Tunisie',
  'Turquie',
];

const PAVILLONS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function AdminUsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<{
    email: string;
    password: string;
    emailSent: boolean;
    subscriptionEndsAt: string;
  } | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    company: '',
    role: 'visiteur' as 'visiteur' | 'exposant',
    sector: '',
    country: '',
    pavillon: '',
    generate_exposant: true,
  });

  const token = session?.access_token || null;

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const haystack = `${user.full_name} ${user.company || ''} ${user.sector || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [roleFilter, search, users]);

  const stats = useMemo(
    () => ({
      total: users.length,
      exposants: users.filter((user) => user.role === 'exposant').length,
      visiteurs: users.filter((user) => user.role === 'visiteur').length,
      actifs: users.filter((user) => user.subscription_status === 'active').length,
    }),
    [users]
  );

  const fetchUsers = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || 'Impossible de charger les utilisateurs');
        return;
      }

      setUsers(payload.users || []);
    } catch {
      toast.error('Erreur reseau lors du chargement des comptes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  async function handleCreate() {
    if (!token) {
      toast.error('Session administrateur introuvable');
      return;
    }

    if (!form.full_name || !form.email) {
      toast.error('Nom complet et email sont requis');
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
        toast.error(payload.error || 'Erreur lors de la creation du compte');
        return;
      }

      setLastInvite({
        email: form.email,
        password: payload.temporary_password,
        emailSent: payload.email_sent,
        subscriptionEndsAt: payload.subscription_ends_at,
      });

      setForm({
        full_name: '',
        email: '',
        company: '',
        role: 'visiteur',
        sector: '',
        country: '',
        pavillon: '',
        generate_exposant: true,
      });
      setShowCreateDialog(false);
      toast.success(
        payload.email_sent
          ? 'Compte cree et email envoye'
          : 'Compte cree. Copiez les identifiants et transmettez-les manuellement.'
      );
      await fetchUsers();
    } catch {
      toast.error('Erreur serveur pendant la creation du compte');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(userId: string) {
    if (!token) {
      toast.error('Session administrateur introuvable');
      return;
    }

    if (!window.confirm('Supprimer ce compte definitivement ?')) {
      return;
    }

    setDeleting(userId);

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || 'Suppression impossible');
        return;
      }

      toast.success('Compte supprime');
      await fetchUsers();
    } catch {
      toast.error('Erreur reseau pendant la suppression');
    } finally {
      setDeleting(null);
    }
  }

  async function copyInvite() {
    if (!lastInvite) {
      return;
    }

    const message = `Email: ${lastInvite.email}\nMot de passe temporaire: ${lastInvite.password}`;
    await navigator.clipboard.writeText(message);
    toast.success('Identifiants copies');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            Administration des acces
          </p>
          <h1 className="text-4xl text-foreground">Utilisateurs geres par l&apos;admin</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Creation de comptes, activation de l&apos;acces 12 mois et envoi des
            identifiants de connexion aux exposants et visiteurs.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="rounded-2xl">
          <UserPlus className="mr-2 size-4" />
          Creer un compte
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total comptes" value={stats.total} icon={Users} tone="blue" />
        <StatCard label="Exposants" value={stats.exposants} icon={Building2} tone="violet" />
        <StatCard label="Visiteurs" value={stats.visiteurs} icon={Globe2} tone="emerald" />
        <StatCard label="Acces actifs" value={stats.actifs} icon={UserPlus} tone="amber" />
      </div>

      {lastInvite && (
        <Card className="surface-panel border-0">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">
                Dernier acces cree
              </p>
              <p className="text-lg font-semibold text-foreground">{lastInvite.email}</p>
              <p className="text-sm text-muted-foreground">
                Mot de passe temporaire: <span className="font-semibold text-foreground">{lastInvite.password}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {lastInvite.emailSent
                  ? 'Email envoye automatiquement au participant.'
                  : 'Aucun email n a pu etre envoye. Partagez ces identifiants manuellement.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="rounded-full">
                Actif jusqu&apos;au{' '}
                {new Date(lastInvite.subscriptionEndsAt).toLocaleDateString('fr-FR')}
              </Badge>
              <Button variant="outline" onClick={copyInvite} className="rounded-2xl bg-white/80">
                <Copy className="mr-2 size-4" />
                Copier les acces
              </Button>
            </div>
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
                placeholder="Rechercher par nom, entreprise ou secteur..."
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
                  {role === 'all' ? 'Tous' : role}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-panel border-0">
        <CardHeader>
          <CardTitle>Liste des comptes</CardTitle>
          <CardDescription>
            Tous les utilisateurs sont provisionnes depuis cette interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="surface-subtle py-12 text-center">
              <Users className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aucun compte ne correspond a votre recherche.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Acces</TableHead>
                  <TableHead>Expiration</TableHead>
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
                          <p className="truncate text-sm font-semibold text-foreground">
                            {user.full_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[user.company, user.sector, user.country].filter(Boolean).join(' - ') || 'Profil PROMOTE-CONNECT'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full">
                        {user.role || 'visiteur'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.subscription_status === 'active'
                            ? 'rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                            : 'rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100'
                        }
                      >
                        {user.subscription_status === 'active' ? 'Actif' : 'A verifier'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.subscription_ends_at
                        ? new Date(user.subscription_ends_at).toLocaleDateString('fr-FR')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}>
                          <MoreVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl">
                          <DropdownMenuItem
                            onClick={() => handleDelete(user.id)}
                            className="text-destructive"
                            disabled={deleting === user.id}
                          >
                            {deleting === user.id ? (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 size-4" />
                            )}
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Creer un compte utilisateur</DialogTitle>
            <DialogDescription>
              Le participant recevra ses acces par email et son compte sera active
              pour 12 mois.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="jean@entreprise.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Entreprise</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                placeholder="Nom de l entreprise"
              />
            </div>

            <div className="space-y-3">
              <Label>Role</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={form.role === 'visiteur' ? 'default' : 'outline'}
                  className="rounded-2xl"
                  onClick={() =>
                    setForm({
                      ...form,
                      role: 'visiteur',
                      generate_exposant: false,
                      sector: '',
                      country: '',
                      pavillon: '',
                    })
                  }
                >
                  Visiteur
                </Button>
                <Button
                  type="button"
                  variant={form.role === 'exposant' ? 'default' : 'outline'}
                  className="rounded-2xl"
                  onClick={() =>
                    setForm({
                      ...form,
                      role: 'exposant',
                      generate_exposant: true,
                    })
                  }
                >
                  Exposant
                </Button>
              </div>
            </div>

            {form.role === 'exposant' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sector">Secteur</Label>
                    <select
                      id="sector"
                      value={form.sector}
                      onChange={(event) => setForm({ ...form, sector: event.target.value })}
                      className="flex h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm shadow-sm"
                    >
                      <option value="">Selectionner</option>
                      {SECTORS.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <select
                      id="country"
                      value={form.country}
                      onChange={(event) => setForm({ ...form, country: event.target.value })}
                      className="flex h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm shadow-sm"
                    >
                      <option value="">Selectionner</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Pavillon</Label>
                  <div className="flex flex-wrap gap-2">
                    {PAVILLONS.map((pavillon) => (
                      <Button
                        key={pavillon}
                        type="button"
                        variant={form.pavillon === pavillon ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full"
                        onClick={() => setForm({ ...form, pavillon })}
                      >
                        {pavillon}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => setShowCreateDialog(false)}
            >
              Annuler
            </Button>
            <Button type="button" className="rounded-2xl" disabled={creating} onClick={handleCreate}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creation...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 size-4" />
                  Creer et envoyer l email
                </>
              )}
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
  tone: 'blue' | 'emerald' | 'violet' | 'amber';
}) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <Card className="surface-panel border-0">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={`flex size-12 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
