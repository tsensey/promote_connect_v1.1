'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { compressImage, compressImages } from '@/lib/compress-image';
import { supabaseClient } from '@/lib/supabase/client';
import {
  ArrowLeft, Loader2, Store, Upload, PackagePlus, PencilLine, Trash2, Save, ImagePlus,
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/types/database.types';

type Exposant = Database['public']['Tables']['exposants']['Row'];
type Produit = Database['public']['Tables']['produits']['Row'];

interface Espace {
  id: string;
  code: string;
  nom: string;
  type: string;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70 pt-2">
      {children}
    </p>
  );
}

const IconLinkedin = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const IconFacebook = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IconTwitter = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M4 4l16 16M4 20 20 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
const IconInstagram = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
  </svg>
);

const emptyProductForm = {
  id: '',
  nom: '',
  description: '',
  categorie: '',
  prix_indicatif: '',
  type: 'produit' as string | null,
  image_url: '',
};

export default function AdminExposantVitrinePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const exposantId = params.exposantId as string;

  const [loading, setLoading] = useState(true);
  const [exposant, setExposant] = useState<Exposant | null>(null);
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [products, setProducts] = useState<Produit[]>([]);
  const [saving, setSaving] = useState(false);

  const [showcaseForm, setShowcaseForm] = useState({
    nom: '',
    description: '',
    long_description: '',
    secteur: '',
    pavillon: '',
    stand: '',
    pays: '',
    website: '',
    email_contact: '',
    phone_contact: '',
    facebook_url: '',
    linkedin_url: '',
    twitter_url: '',
    instagram_url: '',
    cover_url: '',
    logo_url: '',
    brochure_url: '',
    video_url: '',
    chiffre_affaires: '',
    annee_creation: '',
    nombre_employes: '',
    gallery_urls: [] as string[],
    is_featured: false,
    espace_id: '',
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [productForm, setProductForm] = useState(emptyProductForm);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const fetchExposant = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from('exposants')
        .select('*')
        .eq('id', exposantId)
        .single();
      if (error) throw error;
      if (data) {
        setExposant(data);
        setShowcaseForm({
          nom: data.nom || '',
          description: data.description || '',
          long_description: data.long_description || '',
          secteur: data.secteur || '',
          pavillon: data.pavillon || '',
          stand: data.stand || '',
          pays: data.pays || '',
          website: data.website || '',
          email_contact: data.email_contact || '',
          phone_contact: data.phone_contact || '',
          facebook_url: data.facebook_url || '',
          linkedin_url: data.linkedin_url || '',
          twitter_url: data.twitter_url || '',
          instagram_url: data.instagram_url || '',
          cover_url: data.cover_url || '',
          logo_url: data.logo_url || '',
          brochure_url: data.brochure_url || '',
          video_url: data.video_url || '',
          chiffre_affaires: data.chiffre_affaires || '',
          annee_creation: data.annee_creation || '',
          nombre_employes: data.nombre_employes || '',
          gallery_urls: (data.gallery_urls as string[]) || [],
          is_featured: data.is_featured || false,
          espace_id: data.espace_id || '',
        });
      }
    } catch {
      toast.error(t('admin.exposants.toast_load_error'));
    }
  }, [exposantId, t]);

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from('produits')
        .select('*, exposants(nom, profile_id, logo_url)')
        .eq('exposant_id', exposantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch {
      // silent
    }
  }, [exposantId]);

  const fetchEspaces = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from('espaces')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      setEspaces(data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchExposant(), fetchProducts(), fetchEspaces()]);
      setLoading(false);
    };
    void load();
  }, [fetchExposant, fetchProducts, fetchEspaces]);

  const handleImageUpload = async (file: File | null, field: 'logo_url' | 'cover_url') => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('exposant.vitrine.image_too_large'));
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error(t('exposant.vitrine.format_unsupported'));
      return;
    }
    if (field === 'logo_url') setUploadingLogo(true);
    else setUploadingCover(true);
    try {
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop();
      const fileName = `admin-${exposantId}-${field}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { data, error } = await supabaseClient.storage
        .from('vitrine-images')
        .upload(fileName, compressed);
      if (error) throw error;
      const { data: { publicUrl } } = supabaseClient.storage
        .from('vitrine-images')
        .getPublicUrl(data.path);
      setShowcaseForm(f => ({ ...f, [field]: publicUrl }));
      toast.success(t('exposant.vitrine.upload_success'));
    } catch {
      toast.error(t('exposant.vitrine.upload_error'));
    } finally {
      if (field === 'logo_url') setUploadingLogo(false);
      else setUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    const newUrls: string[] = [];
    try {
      const fileArray = Array.from(files);
      const compressedFiles = await compressImages(fileArray);
      for (const file of compressedFiles) {
        if (file.size > 5 * 1024 * 1024) continue;
        const ext = file.name.split('.').pop();
        const fileName = `admin-${exposantId}-gallery-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { data, error } = await supabaseClient.storage
          .from('vitrine-images')
          .upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabaseClient.storage
          .from('vitrine-images')
          .getPublicUrl(data.path);
        newUrls.push(publicUrl);
      }
      if (newUrls.length > 0) {
        setShowcaseForm(f => ({ ...f, gallery_urls: [...f.gallery_urls, ...newUrls] }));
        toast.success(t('exposant.vitrine.gallery_added', { count: newUrls.length }));
      }
    } catch {
      toast.error(t('exposant.vitrine.upload_error'));
    } finally {
      setUploadingGallery(false);
    }
  };

  const saveShowcase = async () => {
    if (!showcaseForm.nom.trim()) {
      toast.error(t('exposant.vitrine.name_required'));
      return;
    }
    setSaving(true);
    try {
      const body = {
        nom: showcaseForm.nom.trim(),
        description: showcaseForm.description.trim() || null,
        long_description: showcaseForm.long_description.trim() || null,
        secteur: showcaseForm.secteur.trim() || null,
        pavillon: showcaseForm.pavillon.trim() || null,
        stand: showcaseForm.stand.trim() || null,
        pays: showcaseForm.pays.trim() || null,
        website: showcaseForm.website.trim() || null,
        email_contact: showcaseForm.email_contact.trim() || null,
        phone_contact: showcaseForm.phone_contact.trim() || null,
        facebook_url: showcaseForm.facebook_url.trim() || null,
        linkedin_url: showcaseForm.linkedin_url.trim() || null,
        twitter_url: showcaseForm.twitter_url.trim() || null,
        instagram_url: showcaseForm.instagram_url.trim() || null,
        cover_url: showcaseForm.cover_url.trim() || null,
        logo_url: showcaseForm.logo_url.trim() || null,
        brochure_url: showcaseForm.brochure_url.trim() || null,
        video_url: showcaseForm.video_url.trim() || null,
        chiffre_affaires: showcaseForm.chiffre_affaires.trim() || null,
        annee_creation: showcaseForm.annee_creation.trim() || null,
        nombre_employes: showcaseForm.nombre_employes.trim() || null,
        gallery_urls: showcaseForm.gallery_urls,
        is_featured: showcaseForm.is_featured,
        espace_id: showcaseForm.espace_id || null,
      };
      const { espace_id: _, ...updateData } = body;
      const { error } = await supabaseClient
        .from('exposants')
        .update(updateData)
        .eq('id', exposantId);
      if (error) throw error;
      toast.success(t('exposant.vitrine.saved'));
      await fetchExposant();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('exposant.vitrine.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async () => {
    if (!productForm.nom.trim()) {
      toast.error(t('exposant.vitrine.product_name_required'));
      return;
    }
    setSavingProduct(true);
    try {
      const productData = {
        nom: productForm.nom.trim(),
        description: productForm.description.trim() || null,
        categorie: productForm.categorie.trim() || null,
        prix_indicatif: productForm.prix_indicatif.trim() || null,
        type: productForm.type,
        image_url: productForm.image_url || null,
      };
      if (productForm.id) {
        const { error } = await supabaseClient
          .from('produits')
          .update(productData)
          .eq('id', productForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseClient
          .from('produits')
          .insert({ ...productData, exposant_id: exposantId });
        if (error) throw error;
      }
      setProductForm(emptyProductForm);
      await fetchProducts();
      toast.success(productForm.id ? t('exposant.vitrine.product_updated') : t('exposant.vitrine.product_added'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('exposant.vitrine.product_save_error'));
    } finally {
      setSavingProduct(false);
    }
  };

  const startEditProduct = (product: Produit) => {
    setProductForm({
      id: product.id,
      nom: product.nom,
      description: product.description || '',
      categorie: product.categorie || '',
      prix_indicatif: product.prix_indicatif || '',
      type: product.type || 'produit',
      image_url: product.image_url || '',
    });
  };

  const deleteProduct = async (productId: string) => {
    setDeletingProductId(productId);
    try {
      const { error } = await supabaseClient
        .from('produits')
        .delete()
        .eq('id', productId);
      if (error) throw error;
      await fetchProducts();
      toast.success(t('exposant.vitrine.product_deleted'));
    } catch {
      toast.error(t('exposant.vitrine.delete_error'));
    } finally {
      setDeletingProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="surface-panel h-56 animate-pulse" />
        <div className="surface-panel h-80 animate-pulse" />
      </div>
    );
  }

  if (!exposant && !loading) {
    return (
      <Card className="surface-panel border-0 py-0">
        <CardContent className="space-y-4 p-8 text-center">
          <Store className="mx-auto size-10 text-muted-foreground" />
          <div>
            <h1 className="text-2xl text-foreground">{t('admin.exposants.not_found')}</h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {t('admin.exposants.not_found_desc')}
            </p>
          </div>
          <Button onClick={() => router.push('/admin/exposants')} className="rounded-xl">
            <ArrowLeft className="mr-2 size-4" /> {t('common.back')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            {t('admin.exposants.title')}
          </p>
          <h1 className="text-4xl text-foreground">
            {showcaseForm.nom || t('admin.exposants.vitrine_edit')}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {exposant?.profile_id ? t('admin.exposants.vitrine_linked') : t('admin.exposants.vitrine_standalone')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/exposants')} className="rounded-xl">
            <ArrowLeft className="mr-2 size-4" /> {t('common.back')}
          </Button>
          <Button onClick={saveShowcase} disabled={saving} className="rounded-xl">
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Save className="mr-2 size-4" /> {t('common.save')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="presentation" className="flex flex-col gap-y-1.5">
        <TabsList className="w-full overflow-x-auto flex-nowrap">
          <TabsTrigger value="presentation">{t('exposant.vitrine.presentation')}</TabsTrigger>
          <TabsTrigger value="products">{t('exposant.vitrine.my_products')} ({products.length})</TabsTrigger>
          <TabsTrigger value="gallery">{t('exposant.vitrine.gallery')} ({showcaseForm.gallery_urls.length})</TabsTrigger>
          <TabsTrigger value="social">{t('exposant.vitrine.social')}</TabsTrigger>
        </TabsList>

        <TabsContent value="presentation" className="space-y-6">
          <Card className="surface-panel border-0">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">{t('exposant.vitrine.general_info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Field label={t('exposant.vitrine.company_name')}>
                  <Input
                    value={showcaseForm.nom}
                    onChange={e => setShowcaseForm(f => ({ ...f, nom: e.target.value }))}
                    required
                  />
                </Field>
                <Field label={t('exposant.vitrine.website')}>
                  <Input
                    value={showcaseForm.website}
                    onChange={e => setShowcaseForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://entreprise.com"
                  />
                </Field>
              </div>

              <Field label={t('exposant.vitrine.short_desc')}>
                <Textarea
                  value={showcaseForm.description}
                  onChange={e => setShowcaseForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </Field>

              <Field label={t('exposant.vitrine.long_desc')}>
                <Textarea
                  value={showcaseForm.long_description}
                  onChange={e => setShowcaseForm(f => ({ ...f, long_description: e.target.value }))}
                  rows={6}
                />
              </Field>

              <SectionTitle>{t('exposant.vitrine.location')}</SectionTitle>
              <div className="grid gap-4 md:grid-cols-4">
                <Field label={t('exposant.vitrine.sector')}>
                  <Input
                    value={showcaseForm.secteur}
                    onChange={e => setShowcaseForm(f => ({ ...f, secteur: e.target.value }))}
                    placeholder="Agroalimentaire"
                  />
                </Field>
                <Field label={t('admin.exposants.form_espace')}>
                  <select
                    value={showcaseForm.espace_id}
                    onChange={e => {
                      const espace = espaces.find(sp => sp.id === e.target.value);
                      setShowcaseForm(f => ({
                        ...f,
                        espace_id: e.target.value,
                        pavillon: espace?.code || '',
                      }));
                    }}
                    className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  >
                    <option value="">{t('admin.exposants.form_none')}</option>
                    {espaces.map(espace => (
                      <option key={espace.id} value={espace.id}>
                        {espace.type === 'pavillon' ? 'Pavillon' : 'Espace'} {espace.code} — {espace.nom}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('exposant.vitrine.stand')}>
                  <Input
                    value={showcaseForm.stand}
                    onChange={e => setShowcaseForm(f => ({ ...f, stand: e.target.value }))}
                    placeholder="A1-03"
                  />
                </Field>
                <Field label={t('exposant.vitrine.country')}>
                  <Input
                    value={showcaseForm.pays}
                    onChange={e => setShowcaseForm(f => ({ ...f, pays: e.target.value }))}
                    placeholder="Cameroun"
                  />
                </Field>
              </div>

              <SectionTitle>{t('exposant.vitrine.key_figures')}</SectionTitle>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label={t('exposant.vitrine.year_founded')}>
                  <Input
                    value={showcaseForm.annee_creation}
                    onChange={e => setShowcaseForm(f => ({ ...f, annee_creation: e.target.value }))}
                    placeholder="2005"
                  />
                </Field>
                <Field label={t('exposant.vitrine.employees')}>
                  <Input
                    value={showcaseForm.nombre_employes}
                    onChange={e => setShowcaseForm(f => ({ ...f, nombre_employes: e.target.value }))}
                    placeholder="50"
                  />
                </Field>
                <Field label={t('exposant.vitrine.revenue')}>
                  <Input
                    value={showcaseForm.chiffre_affaires}
                    onChange={e => setShowcaseForm(f => ({ ...f, chiffre_affaires: e.target.value }))}
                    placeholder="5M€ / an"
                  />
                </Field>
              </div>

              <SectionTitle>{t('exposant.vitrine.contact')}</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t('exposant.vitrine.email')}>
                  <Input
                    type="email"
                    value={showcaseForm.email_contact}
                    onChange={e => setShowcaseForm(f => ({ ...f, email_contact: e.target.value }))}
                    placeholder="contact@entreprise.com"
                  />
                </Field>
                <Field label={t('exposant.vitrine.phone')}>
                  <Input
                    type="tel"
                    value={showcaseForm.phone_contact}
                    onChange={e => setShowcaseForm(f => ({ ...f, phone_contact: e.target.value }))}
                    placeholder="+237 6XX XXX XXX"
                  />
                </Field>
              </div>

              <SectionTitle>{t('exposant.vitrine.media')}</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t('exposant.vitrine.video_url')} hint="Ex : https://www.youtube.com/embed/VIDEO_ID">
                  <Input
                    value={showcaseForm.video_url}
                    onChange={e => setShowcaseForm(f => ({ ...f, video_url: e.target.value }))}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </Field>
                <Field label={t('exposant.vitrine.brochure_url')}>
                  <Input
                    value={showcaseForm.brochure_url}
                    onChange={e => setShowcaseForm(f => ({ ...f, brochure_url: e.target.value }))}
                    placeholder="https://exemple.com/brochure.pdf"
                  />
                </Field>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="featured"
                  checked={showcaseForm.is_featured}
                  onCheckedChange={checked =>
                    setShowcaseForm(f => ({ ...f, is_featured: checked === true }))
                  }
                />
                <label htmlFor="featured" className="text-sm text-foreground cursor-pointer">
                  {t('admin.exposants.featured')}
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel border-0">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">{t('exposant.vitrine.visual_identity')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Logo">
                  <div className="flex items-center gap-4">
                    {showcaseForm.logo_url && (
                      <div className="relative size-16 overflow-hidden rounded-xl border border-border/50 shrink-0 bg-white">
                        <Image src={showcaseForm.logo_url} alt="Logo" fill sizes="64px" className="object-contain" />
                      </div>
                    )}
                    <div className="relative flex-1">
                      <Upload className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="pl-10 h-12 pt-3 file:hidden"
                        disabled={uploadingLogo}
                        onChange={e => handleImageUpload(e.target.files?.[0] || null, 'logo_url')}
                      />
                      {uploadingLogo && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                </Field>

                <Field label="Cover">
                  <div className="flex items-center gap-4">
                    {showcaseForm.cover_url && (
                      <div className="relative h-24 w-full max-w-[200px] overflow-hidden rounded-xl border border-border/50 shrink-0 bg-muted">
                        <Image src={showcaseForm.cover_url} alt="Cover" fill sizes="200px" className="object-cover" />
                      </div>
                    )}
                    <div className="relative flex-1">
                      <Upload className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="pl-10 h-12 pt-3 file:hidden"
                        disabled={uploadingCover}
                        onChange={e => handleImageUpload(e.target.files?.[0] || null, 'cover_url')}
                      />
                      {uploadingCover && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card className="surface-panel border-0">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">
                {productForm.id ? t('exposant.vitrine.edit_product') : t('exposant.vitrine.add_product')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('exposant.vitrine.product_name')}>
                  <Input
                    value={productForm.nom}
                    onChange={e => setProductForm(f => ({ ...f, nom: e.target.value }))}
                  />
                </Field>
                <div className="space-y-2">
                  <Label>{t('exposant.vitrine.product_type')}</Label>
                  <Select
                    value={productForm.type || 'produit'}
                    onValueChange={v => setProductForm(f => ({ ...f, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="produit">{t('exposant.vitrine.product')}</SelectItem>
                      <SelectItem value="service">{t('exposant.vitrine.service')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('exposant.vitrine.category')}>
                  <Input
                    value={productForm.categorie}
                    onChange={e => setProductForm(f => ({ ...f, categorie: e.target.value }))}
                  />
                </Field>
                <Field label={t('exposant.vitrine.price')}>
                  <Input
                    value={productForm.prix_indicatif}
                    onChange={e => setProductForm(f => ({ ...f, prix_indicatif: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label={t('exposant.vitrine.description')}>
                <Textarea
                  value={productForm.description}
                  onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </Field>
              <Field label={t('exposant.vitrine.image')}>
                <div className="flex items-center gap-4">
                  {productForm.image_url && (
                    <div className="relative size-16 overflow-hidden rounded-xl border border-border/50 shrink-0">
                      <Image src={productForm.image_url} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                  )}
                  <div className="relative flex-1">
                    <Upload className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="pl-10 h-12 pt-3 file:hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error(t('exposant.vitrine.image_too_large'));
                          return;
                        }
                        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                        if (!allowed.includes(file.type)) {
                          toast.error(t('exposant.vitrine.format_unsupported'));
                          return;
                        }
                        try {
                          const compressed = await compressImage(file);
                          const ext = compressed.name.split('.').pop();
                          const fileName = `admin-${exposantId}-product-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
                          const { data, error } = await supabaseClient.storage
                            .from('vitrine-images')
                            .upload(fileName, compressed);
                          if (error) throw error;
                          const { data: { publicUrl } } = supabaseClient.storage
                            .from('vitrine-images')
                            .getPublicUrl(data.path);
                          setProductForm(f => ({ ...f, image_url: publicUrl }));
                          toast.success(t('exposant.vitrine.upload_success'));
                        } catch {
                          toast.error(t('exposant.vitrine.upload_error'));
                        }
                      }}
                    />
                  </div>
                </div>
              </Field>
              <div className="flex gap-3 pt-2">
                <Button onClick={saveProduct} disabled={savingProduct} className="rounded-xl">
                  {savingProduct && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {productForm.id ? t('common.save') : t('exposant.vitrine.add_product')}
                </Button>
                {productForm.id && (
                  <Button variant="outline" onClick={() => setProductForm(emptyProductForm)} className="rounded-xl">
                    {t('common.cancel')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {products.map(product => (
              <article
                key={product.id}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-background/50 p-5 transition-all hover:bg-muted/20 hover:flex flex-col gap-4"
              >
                {product.image_url && (
                  <div className="relative h-36 w-full overflow-hidden rounded-lg">
                    <Image src={product.image_url} alt={product.nom} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{product.nom}</h3>
                  <Badge variant="secondary" className="rounded-full">
                    {product.type === 'service' ? t('exposant.vitrine.service') : t('exposant.vitrine.product')}
                  </Badge>
                </div>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                )}
                {product.prix_indicatif && (
                  <p className="text-sm font-medium text-foreground">{product.prix_indicatif}</p>
                )}
                <div className="flex gap-2 mt-auto pt-2 border-t border-border/40">
                  <Button variant="ghost" size="sm" onClick={() => startEditProduct(product)} className="rounded-full">
                    <PencilLine className="mr-1.5 size-3.5" /> {t('common.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteProduct(product.id)}
                    disabled={deletingProductId === product.id}
                    className="rounded-full text-destructive hover:bg-destructive/10"
                  >
                    {deletingProductId === product.id ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1.5 size-3.5" />
                    )}
                    {t('common.delete')}
                  </Button>
                </div>
              </article>
            ))}
            {products.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <PackagePlus className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('exposant.vitrine.no_products')}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <Card className="surface-panel border-0">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">{t('exposant.vitrine.gallery')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="admin-gallery-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/60 rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingGallery ? (
                      <Loader2 className="size-8 animate-spin text-muted-foreground mb-3" />
                    ) : (
                      <ImagePlus className="size-8 text-muted-foreground mb-3" />
                    )}
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{t('exposant.vitrine.gallery_click')}</span> {t('exposant.vitrine.drag_drop')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('exposant.vitrine.upload_hint')}</p>
                  </div>
                  <input
                    id="admin-gallery-upload"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingGallery}
                    onChange={e => handleGalleryUpload(e.target.files)}
                  />
                </label>
              </div>

              {showcaseForm.gallery_urls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {showcaseForm.gallery_urls.map((url, i) => (
                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted">
                      <Image src={url} alt="" fill sizes="200px" className="object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="rounded-full size-8"
                          onClick={() => {
                            const newUrls = showcaseForm.gallery_urls.filter((_, idx) => idx !== i);
                            setShowcaseForm(f => ({ ...f, gallery_urls: newUrls }));
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card className="surface-panel border-0">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">{t('exposant.vitrine.social_networks')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="LinkedIn">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <IconLinkedin />
                    </span>
                    <Input
                      value={showcaseForm.linkedin_url}
                      onChange={e => setShowcaseForm(f => ({ ...f, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/company/..."
                      className="pl-10"
                    />
                  </div>
                </Field>
                <Field label="Facebook">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <IconFacebook />
                    </span>
                    <Input
                      value={showcaseForm.facebook_url}
                      onChange={e => setShowcaseForm(f => ({ ...f, facebook_url: e.target.value }))}
                      placeholder="https://facebook.com/..."
                      className="pl-10"
                    />
                  </div>
                </Field>
                <Field label="X (Twitter)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <IconTwitter />
                    </span>
                    <Input
                      value={showcaseForm.twitter_url}
                      onChange={e => setShowcaseForm(f => ({ ...f, twitter_url: e.target.value }))}
                      placeholder="https://x.com/..."
                      className="pl-10"
                    />
                  </div>
                </Field>
                <Field label="Instagram">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <IconInstagram />
                    </span>
                    <Input
                      value={showcaseForm.instagram_url}
                      onChange={e => setShowcaseForm(f => ({ ...f, instagram_url: e.target.value }))}
                      placeholder="https://instagram.com/..."
                      className="pl-10"
                    />
                  </div>
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button onClick={saveShowcase} disabled={saving} size="lg" className="rounded-full px-8 h-12 text-base font-semibold">
          {saving && <Loader2 className="mr-2 size-5 animate-spin" />}
          <Save className="mr-2 size-5" /> {t('common.save')}
        </Button>
      </div>
    </div>
  );
}
