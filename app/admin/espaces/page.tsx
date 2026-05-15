'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface Espace {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  type: 'pavillon' | 'espace';
  sort_order: number;
  created_at: string;
}

const defaultForm = {
  code: '',
  nom: '',
  description: '',
  type: 'pavillon' as 'pavillon' | 'espace',
  sort_order: 0,
};

export default function AdminEspacesPage() {
  const { session } = useAuth();
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const token = session?.access_token || null;

  const fetchEspaces = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/espaces', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEspaces(data.espaces || []);
      } else {
        toast.error(data.error || 'Erreur chargement espaces');
      }
    } catch {
      toast.error('Erreur reseau');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => fetchEspaces(), 0);
    return () => clearTimeout(t);
  }, [fetchEspaces]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return espaces.filter(
      (e) =>
        e.code.toLowerCase().includes(q) ||
        e.nom.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
    );
  }, [espaces, search]);

  const stats = useMemo(
    () => ({
      total: espaces.length,
      pavillons: espaces.filter((e) => e.type === 'pavillon').length,
      espaces: espaces.filter((e) => e.type === 'espace').length,
    }),
    [espaces]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (e: Espace) => {
    setEditingId(e.id);
    setForm({
      code: e.code,
      nom: e.nom,
      description: e.description || '',
      type: e.type,
      sort_order: e.sort_order,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!token) return;
    if (!form.code || !form.nom) {
      toast.error('Code et nom sont requis');
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...form, id: editingId } : form;

      const res = await fetch('/api/admin/espaces', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erreur sauvegarde');
        return;
      }

      toast.success(editingId ? 'Espace modifie' : 'Espace cree');
      setShowForm(false);
      await fetchEspaces();
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm('Supprimer cet espace definitivement ?')) return;

    try {
      const res = await fetch(`/api/admin/espaces?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Suppression impossible');
        return;
      }

      toast.success('Espace supprime');
      await fetchEspaces();
    } catch {
      toast.error('Erreur reseau');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            Configuration du salon
          </p>
          <h1 className="text-4xl text-foreground">Espaces & Pavillons</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Gérez les espaces et pavillons du salon PROMOTE. Chaque exposant est rattaché à un espace.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-xl">
          <Plus className="mr-2 size-4" />
          Ajouter un espace
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-panel flex items-center gap-3 p-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
          </div>
        </div>
        <div className="surface-panel flex items-center gap-3 p-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pavillons</p>
            <p className="text-2xl font-semibold text-foreground">{stats.pavillons}</p>
          </div>
        </div>
        <div className="surface-panel flex items-center gap-3 p-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Espaces</p>
            <p className="text-2xl font-semibold text-foreground">{stats.espaces}</p>
          </div>
        </div>
      </div>

      <Card className="surface-panel border-0">
        <CardHeader>
          <CardTitle>Liste des espaces</CardTitle>
          <CardDescription>
            Codes disponibles : pavillons (1-9) et espaces (A-K). Le format du stand suit le code espace (ex: &quot;3-1&quot; pour Numerique, &quot;H-10&quot; pour PAD).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par code, nom ou description..."
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="surface-subtle py-12 text-center text-sm text-muted-foreground">
              Aucun espace trouve.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ordre</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((espace) => (
                  <TableRow key={espace.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-full px-3 font-mono text-sm font-bold ${
                          espace.type === 'pavillon'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-violet-200 bg-violet-50 text-violet-700'
                        }`}
                      >
                        {espace.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{espace.nom}</div>
                      {espace.description && (
                        <div className="text-xs text-muted-foreground">{espace.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {espace.type === 'pavillon' ? 'Pavillon' : 'Espace'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{espace.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(espace)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(espace.id)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier l'espace" : 'Nouvel espace'}</DialogTitle>
            <DialogDescription>
              Les codes existants sont deja preconfigures. Utilisez cette interface pour personnaliser
              ou ajouter des espaces supplementaires.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="Ex: 1, A, Z"
                  disabled={!!editingId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordre d&apos;affichage</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Numerique, Commerce & General"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Pavillon 3 — Technologies Numeriques"
              />
            </div>

            <div className="space-y-3">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={form.type === 'pavillon' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setForm({ ...form, type: 'pavillon' })}
                >
                  Pavillon
                </Button>
                <Button
                  type="button"
                  variant={form.type === 'espace' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setForm({ ...form, type: 'espace' })}
                >
                  Espace
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button type="button" className="rounded-xl" disabled={saving} onClick={handleSave}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : editingId ? (
                'Sauvegarder'
              ) : (
                'Creer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
