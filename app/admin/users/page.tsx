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

const NOMBRE_EMPLOYES = ['1-10', '11-50', '51-200', '200+'];

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
  } | null>(null);
  const [espaces, setEspaces] = useState<{ id: string; code: string; nom: string; type: string }[]>([]);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    company: '',
    role: 'visiteur' as 'visiteur' | 'exposant',
    espace_id: '',
    sector: '',
    country: '',
    pavillon: '',
    stand: '',
    description: '',
    website: '',
    annee_creation: '',
    nombre_employes: '',
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
      admins: users.filter((user) => user.role === 'admin').length,
      exposants: users.filter((user) => user.role === 'exposant').length,
      visiteurs: users.filter((user) => user.role === 'visiteur').length,
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
    const timer = window.setTimeout(() => {
      void fetchUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    if (!showCreateDialog || !token) return;
    fetch('/api/admin/espaces', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.espaces) setEspaces(data.espaces);
      })
      .catch(() => {});
  }, [showCreateDialog, token]);

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
            Creation de comptes, envoi des identifiants de connexion et
            attribution des roles pour toute la plateforme.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="rounded-xl">
          <UserPlus className="mr-2 size-4" />
          Creer un compte
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total comptes" value={stats.total} icon={Users} tone="blue" />
        <StatCard label="Administrateurs" value={stats.admins} icon={UserPlus} tone="amber" />
        <StatCard label="Exposants" value={stats.exposants} icon={Building2} tone="violet" />
        <StatCard label="Visiteurs" value={stats.visiteurs} icon={Globe2} tone="emerald" />
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
            <Button variant="outline" onClick={copyInvite} className="rounded-xl bg-white/80">
              <Copy className="mr-2 size-4" />
              Copier les acces
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
                <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
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
                  <TableHead>Profil</TableHead>
                  <TableHead>Creation</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {user.role === 'exposant'
                        ? `Pavillon ${user.pavillon || '-'}`
                        : user.company || 'Compte utilisateur'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}>
                          <MoreVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
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
              Le participant recevra ses acces par email et pourra utiliser toute la plateforme.
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
                  className="rounded-xl"
                  onClick={() =>
                    setForm({
                      ...form,
                      role: 'visiteur',
                      generate_exposant: false,
                      espace_id: '',
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
                  className="rounded-xl"
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
                      className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm shadow-sm"
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
                      className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm shadow-sm"
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

                <div className="space-y-2">
                  <Label htmlFor="espace_id">Espace / Pavillon</Label>
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
                    className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm shadow-sm"
                  >
                    <option value="">Selectionner un espace</option>
                    {espaces.map((espace) => (
                      <option key={espace.id} value={espace.id}>
                        {espace.type === 'pavillon' ? 'Pavillon' : 'Espace'} {espace.code} — {espace.nom}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Le code de l&apos;espace sera utilise comme pavillon. Le stand est libre.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stand">Stand</Label>
                    <Input
                      id="stand"
                      value={form.stand}
                      onChange={(event) => setForm({ ...form, stand: event.target.value })}
                      placeholder="Ex: A1-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Site web</Label>
                    <Input
                      id="website"
                      type="url"
                      value={form.website}
                      onChange={(event) => setForm({ ...form, website: event.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description de l&apos;entreprise</Label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Presentez votre entreprise, ses activites et ses produits..."
                    className="flex min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="annee_creation">Annee de creation</Label>
                    <Input
                      id="annee_creation"
                      value={form.annee_creation}
                      onChange={(event) => setForm({ ...form, annee_creation: event.target.value })}
                      placeholder="Ex: 2015"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre_employes">Nombre d&apos;employes</Label>
                    <select
                      id="nombre_employes"
                      value={form.nombre_employes}
                      onChange={(event) => setForm({ ...form, nombre_employes: event.target.value })}
                      className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm shadow-sm"
                    >
                      <option value="">Selectionner</option>
                      {NOMBRE_EMPLOYES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
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
              Annuler
            </Button>
            <Button type="button" className="rounded-xl" disabled={creating} onClick={handleCreate}>
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
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
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
