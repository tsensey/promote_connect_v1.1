'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
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
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const fetchEspaces = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('espaces')
        .select('*')
        .order('sort_order');
      if (error) {
        toast.error(error.message);
      } else {
        setEspaces((data || []) as Espace[]);
      }
    } catch {
      toast.error(t('admin.espaces.network_error'));
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (!form.code || !form.nom) {
      toast.error(t('admin.espaces.validation'));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabaseClient
          .from('espaces')
          .update(form)
          .eq('id', editingId);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(t('admin.espaces.updated'));
      } else {
        const { error } = await supabaseClient
          .from('espaces')
          .insert(form);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(t('admin.espaces.created'));
      }
      setShowForm(false);
      await fetchEspaces();
    } catch {
      toast.error(t('admin.espaces.server_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin.espaces.delete_confirm'))) return;

    try {
      const { error } = await supabaseClient
        .from('espaces')
        .delete()
        .eq('id', id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t('admin.espaces.deleted'));
      await fetchEspaces();
    } catch {
      toast.error(t('admin.espaces.toast_network'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            {t('admin.espaces.title')}
          </p>
          <h1 className="text-4xl text-foreground">{t('admin.espaces.subtitle')}</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {t('admin.espaces.desc')}
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-xl">
          <Plus className="mr-2 size-4" />
          {t('admin.espaces.add')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-panel flex items-center gap-3 p-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('admin.espaces.total')}</p>
            <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
          </div>
        </div>
        <div className="surface-panel flex items-center gap-3 p-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('admin.espaces.pavillons')}</p>
            <p className="text-2xl font-semibold text-foreground">{stats.pavillons}</p>
          </div>
        </div>
        <div className="surface-panel flex items-center gap-3 p-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('admin.espaces.espaces_type')}</p>
            <p className="text-2xl font-semibold text-foreground">{stats.espaces}</p>
          </div>
        </div>
      </div>

      <Card className="surface-panel border-0">
        <CardHeader>
          <CardTitle>{t('admin.espaces.list')}</CardTitle>
          <CardDescription>
            {t('admin.espaces.list_hint')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.espaces.search')}
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
              {t('admin.espaces.no_results')}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t('admin.espaces.col_code')}</TableHead>
                  <TableHead>{t('admin.espaces.col_name')}</TableHead>
                  <TableHead>{t('admin.espaces.col_type')}</TableHead>
                  <TableHead>{t('admin.espaces.col_order')}</TableHead>
                  <TableHead className="text-right">{t('admin.espaces.col_actions')}</TableHead>
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
                        {espace.type === 'pavillon' ? t('admin.espaces.type_pavillon') : t('admin.espaces.type_espace')}
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
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t('admin.espaces.form_title_edit') : t('admin.espaces.form_title_new')}</DialogTitle>
            <DialogDescription>
              {t('admin.espaces.form_desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">{t('admin.espaces.form_code')}</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder={t('admin.espaces.form_code_placeholder')}
                  disabled={!!editingId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">{t('admin.espaces.form_order')}</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="nom">{t('admin.espaces.form_name')}</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder={t('admin.espaces.form_name_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.espaces.form_description')}</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('admin.espaces.form_description_placeholder')}
              />
            </div>

            <div className="space-y-3">
              <Label>{t('admin.espaces.form_type')}</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={form.type === 'pavillon' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setForm({ ...form, type: 'pavillon' })}
                >
                  {t('admin.espaces.form_type_pavillon')}
                </Button>
                <Button
                  type="button"
                  variant={form.type === 'espace' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setForm({ ...form, type: 'espace' })}
                >
                  {t('admin.espaces.form_type_espace')}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" className="rounded-xl" disabled={saving} onClick={handleSave}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('admin.espaces.form_saving')}
                </>
              ) : editingId ? (
                t('admin.espaces.form_save')
              ) : (
                t('admin.espaces.form_create')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
