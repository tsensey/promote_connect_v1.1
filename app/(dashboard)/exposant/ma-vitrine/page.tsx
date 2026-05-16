"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  PackagePlus,
  PencilLine,
  Store,
  Trash2,
  Upload,
  ImagePlus,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { supabaseClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import type { Database } from "@/types/database.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Icônes de marque (SVG inline) ──
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
      fill="none"
    />
    <path d="M3 3h7l11 18H14Z" />
  </svg>
);
const IconInstagram = () => (
  <svg
    className="size-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

type Exposant = Database["public"]["Tables"]["exposants"]["Row"];
type Produit = Database["public"]["Tables"]["produits"]["Row"];

const emptyProductForm = {
  id: "",
  nom: "",
  description: "",
  categorie: "",
  prix_indicatif: "",
  type: "produit" as string | null,
  image_url: "",
};

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
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

export default function ManageVitrinePage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingShowcase, setSavingShowcase] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const { t } = useTranslation();
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [exposant, setExposant] = useState<Exposant | null>(null);
  const [products, setProducts] = useState<Produit[]>([]);
  const [showcaseForm, setShowcaseForm] = useState({
    nom: "",
    description: "",
    long_description: "",
    secteur: "",
    pavillon: "",
    stand: "",
    pays: "",
    website: "",
    email_contact: "",
    phone_contact: "",
    facebook_url: "",
    linkedin_url: "",
    twitter_url: "",
    instagram_url: "",
    cover_url: "",
    logo_url: "",
    brochure_url: "",
    video_url: "",
    chiffre_affaires: "",
    annee_creation: "",
    nombre_employes: "",
    gallery_urls: [] as string[],
  });
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    
    setUploadingGallery(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast.error(t('exposant.vitrine.image_name_too_large', { name: file.name }));
          continue;
        }
        
        const ext = file.name.split('.').pop();
        const fileName = `${user.id}-gallery-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        
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
    } catch (error) {
      toast.error(t('exposant.vitrine.upload_error'));
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleImageUpload = async (file: File | null, field: 'logo_url' | 'cover_url' | 'product_image') => {
    if (!file || !user) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('exposant.vitrine.image_too_large'));
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error(t('exposant.vitrine.format_unsupported'));
      return;
    }

    const isProduct = field === 'product_image';
    if (field === 'logo_url') setUploadingLogo(true);
    else if (field === 'cover_url') setUploadingCover(true);
    else setUploadingProductImage(true);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}-${field}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { data, error } = await supabaseClient.storage
        .from('vitrine-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabaseClient.storage
        .from('vitrine-images')
        .getPublicUrl(data.path);

      if (isProduct) {
        setProductForm(f => ({ ...f, image_url: publicUrl }));
      } else {
        setShowcaseForm(f => ({ ...f, [field]: publicUrl }));
      }
      toast.success(t('exposant.vitrine.upload_success'));
    } catch (error) {
      toast.error(t('exposant.vitrine.upload_error'));
    } finally {
      if (field === 'logo_url') setUploadingLogo(false);
      else if (field === 'cover_url') setUploadingCover(false);
      else setUploadingProductImage(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLoading(true);
      const { data: existingExposant } = await supabaseClient
        .from("exposants")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (existingExposant) {
        setExposant(existingExposant);
        setShowcaseForm({
          nom: existingExposant.nom,
          description: existingExposant.description || "",
          long_description: existingExposant.long_description || "",
          secteur: existingExposant.secteur || "",
          pavillon: existingExposant.pavillon || "",
          stand: existingExposant.stand || "",
          pays: existingExposant.pays || "",
          website: existingExposant.website || "",
          email_contact: existingExposant.email_contact || "",
          phone_contact: existingExposant.phone_contact || "",
          facebook_url: existingExposant.facebook_url || "",
          linkedin_url: existingExposant.linkedin_url || "",
          twitter_url: existingExposant.twitter_url || "",
          instagram_url: existingExposant.instagram_url || "",
          cover_url: existingExposant.cover_url || "",
          logo_url: existingExposant.logo_url || "",
          brochure_url: existingExposant.brochure_url || "",
          video_url: existingExposant.video_url || "",
          chiffre_affaires: existingExposant.chiffre_affaires || "",
          annee_creation: existingExposant.annee_creation || "",
          nombre_employes: existingExposant.nombre_employes || "",
          gallery_urls: existingExposant.gallery_urls || [],
        });

        const { data: existingProducts } = await supabaseClient
          .from("produits")
          .select("*")
          .eq("exposant_id", existingExposant.id)
          .order("created_at", { ascending: false });

        setProducts(existingProducts || []);
      } else {
        setShowcaseForm((f) => ({
          ...f,
          nom: profile?.company || profile?.full_name || "",
          secteur: profile?.sector || "",
          pavillon: profile?.pavillon || "",
          pays: profile?.country || "",
        }));
      }

      setLoading(false);
    };

    void loadData();
  }, [
    profile?.company,
    profile?.country,
    profile?.full_name,
    profile?.pavillon,
    profile?.sector,
    user,
  ]);

  const refreshProducts = async (exposantId: string) => {
    const { data } = await supabaseClient
      .from("produits")
      .select("*")
      .eq("exposant_id", exposantId)
      .order("created_at", { ascending: false });

    setProducts(data || []);
  };

  const saveShowcase = async () => {
    if (!user) return;

    if (!showcaseForm.nom.trim()) {
      toast.error(t('exposant.vitrine.name_required'));
      return;
    }

    setSavingShowcase(true);

    try {
      const payload = {
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
      };

      if (exposant) {
        const { data, error } = await supabaseClient
          .from("exposants")
          .update(payload)
          .eq("id", exposant.id)
          .select()
          .single();

        if (error) throw error;
        setExposant(data);
      } else {
        const { data, error } = await supabaseClient
          .from("exposants")
          .insert({ profile_id: user.id, ...payload })
          .select()
          .single();

        if (error) throw error;
        setExposant(data);
      }

      toast.success(t('exposant.vitrine.saved'));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('exposant.vitrine.save_error'),
      );
    } finally {
      setSavingShowcase(false);
    }
  };

  const saveProduct = async () => {
    if (!exposant) {
      toast.error(t('exposant.vitrine.save_vitrine_first'));
      return;
    }

    if (!productForm.nom.trim()) {
      toast.error(t('exposant.vitrine.product_name_required'));
      return;
    }

    setSavingProduct(true);

    try {
      if (productForm.id) {
        const { error } = await supabaseClient
          .from("produits")
          .update({
            nom: productForm.nom.trim(),
            description: productForm.description.trim() || null,
            categorie: productForm.categorie.trim() || null,
            prix_indicatif: productForm.prix_indicatif.trim() || null,
            type: productForm.type,
            image_url: productForm.image_url || null,
          })
          .eq("id", productForm.id);

        if (error) throw error;
      } else {
        const { error } = await supabaseClient.from("produits").insert({
          exposant_id: exposant.id,
          nom: productForm.nom.trim(),
          description: productForm.description.trim() || null,
          categorie: productForm.categorie.trim() || null,
          prix_indicatif: productForm.prix_indicatif.trim() || null,
          type: productForm.type,
          image_url: productForm.image_url || null,
        });

        if (error) throw error;
      }

      setProductForm(emptyProductForm);
      await refreshProducts(exposant.id);
      toast.success(productForm.id ? t('exposant.vitrine.product_updated') : t('exposant.vitrine.product_added'));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('exposant.vitrine.product_save_error'),
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const startEditProduct = (product: Produit) => {
    setProductForm({
      id: product.id,
      nom: product.nom,
      description: product.description || "",
      categorie: product.categorie || "",
      prix_indicatif: product.prix_indicatif || "",
      type: product.type || "produit",
      image_url: product.image_url || "",
    });
  };

  const deleteProduct = async (productId: string) => {
    setDeletingProductId(productId);
    try {
      const { error } = await supabaseClient
        .from("produits")
        .delete()
        .eq("id", productId);
      if (error) throw error;
      if (exposant) await refreshProducts(exposant.id);
      toast.success(t('exposant.vitrine.product_deleted'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('exposant.vitrine.delete_error'),
      );
    } finally {
      setDeletingProductId(null);
    }
  };

  if (profile?.role !== "exposant") {
    return (
      <Card className="surface-panel border-0">
        <CardContent className="space-y-4 p-8 text-center">
          <Store className="mx-auto size-10 text-primary" />
          <div>
            <h1 className="text-2xl text-foreground">
              {t('exposant.vitrine.restricted')}
            </h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {t('exposant.vitrine.restricted_desc')}
            </p>
          </div>
          <Link href="/app">
            <Button className="rounded-xl">
              {t('exposant.vitrine.back_home')}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="surface-panel h-56 animate-pulse" />
        <div className="surface-panel h-80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {exposant && (
          <Link href={`/annuaire/${exposant.id}`}>
            <Button variant="outline" className="rounded-xl bg-white/85">
              {t('dashboard.home.view_profile')}
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="presentation" className="flex flex-col gap-y-1.5">
        <TabsList>
          <TabsTrigger value="presentation">
            {t('exposant.vitrine.presentation')}
          </TabsTrigger>
          <TabsTrigger value="produits">{t('exposant.vitrine.my_products')}</TabsTrigger>
          <TabsTrigger value="gallery">{t('exposant.vitrine.gallery')}</TabsTrigger>
        </TabsList>
        <TabsContent value="presentation">
          {/* ─── Présentation principale ─── */}
          <div className="space-y-6">
            <Card className="surface-panel border-0">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg">{t('exposant.vitrine.general_info')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('exposant.vitrine.general_info_desc')}</p>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t('exposant.vitrine.company_name')}>
                  <Input
                    value={showcaseForm.nom}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({ ...f, nom: e.target.value }))
                    }
                    placeholder={t('exposant.vitrine.company_name_placeholder')}
                  />
                </Field>
                <Field label={t('exposant.vitrine.website')}>
                  <Input
                    value={showcaseForm.website}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({
                        ...f,
                        website: e.target.value,
                      }))
                    }
                    placeholder="https://entreprise.com"
                  />
                </Field>
              </div>

              <Field
                label={t('exposant.vitrine.short_desc')}
                hint={t('exposant.vitrine.short_desc_hint')}
              >
                <Textarea
                  rows={2}
                  value={showcaseForm.description}
                  onChange={(e) =>
                    setShowcaseForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder={t('exposant.vitrine.short_desc_placeholder')}
                />
              </Field>

              <Field
                label={t('exposant.vitrine.about')}
                hint={t('exposant.vitrine.about_hint')}
              >
                <Textarea
                  rows={6}
                  value={showcaseForm.long_description}
                  onChange={(e) =>
                    setShowcaseForm((f) => ({
                      ...f,
                      long_description: e.target.value,
                    }))
                  }
                  placeholder={t('exposant.vitrine.about_placeholder')}
                />
              </Field>

              </CardContent>
            </Card>

            <Card className="surface-panel border-0">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg">{t('exposant.vitrine.visual_identity')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('exposant.vitrine.personalize')}</p>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Field
                    label={t('exposant.vitrine.logo_label')}
                    hint={t('exposant.vitrine.logo_hint')}
                  >
                    <div className="flex items-center gap-4">
                      {showcaseForm.logo_url && (
                        <div className="relative size-16 overflow-hidden rounded-xl border border-border/50 shrink-0 bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={showcaseForm.logo_url} className="size-full object-contain" alt={t('exposant.vitrine.logo_label')} />
                          <button type="button" onClick={() => setShowcaseForm(f => ({ ...f, logo_url: '' }))} className="absolute -right-1 -top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"><X className="size-3" /></button>
                        </div>
                      )}
                      <div className="relative w-full">
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingLogo}
                          className="file:hidden pl-10 h-12 pt-3"
                          onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'logo_url')}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><ImagePlus className="size-5" /></span>
                        {uploadingLogo && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />}
                      </div>
                    </div>
                  </Field>
                  <Field
                    label={t('exposant.vitrine.cover_label')}
                    hint={t('exposant.vitrine.cover_hint')}
                  >
                    <div className="flex flex-col gap-3">
                      {showcaseForm.cover_url && (
                        <div className="relative h-24 w-full overflow-hidden rounded-xl border border-border/50 shrink-0 bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={showcaseForm.cover_url} className="h-full w-full object-cover" alt={t('exposant.vitrine.cover_label')} />
                          <button type="button" onClick={() => setShowcaseForm(f => ({ ...f, cover_url: '' }))} className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"><X className="size-3" /></button>
                        </div>
                      )}
                      <div className="relative w-full">
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingCover}
                          className="file:hidden pl-10 h-12 pt-3"
                          onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'cover_url')}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><ImagePlus className="size-5" /></span>
                        {uploadingCover && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />}
                      </div>
                    </div>
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-panel border-0">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg">{t('exposant.vitrine.location_title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Field label={t('exposant.vitrine.sector')}>
                  <Input
                    value={showcaseForm.secteur}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({
                        ...f,
                        secteur: e.target.value,
                      }))
                    }
                    placeholder="Agroalimentaire"
                  />
                </Field>
                <Field label={t('exposant.vitrine.pavillon_label')}>
                  <Input
                    value={showcaseForm.pavillon}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({
                        ...f,
                        pavillon: e.target.value,
                      }))
                    }
                    placeholder="A"
                  />
                </Field>
                <Field label={t('exposant.vitrine.stand_label')}>
                  <Input
                    value={showcaseForm.stand}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({ ...f, stand: e.target.value }))
                    }
                    placeholder="A1-03"
                  />
                </Field>
                <Field label={t('exposant.vitrine.country')}>
                  <Input
                    value={showcaseForm.pays}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({ ...f, pays: e.target.value }))
                    }
                    placeholder="Cameroun"
                  />
                </Field>
              </div>

              </CardContent>
            </Card>

            <Card className="surface-panel border-0">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg">{t('exposant.vitrine.key_figures')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label={t('exposant.vitrine.year_founded')}>
                  <Input
                    value={showcaseForm.annee_creation}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({
                        ...f,
                        annee_creation: e.target.value,
                      }))
                    }
                    placeholder="2005"
                  />
                </Field>
                <Field label={t('exposant.vitrine.employees')}>
                  <Input
                    value={showcaseForm.nombre_employes}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({
                        ...f,
                        nombre_employes: e.target.value,
                      }))
                    }
                    placeholder={t('exposant.vitrine.employees_placeholder')}
                  />
                </Field>
                <Field label={t('exposant.vitrine.revenue_label')}>
                  <Input
                    value={showcaseForm.chiffre_affaires}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({
                        ...f,
                        chiffre_affaires: e.target.value,
                      }))
                    }
                    placeholder="5M€ / an"
                  />
                </Field>
              </div>

              </CardContent>
            </Card>

            <Card className="surface-panel border-0">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg">{t('exposant.vitrine.contacts_social')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <SectionTitle>{t('exposant.vitrine.direct_contacts')}</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t('exposant.vitrine.contact_email')}>
                  <Input
                    type="email"
                    value={showcaseForm.email_contact}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({
                        ...f,
                        email_contact: e.target.value,
                      }))
                    }
                    placeholder="contact@entreprise.com"
                  />
                </Field>
                <Field label={t('exposant.vitrine.phone')}>
                  <Input
                    type="tel"
                    value={showcaseForm.phone_contact}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({
                        ...f,
                        phone_contact: e.target.value,
                      }))
                    }
                    placeholder="+237 6XX XXX XXX"
                  />
                </Field>
              </div>

              <SectionTitle>{t('exposant.vitrine.social')}</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="LinkedIn">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <IconLinkedin />
                    </span>
                    <Input
                      value={showcaseForm.linkedin_url}
                      onChange={(e) =>
                        setShowcaseForm((f) => ({
                          ...f,
                          linkedin_url: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setShowcaseForm((f) => ({
                          ...f,
                          facebook_url: e.target.value,
                        }))
                      }
                      placeholder="https://facebook.com/..."
                      className="pl-10"
                    />
                  </div>
                </Field>
                <Field label="X / Twitter">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <IconTwitter />
                    </span>
                    <Input
                      value={showcaseForm.twitter_url}
                      onChange={(e) =>
                        setShowcaseForm((f) => ({
                          ...f,
                          twitter_url: e.target.value,
                        }))
                      }
                      placeholder="https://twitter.com/..."
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
                      onChange={(e) =>
                        setShowcaseForm((f) => ({
                          ...f,
                          instagram_url: e.target.value,
                        }))
                      }
                      placeholder="https://instagram.com/..."
                      className="pl-10"
                    />
                  </div>
                </Field>
              </div>
              </CardContent>
            </Card>

            <Card className="surface-panel border-0">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg">{t('exposant.vitrine.media_docs')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label={t('exposant.vitrine.video_url')}
                    hint="Ex : https://www.youtube.com/embed/VOTRE_ID"
                  >
                    <Input
                      value={showcaseForm.video_url}
                      onChange={(e) =>
                        setShowcaseForm((f) => ({
                          ...f,
                          video_url: e.target.value,
                        }))
                      }
                      placeholder="https://www.youtube.com/embed/..."
                    />
                  </Field>
                  <Field
                    label="Brochure commerciale (URL PDF)"
                    hint={t('exposant.vitrine.brochure_url')}
                  >
                    <Input
                      value={showcaseForm.brochure_url}
                      onChange={(e) =>
                        setShowcaseForm((f) => ({
                          ...f,
                          brochure_url: e.target.value,
                        }))
                      }
                      placeholder="https://exemple.com/brochure.pdf"
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>

            <div className="sticky bottom-4 z-10 flex justify-end">
              <Button
                onClick={saveShowcase}
                disabled={savingShowcase}
                className="rounded-full shadow-lg px-8 h-12 text-base font-semibold"
                size="lg"
              >
                {savingShowcase ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  t('common.save')
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="produits">
          {/* ─── Catalogue produits ─── */}
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="surface-panel border-0">
              <CardHeader>
                <CardTitle>
                  {productForm.id
                    ? t('exposant.vitrine.edit_product')
                    : t('exposant.vitrine.add_product')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('exposant.vitrine.name_label')}>
                    <Input
                      value={productForm.nom}
                      onChange={(e) =>
                        setProductForm((f) => ({ ...f, nom: e.target.value }))
                      }
                      placeholder="Catalogue premium"
                    />
                  </Field>
                  <Field label={t('exposant.vitrine.type_label')}>
                    <Select value={productForm.type || "produit"} onValueChange={v => setProductForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('exposant.vitrine.product_type_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produit">{t('exposant.vitrine.product_type_produit')}</SelectItem>
                        <SelectItem value="service">{t('exposant.vitrine.product_type_service')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('exposant.vitrine.product_category')}>
                    <Input
                      value={productForm.categorie}
                      onChange={(e) =>
                        setProductForm((f) => ({
                          ...f,
                          categorie: e.target.value,
                        }))
                      }
                      placeholder="Logiciel / Conseil..."
                    />
                  </Field>
                  <Field label={t('exposant.vitrine.price_label')}>
                    <Input
                      value={productForm.prix_indicatif}
                      onChange={(e) =>
                        setProductForm((f) => ({
                          ...f,
                          prix_indicatif: e.target.value,
                        }))
                      }
                      placeholder={t('exposant.vitrine.price_placeholder')}
                    />
                  </Field>
                </div>
                <Field label={t('exposant.vitrine.product_image_label')}>
                  <div className="flex items-center gap-3">
                    {productForm.image_url && (
                      <div className="relative size-16 overflow-hidden rounded-xl border border-border/50 shrink-0 bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={productForm.image_url} className="size-full object-cover" alt={t('exposant.vitrine.product_type_produit')} />
                        <button type="button" onClick={() => setProductForm(f => ({ ...f, image_url: '' }))} className="absolute -right-1 -top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"><X className="size-3" /></button>
                      </div>
                    )}
                    <div className="relative w-full">
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingProductImage}
                        className="file:hidden pl-10"
                        onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'product_image')}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><ImagePlus className="size-4" /></span>
                      {uploadingProductImage && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                </Field>
                <Field label={t('exposant.vitrine.description_label')}>
                  <Textarea
                    rows={5}
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder={t('exposant.vitrine.product_desc_placeholder')}
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={saveProduct}
                    disabled={savingProduct || !exposant}
                    className="rounded-xl"
                  >
                    {savingProduct ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {t('common.saving')}
                      </>
                    ) : (
                      <>
                        <PackagePlus className="mr-2 size-4" />
                        {productForm.id ? t('exposant.vitrine.product_update') : t('exposant.vitrine.product_add')}
                      </>
                    )}
                  </Button>
                  {productForm.id && (
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setProductForm(emptyProductForm)}
                    >
                      {t('common.cancel')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="surface-panel border-0">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>{t('exposant.vitrine.catalogue_published')}</CardTitle>
                  <Badge variant="secondary" className="rounded-full">
                    {t('exposant.vitrine.products_count', { count: products.length })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="surface-subtle py-12 text-center">
                    <Store className="mx-auto mb-3 size-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('exposant.vitrine.catalogue_empty')}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {products.map((product) => (
                      <article
                        key={product.id}
                        className="group relative overflow-hidden rounded-xl border border-border/50 bg-background/50 p-5 transition-all hover:bg-muted/20 hover:shadow-md flex flex-col gap-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-4">
                              {product.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.image_url} alt="" className="size-16 rounded-xl object-cover bg-muted border border-border/50 shrink-0" />
                              ) : (
                                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted/50 border border-border/50 text-muted-foreground">
                                  <PackagePlus className="size-6" />
                                </div>
                              )}
                              <div>
                                <h2 className="text-lg font-medium text-foreground leading-tight">
                                  {product.nom}
                                </h2>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {product.type && (
                                    <Badge variant="secondary" className="rounded-full shrink-0 text-[10px]">
                                      {product.type === 'service' ? t('exposant.vitrine.product_type_service') : t('exposant.vitrine.product_type_produit')}
                                    </Badge>
                                  )}
                                  {product.categorie && (
                                    <Badge variant="outline" className="rounded-full shrink-0 text-[10px]">
                                      {product.categorie}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {product.description ||
                              t('exposant.vitrine.no_description_short')}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-foreground">
                            {product.prix_indicatif || t('exposant.vitrine.no_price')}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => startEditProduct(product)}
                            >
                              <PencilLine className="mr-2 size-3.5" />
                              {t('common.edit')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-destructive"
                              disabled={deletingProductId === product.id}
                              onClick={() => deleteProduct(product.id)}
                            >
                              {deletingProductId === product.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="gallery">
          <Card className="surface-panel border-0">
            <CardHeader>
              <CardTitle>{t('exposant.vitrine.gallery')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('exposant.vitrine.gallery_desc')}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="gallery-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/60 rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingGallery ? (
                      <Loader2 className="size-8 animate-spin text-muted-foreground mb-3" />
                    ) : (
                      <Upload className="size-8 text-muted-foreground mb-3" />
                    )}
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{t('exposant.vitrine.gallery_click')}</span> {t('exposant.vitrine.drag_drop')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('exposant.vitrine.upload_hint')}</p>
                  </div>
                  <input 
                    id="gallery-upload" 
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="size-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="rounded-full size-8"
                          onClick={() => {
                            const newUrls = showcaseForm.gallery_urls.filter((_, idx) => idx !== i);
                            setShowcaseForm(f => ({ ...f, gallery_urls: newUrls }));
                            // Automatically save the showcase to persist deletion
                            // Or leave it for the explicit save
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={saveShowcase}
                disabled={savingShowcase}
                className="rounded-xl"
              >
                {savingShowcase ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  t('common.save')
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
