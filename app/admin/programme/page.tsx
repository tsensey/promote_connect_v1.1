'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Plus, Search, Edit, Trash2, Calendar, Loader2 } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type Evenement = Database['public']['Tables']['evenements']['Row'];
const EVENT_TYPES = ['conference', 'atelier', 'networking'];

export default function AdminProgrammePage() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ titre: '', description: '', pavillon: '', salle: '', starts_at: '', ends_at: '', type: 'conference', speakers: '' });

  useEffect(() => { fetchEvenements(); }, []);

  const fetchEvenements = async () => {
    setLoading(true);
    const { data } = await supabaseClient.from('evenements').select('*').order('starts_at', { ascending: true });
    if (data) setEvenements(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const payload = { ...formData, speakers: formData.speakers ? formData.speakers.split(',').map((s) => s.trim()) : [], starts_at: new Date(formData.starts_at).toISOString(), ends_at: new Date(formData.ends_at).toISOString() };
    if (editingId) {
      const { error } = await supabaseClient.from('evenements').update(payload).eq('id', editingId);
      if (!error) { setShowForm(false); setEditingId(null); fetchEvenements(); }
    } else {
      const { error } = await supabaseClient.from('evenements').insert(payload);
      if (!error) { setShowForm(false); fetchEvenements(); }
    }
    setFormLoading(false);
  };

  const handleEdit = (evt: Evenement) => {
    const speakers = Array.isArray(evt.speakers) ? evt.speakers.join(', ') : '';
    setFormData({ titre: evt.titre || '', description: evt.description || '', pavillon: evt.pavillon || '', salle: evt.salle || '', starts_at: evt.starts_at ? new Date(evt.starts_at).toISOString().slice(0, 16) : '', ends_at: evt.ends_at ? new Date(evt.ends_at).toISOString().slice(0, 16) : '', type: evt.type || 'conference', speakers });
    setEditingId(evt.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet evenement ?')) return;
    await supabaseClient.from('evenements').delete().eq('id', id);
    fetchEvenements();
  };

  const filtered = evenements.filter((evt) => evt.titre.toLowerCase().includes(search.toLowerCase()));

  const getTypeBadge = (type: string | null) => {
    switch (type) {
      case 'conference': return <Badge variant="default">Conference</Badge>;
      case 'atelier': return <Badge variant="secondary">Atelier</Badge>;
      case 'networking': return <Badge className="bg-green-100 text-green-700 border-0">Networking</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Administration du programme</h1>
              <p className="mt-1 text-sm text-muted-foreground">Publiez et gere les evenements, ateliers et rendez-vous du salon.</p>
            </div>
            <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ titre: '', description: '', pavillon: '', salle: '', starts_at: '', ends_at: '', type: 'conference', speakers: '' }); }}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un evenement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier l evenement' : 'Nouvel evenement'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-3 py-4">
            <Input placeholder="Titre" value={formData.titre} onChange={(e) => setFormData({ ...formData, titre: e.target.value })} required className="col-span-full" />
            <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="col-span-full" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Pavillon" value={formData.pavillon} onChange={(e) => setFormData({ ...formData, pavillon: e.target.value })} />
              <Input placeholder="Salle" value={formData.salle} onChange={(e) => setFormData({ ...formData, salle: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Date de debut</label>
                <Input type="datetime-local" value={formData.starts_at} onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })} required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Date de fin</label>
                <Input type="datetime-local" value={formData.ends_at} onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })} required className="mt-1" />
              </div>
            </div>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {EVENT_TYPES.map((t) => (<option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>))}
            </select>
            <Input placeholder="Speakers (separes par des virgules)" value={formData.speakers} onChange={(e) => setFormData({ ...formData, speakers: e.target.value })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editingId ? 'Sauvegarder' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evenement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-5 w-48 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-24 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-32 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-16 animate-pulse rounded bg-muted ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((evt) => (
                  <TableRow key={evt.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{evt.titre}</div>
                        {evt.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{evt.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(evt.type)}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {evt.pavillon && <span>Pavillon {evt.pavillon} </span>}
                      {evt.salle && <span>Salle {evt.salle}</span>}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {evt.starts_at && (
                        <span>{new Date(evt.starts_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {new Date(evt.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(evt)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(evt.id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Aucun evenement trouve</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
