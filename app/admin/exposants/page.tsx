'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Plus, Search, Edit, Trash2, Loader2, Users } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Exposant = Database['public']['Tables']['exposants']['Row'];

export default function AdminExposantsPage() {
  const [exposants, setExposants] = useState<Exposant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '', description: '', secteur: '', pavillon: '', stand: '', pays: '', website: '', is_featured: false,
  });

  const fetchExposants = async () => {
    setLoading(true);
    const { data } = await supabaseClient.from('exposants').select('*').order('created_at', { ascending: false });
    if (data) setExposants(data);
    setLoading(false);
  };

  useEffect(() => { fetchExposants(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    if (editingId) {
      const { error } = await supabaseClient.from('exposants').update(formData).eq('id', editingId);
      if (!error) { setShowForm(false); setEditingId(null); fetchExposants(); }
    } else {
      const { error } = await supabaseClient.from('exposants').insert(formData);
      if (!error) { setShowForm(false); fetchExposants(); }
    }
    setFormLoading(false);
  };

  const handleEdit = (exp: Exposant) => {
    setFormData({ nom: exp.nom || '', description: exp.description || '', secteur: exp.secteur || '', pavillon: exp.pavillon || '', stand: exp.stand || '', pays: exp.pays || '', website: exp.website || '', is_featured: exp.is_featured || false });
    setEditingId(exp.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet exposant ?')) return;
    await supabaseClient.from('exposants').delete().eq('id', id);
    fetchExposants();
  };

  const filtered = exposants.filter((exp) => exp.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            Administration exposants
          </p>
          <h1 className="text-4xl text-foreground">Gestion des fiches exposants</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Publiez, modifiez et organisez les fiches exposes dans l annuaire PROMOTE-CONNECT.
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ nom: '', description: '', secteur: '', pavillon: '', stand: '', pays: '', website: '', is_featured: false }); }} className="rounded-xl">
          <Plus className="mr-2 size-4" /> Ajouter
        </Button>
      </div>

      <div className="surface-panel">
        <div className="border-b border-border/70 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un exposant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exposant</TableHead>
                <TableHead>Secteur</TableHead>
                <TableHead>Pavillon</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-5 w-32 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-16 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-16 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{exp.nom}</div>
                      {exp.is_featured && <Badge variant="secondary" className="mt-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">En vedette</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{exp.secteur || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{exp.pavillon || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{exp.pays || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={exp.profile_id ? 'default' : 'secondary'} className="rounded-full">
                        {exp.profile_id ? 'Lie' : 'Non lie'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(exp)} className="h-8 w-8 p-0">
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(exp.id)} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Users className="mx-auto mb-3 size-10 text-muted-foreground" />
                    Aucun exposant trouve
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier l'exposant" : 'Nouvel exposant'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-3 py-4">
            <Input placeholder="Nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
            <Input placeholder="Secteur" value={formData.secteur} onChange={(e) => setFormData({ ...formData, secteur: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Pavillon" value={formData.pavillon} onChange={(e) => setFormData({ ...formData, pavillon: e.target.value })} />
              <Input placeholder="Stand" value={formData.stand} onChange={(e) => setFormData({ ...formData, stand: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Pays" value={formData.pays} onChange={(e) => setFormData({ ...formData, pays: e.target.value })} />
              <Input placeholder="Website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
            </div>
            <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            <div className="flex items-center gap-2">
              <Checkbox id="featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked === true })} />
              <label htmlFor="featured" className="text-sm text-foreground">En vedette</label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Annuler</Button>
              <Button type="submit" disabled={formLoading} className="rounded-xl">
                {formLoading && <Loader2 className="mr-2 size-4 animate-spin" />} {editingId ? 'Sauvegarder' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
