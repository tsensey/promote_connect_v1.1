'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Plus, Search, Trash2, ExternalLink, Loader2, Users } from 'lucide-react';
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
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

type Exposant = Database['public']['Tables']['exposants']['Row'];

interface Espace {
  id: string;
  code: string;
  nom: string;
  type: string;
}

export default function AdminExposantsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const [exposants, setExposants] = useState<Exposant[]>([]);
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '', description: '', secteur: '', espace_id: '', pavillon: '', stand: '', pays: '', website: '', is_featured: false,
  });

  const token = session?.access_token || null;

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const [expRes, espRes] = await Promise.all([
        fetch('/api/admin/espaces/exposants', {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => ({ exposants: [] })),
        fetch('/api/admin/espaces', {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => ({ espaces: [] })),
      ]);

      setExposants(expRes.exposants || []);
      setEspaces(espRes.espaces || []);
    } catch {
      toast.error(t('admin.exposants.toast_load_error'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormData({ nom: '', description: '', secteur: '', espace_id: '', pavillon: '', stand: '', pays: '', website: '', is_featured: false });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId
        ? { id: editingId, ...formData }
        : formData;

      const response = await fetch('/api/admin/espaces/exposants', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowForm(false);
        resetForm();
        await fetchData();
      } else {
        const payload = await response.json();
        toast.error(payload.error || t('admin.exposants.toast_error'));
      }
    } catch {
      toast.error(t('admin.exposants.toast_network_error'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm(t('admin.exposants.delete_confirm'))) return;

    try {
      const response = await fetch(`/api/admin/espaces/exposants?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchData();
      } else {
        const payload = await response.json();
        toast.error(payload.error || t('admin.exposants.toast_error'));
      }
    } catch {
      toast.error(t('admin.exposants.toast_network_error'));
    }
  };

  const filtered = exposants.filter((exp) => exp.nom.toLowerCase().includes(search.toLowerCase()));

  const selectedEspace = espaces.find((e) => e.id === formData.espace_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            {t('admin.exposants.title')}
          </p>
          <h1 className="text-4xl text-foreground">{t('admin.exposants.subtitle')}</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {t('admin.exposants.desc')} {t('admin.exposants.desc_hint')}
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }} className="rounded-xl">
          <Plus className="mr-2 size-4" /> {t('admin.exposants.add')}
        </Button>
      </div>

      <div className="surface-panel">
        <div className="border-b border-border/70 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('admin.exposants.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.exposants.col_exposant')}</TableHead>
                <TableHead>{t('admin.exposants.col_sector')}</TableHead>
                <TableHead>{t('admin.exposants.col_espace')}</TableHead>
                <TableHead>{t('admin.exposants.col_stand')}</TableHead>
                <TableHead>{t('admin.exposants.col_status')}</TableHead>
                <TableHead className="text-right">{t('admin.exposants.col_actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-5 w-32 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-16 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-16 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-16 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-20 animate-pulse rounded bg-muted ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((exp) => {
                  const espace = espaces.find((e) => e.id === exp.espace_id);
                  return (
                    <TableRow key={exp.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{exp.nom}</div>
                        {exp.is_featured && <Badge variant="secondary" className="mt-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">{t('admin.exposants.featured')}</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{exp.secteur || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {espace ? (
                          <Badge variant="outline" className="rounded-full text-xs font-mono">
                            {espace.type === 'pavillon' ? 'P' : 'E'}{espace.code}
                          </Badge>
                        ) : exp.pavillon ? (
                          <span className="text-muted-foreground">{exp.pavillon}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{exp.stand || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={exp.profile_id ? 'default' : 'secondary'} className="rounded-full">
                          {exp.profile_id ? t('admin.exposants.linked') : t('admin.exposants.unlinked')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/exposants/${exp.id}`)} className="h-8 w-8 p-0">
                            <ExternalLink className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(exp.id)} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Users className="mx-auto mb-3 size-10 text-muted-foreground" />
                    {t('admin.exposants.no_results')}
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
            <DialogTitle>{editingId ? t('admin.exposants.form_edit') : t('admin.exposants.form_new')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-3 py-4">
            <Input placeholder={t('admin.exposants.form_name_placeholder')} value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t('admin.exposants.form_espace')}</label>
                <select
                  value={formData.espace_id}
                  onChange={(e) => {
                    const espace = espaces.find((sp) => sp.id === e.target.value);
                    setFormData({
                      ...formData,
                      espace_id: e.target.value,
                      pavillon: espace?.code || '',
                    });
                  }}
                  className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm shadow-sm"
                >
                  <option value="">{t('admin.exposants.form_none')}</option>
                  {espaces.map((espace) => (
                    <option key={espace.id} value={espace.id}>
                      {espace.type === 'pavillon' ? t('admin.exposants.form_type_pavillon') : t('admin.exposants.form_type_espace')} {espace.code} — {espace.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t('admin.exposants.form_stand')}</label>
                <Input
                  placeholder={t('admin.exposants.form_stand_placeholder')}
                  value={formData.stand}
                  onChange={(e) => setFormData({ ...formData, stand: e.target.value })}
                />
              </div>
            </div>

            {selectedEspace && (
              <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {t('admin.exposants.form_pavillon_code')} <strong>{selectedEspace.code}</strong> — {selectedEspace.type === 'pavillon' ? t('admin.exposants.form_type_pavillon') : t('admin.exposants.form_type_espace')} {selectedEspace.code} — {selectedEspace.nom}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={t('admin.exposants.form_sector')} value={formData.secteur} onChange={(e) => setFormData({ ...formData, secteur: e.target.value })} />
              <Input placeholder={t('admin.exposants.form_country')} value={formData.pays} onChange={(e) => setFormData({ ...formData, pays: e.target.value })} />
            </div>
            <Input placeholder={t('admin.exposants.form_website')} value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
            <Textarea placeholder={t('admin.exposants.form_description')} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            <div className="flex items-center gap-2">
              <Checkbox id="featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked === true })} />
              <label htmlFor="featured" className="text-sm text-foreground">{t('admin.exposants.featured')}</label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">{t('common.cancel')}</Button>
              <Button type="submit" disabled={formLoading} className="rounded-xl">
                {formLoading && <Loader2 className="mr-2 size-4 animate-spin" />} {editingId ? t('admin.exposants.form_save') : t('admin.exposants.form_create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
