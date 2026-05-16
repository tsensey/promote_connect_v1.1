'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Plus, Search, Edit, Trash2, Loader2, Calendar } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useTranslation } from '@/lib/i18n';

type Evenement = Database['public']['Tables']['evenements']['Row'];
const EVENT_TYPES = ['conference', 'atelier', 'networking'];

const typeStyles: Record<string, string> = {
  conference: 'bg-primary/10 text-primary',
  atelier: 'bg-secondary/20 text-secondary-foreground',
  networking: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
};

export default function AdminProgrammePage() {
  const { t, locale } = useTranslation();
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ titre: '', description: '', pavillon: '', salle: '', starts_at: '', ends_at: '', type: 'conference', speakers: '' });

  const fetchEvenements = async () => {
    setLoading(true);
    const { data } = await supabaseClient.from('evenements').select('*').order('starts_at', { ascending: true });
    if (data) setEvenements(data);
    setLoading(false);
  };

  useEffect(() => { fetchEvenements(); }, []);

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
    if (!confirm(t('admin.programme.delete_confirm'))) return;
    await supabaseClient.from('evenements').delete().eq('id', id);
    fetchEvenements();
  };

  const filtered = evenements.filter((evt) => evt.titre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            {t('admin.programme.title')}
          </p>
          <h1 className="text-4xl text-foreground">{t('admin.programme.subtitle')}</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {t('admin.programme.desc')}
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ titre: '', description: '', pavillon: '', salle: '', starts_at: '', ends_at: '', type: 'conference', speakers: '' }); }} className="rounded-xl">
          <Plus className="mr-2 size-4" /> {t('admin.programme.add')}
        </Button>
      </div>

      <div className="surface-panel">
        <div className="border-b border-border/70 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('admin.programme.search')}
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
                <TableHead>{t('admin.programme.col_evenement')}</TableHead>
                <TableHead>{t('admin.programme.col_type')}</TableHead>
                <TableHead>{t('admin.programme.col_lieu')}</TableHead>
                <TableHead>{t('admin.programme.col_date')}</TableHead>
                <TableHead className="text-right">{t('admin.programme.col_actions')}</TableHead>
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
                        <div className="font-medium text-foreground">{evt.titre}</div>
                        {evt.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{evt.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('rounded-full border-0', typeStyles[evt.type || 'conference'])}>
                        {evt.type || 'conference'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {evt.pavillon && <span>{t('admin.programme.pavillon_label')} {evt.pavillon} </span>}
                      {evt.salle && <span>{t('admin.programme.salle_label')} {evt.salle}</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {evt.starts_at && (
                        <span>{new Date(evt.starts_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' })} - {new Date(evt.starts_at).toLocaleTimeString(locale === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(evt)} className="h-8 w-8 p-0">
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(evt.id)} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Calendar className="mx-auto mb-3 size-10 text-muted-foreground" />
                    {t('admin.programme.no_results')}
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
            <DialogTitle>{editingId ? t('admin.programme.form_edit') : t('admin.programme.form_new')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-3 py-4">
            <Input placeholder={t('admin.programme.form_titre')} value={formData.titre} onChange={(e) => setFormData({ ...formData, titre: e.target.value })} required className="col-span-full" />
            <Textarea placeholder={t('admin.programme.form_description')} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="col-span-full" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={t('admin.programme.form_pavillon')} value={formData.pavillon} onChange={(e) => setFormData({ ...formData, pavillon: e.target.value })} />
              <Input placeholder={t('admin.programme.form_salle')} value={formData.salle} onChange={(e) => setFormData({ ...formData, salle: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">{t('admin.programme.form_start')}</label>
                <Input type="datetime-local" value={formData.starts_at} onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })} required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t('admin.programme.form_end')}</label>
                <Input type="datetime-local" value={formData.ends_at} onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })} required className="mt-1" />
              </div>
            </div>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="flex h-9 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
              {EVENT_TYPES.map((t) => (<option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>))}
            </select>
            <Input placeholder={t('admin.programme.form_speakers')} value={formData.speakers} onChange={(e) => setFormData({ ...formData, speakers: e.target.value })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">{t('common.cancel')}</Button>
              <Button type="submit" disabled={formLoading} className="rounded-xl">
                {formLoading && <Loader2 className="mr-2 size-4 animate-spin" />} {editingId ? t('admin.programme.form_save') : t('admin.programme.form_create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
