'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Trash2, ExternalLink, Loader2, Upload, Users, Mail, Key } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { supabaseClient } from '@/lib/supabase/client';
import { Button, buttonVariants } from '@/components/ui/button';
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
  DialogDescription,
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
import { useAuth } from '@/lib/auth/context';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AdminPagination } from '@/components/shared/AdminPagination';

import { TooltipArrow } from '@base-ui/react';

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
  const token = session?.access_token || null;
  const [exposants, setExposants] = useState<Exposant[]>([]);
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; total: number; accounts_created?: number; without_email?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    nom: '', description: '', secteur: '', espace_id: '', pavillon: '', stand: '', pays: '', website: '',
    email1: '', email2: '',
    is_featured: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [expRes, espRes] = await Promise.all([
        supabaseClient.from('exposants').select('*').order('nom'),
        supabaseClient.from('espaces').select('*').order('sort_order'),
      ]);

      setExposants(expRes.data || []);
      setEspaces(espRes.data || []);
    } catch {
      toast.error(t('admin.exposants.toast_load_error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormData({ nom: '', description: '', secteur: '', espace_id: '', pavillon: '', stand: '', pays: '', website: '', email1: '', email2: '', is_featured: false });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingId) {
        const { error } = await supabaseClient.from('exposants').update(formData as any).eq('id', editingId);
        if (error) { toast.error(error.message); return; }
        toast.success(t('admin.exposants.updated'));
      } else {
        const { data: insertData, error: insertError } = await supabaseClient.from('exposants').insert(formData as any).select('id, email1, email2').single();
        if (insertError) { toast.error(insertError.message); return; }

        if (insertData.email1 || insertData.email2) {
          const res = await fetch('/api/admin/exposants/create-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              exposant_id: insertData.id,
              email1: insertData.email1,
              email2: insertData.email2,
            }),
          });
          const accountResult = await res.json();
          if (accountResult.success && accountResult.account) {
            const sentCount = accountResult.account.recipients.filter((r: { sent: boolean }) => r.sent).length;
            toast.success(t('admin.exposants.account_created', { email: accountResult.account.email, sent: sentCount }));
          } else if (accountResult.error) {
            toast.warning(t('admin.exposants.account_error', { error: accountResult.error }));
          }
        } else {
          toast.success(t('admin.exposants.created_no_account'));
        }
      }

      setShowForm(false);
      resetForm();
      await fetchData();
    } catch {
      toast.error(t('admin.exposants.toast_network_error'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.exposants.delete_confirm'))) return;

    try {
      const response = await fetch(`/api/admin/espaces/exposants?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de la suppression');
        return;
      }
      toast.success(t('admin.exposants.deleted') || 'Exposant supprimé avec succès');
      await fetchData();
    } catch {
      toast.error(t('admin.exposants.toast_network_error'));
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);

    try {
      const body = new FormData();
      body.append('file', importFile);

      const response = await fetch('/api/admin/espaces/exposants/import', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || t('admin.exposants.import_error'));
        return;
      }

      setImportResult({ imported: payload.imported, total: payload.total, accounts_created: payload.accounts_created, without_email: payload.without_email });
      toast.success(t('admin.exposants.import_success', { count: payload.imported }));
      await fetchData();
    } catch {
      toast.error(t('admin.exposants.import_error'));
    } finally {
      setImportLoading(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = exposants.filter((exp) => exp.nom.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowImport(true); resetImport(); }} className="rounded-xl">
            <Upload className="mr-2 size-4" /> {t('admin.exposants.import')}
          </Button>
          <Button onClick={() => { setShowForm(true); resetForm(); }} className="rounded-xl">
            <Plus className="mr-2 size-4" /> {t('admin.exposants.add')}
          </Button>
        </div>
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
              ) : paginated.length > 0 ? (
                paginated.map((exp) => {
                  const espace = espaces.find((e) => e.id === exp.espace_id);
                  return (
                    <TableRow key={exp.id}>

                      <TableCell className='max-w-[400px] truncate'>

                        <Tooltip>
                          <TooltipTrigger>
                            <div className="font-medium text-foreground">{exp.nom}</div>
                            {exp.is_featured && <Badge variant="secondary" className="mt-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">{t('admin.exposants.featured')}</Badge>}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{exp.nom}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate"><Tooltip>
                        <TooltipTrigger>
                          <div className="font-medium text-foreground">{exp.secteur}</div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{exp.secteur}</p>
                        </TooltipContent>
                      </Tooltip>-</TableCell>
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
                          <Link
                            href={`/admin/exposants/${exp.id}`}
                            className={buttonVariants({ variant: "ghost", size: "sm", className: "h-8 w-8 p-0" })}
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-block">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(exp.id)} 
                                  disabled={!!exp.profile_id}
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TooltipTrigger>
                            {exp.profile_id && (
                              <TooltipContent>
                                <p>Impossible de supprimer un exposant lié à un compte.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
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
        {!loading && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <Dialog open={showImport} onOpenChange={(open) => { if (!open) { setShowImport(false); setTimeout(resetImport, 200); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('admin.exposants.import_title')}</DialogTitle>
            <DialogDescription>{t('admin.exposants.import_desc')}</DialogDescription>
          </DialogHeader>

          {importResult ? (
            <div className="space-y-4 py-4">
              <div className="rounded-xl border bg-emerald-500/10 p-6 text-center">
                <p className="text-2xl font-bold text-emerald-700">{importResult.imported}</p>
                <p className="text-sm text-emerald-600">{t('admin.exposants.import_success', { count: importResult.imported })}</p>
                {importResult.total > importResult.imported && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t('admin.exposants.import_skipped', { count: importResult.total - importResult.imported })}
                  </p>
                )}
                {importResult.accounts_created !== undefined && (
                  <>
                    <div className="mt-4 border-t border-emerald-500/20 pt-4">
                      <p className="text-sm font-medium text-emerald-700">{t('admin.exposants.accounts_created')}</p>
                      <p className="text-lg font-bold text-emerald-700">{importResult.accounts_created}</p>
                    </div>
                    {importResult.without_email && importResult.without_email > 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t('admin.exposants.without_email', { count: importResult.without_email })}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => { setShowImport(false); setTimeout(resetImport, 200); }} className="rounded-xl">
                  {t('common.close')}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('admin.exposants.import_select_file')}</label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">{t('admin.exposants.import_file_hint')}</p>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('admin.exposants.import_columns')}</p>
                <p className="text-xs text-muted-foreground">{t('admin.exposants.import_columns_hint')}</p>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">{t('admin.exposants.import_columns_recognized')}</p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: 'Raison Sociale', required: true },
                        { label: 'Secteur' },
                        { label: 'Pavillon' },
                        { label: 'Stand' },
                        { label: 'Description' },
                        { label: 'Adresse' },
                        { label: 'Telephone1' },
                        { label: 'Telephone2' },
                        { label: 'Mail1' },
                        { label: 'Mail2' },
                        { label: 'Site Web1' },
                        { label: 'Site Web2' },
                        { label: 'Reseaux' },
                        { label: 'Logo' },
                      ].map((col) => (
                        <Badge key={col.label} variant="secondary" className="text-xs">
                          {col.label}{col.required ? ' *' : ''}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-foreground mb-1">
                      {t('admin.exposants.import_pavillon_auto')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.exposants.import_pavillon_auto_desc')}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowImport(false); resetImport(); }} className="rounded-xl">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleImport} disabled={!importFile || importLoading} className="rounded-xl">
                  {importLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {importLoading ? t('admin.exposants.import_processing') : t('admin.exposants.import')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t('admin.exposants.form_edit') : t('admin.exposants.form_new')}</DialogTitle>
            <DialogDescription>{editingId ? t('admin.exposants.form_edit_desc') : t('admin.exposants.form_new_desc')}</DialogDescription>
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
                  className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
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

            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={t('admin.exposants.form_sector')} value={formData.secteur} onChange={(e) => setFormData({ ...formData, secteur: e.target.value })} />
              <Input placeholder={t('admin.exposants.form_country')} value={formData.pays} onChange={(e) => setFormData({ ...formData, pays: e.target.value })} />
            </div>
            <Input placeholder={t('admin.exposants.form_website')} value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />

            <div className="border-t border-border/50 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="size-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">{t('admin.exposants.form_credentials')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="email"
                  placeholder={t('admin.exposants.form_email1')}
                  value={formData.email1}
                  onChange={(e) => setFormData({ ...formData, email1: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder={t('admin.exposants.form_email2')}
                  value={formData.email2}
                  onChange={(e) => setFormData({ ...formData, email2: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.exposants.form_email_hint')}</p>
            </div>

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
