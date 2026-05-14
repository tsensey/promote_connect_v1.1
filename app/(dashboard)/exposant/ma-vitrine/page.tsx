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
import type { Database } from "@/types/database.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  });
  const [productForm, setProductForm] = useState(emptyProductForm);

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
      toast.error("Le nom de la vitrine est requis.");
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

      toast.success("Vitrine enregistrée avec succès.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement de la vitrine.",
      );
    } finally {
      setSavingShowcase(false);
    }
  };

  const saveProduct = async () => {
    if (!exposant) {
      toast.error("Enregistrez d'abord votre vitrine.");
      return;
    }

    if (!productForm.nom.trim()) {
      toast.error("Le nom du produit est requis.");
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
        });

        if (error) throw error;
      }

      setProductForm(emptyProductForm);
      await refreshProducts(exposant.id);
      toast.success(productForm.id ? "Produit mis à jour." : "Produit ajouté.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement du produit.",
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
      toast.success("Produit supprimé.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible.",
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
              Espace réservé aux exposants
            </h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              La gestion de la vitrine est disponible uniquement pour les
              comptes exposants.
            </p>
          </div>
          <Link href="/app">
            <Button className="rounded-xl">
              Retour à l&apos;accueil
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {exposant && (
          <Link href={`/annuaire/${exposant.id}`}>
            <Button variant="outline" className="rounded-xl bg-white/85">
              Voir mon profil public
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="presentation" className="flex flex-col gap-y-1.5">
        <TabsList>
          <TabsTrigger value="presentation">
            {`Présentation de l'entreprise`}
          </TabsTrigger>
          <TabsTrigger value="produits">Mes produits</TabsTrigger>
          <TabsTrigger value="gallery">Galerie multimédia</TabsTrigger>
        </TabsList>
        <TabsContent value="presentation">
          {/* ─── Présentation principale ─── */}
          <Card className="surface-panel border-0">
            <CardHeader>
              <CardTitle>Présentation de l&apos;entreprise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nom de l'entreprise *">
                  <Input
                    value={showcaseForm.nom}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({ ...f, nom: e.target.value }))
                    }
                    placeholder="Nom de votre entreprise"
                  />
                </Field>
                <Field label="Site web">
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
                label="Description courte"
                hint="Accroche affichée sous votre nom dans l'annuaire (1-2 phrases)."
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
                  placeholder="Une courte présentation de votre entreprise."
                />
              </Field>

              <Field
                label="À propos (description complète)"
                hint="Décrivez votre activité, votre histoire, vos valeurs et vos avantages concurrentiels."
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
                  placeholder="Présentez votre entreprise en détail : domaines d'expertise, histoire, différenciateurs, marchés cibles..."
                />
              </Field>

              <SectionTitle>Localisation &amp; Salon</SectionTitle>
              <div className="grid gap-4 md:grid-cols-4">
                <Field label="Secteur">
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
                <Field label="Pavillon">
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
                <Field label="Stand">
                  <Input
                    value={showcaseForm.stand}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({ ...f, stand: e.target.value }))
                    }
                    placeholder="A1-03"
                  />
                </Field>
                <Field label="Pays">
                  <Input
                    value={showcaseForm.pays}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({ ...f, pays: e.target.value }))
                    }
                    placeholder="Cameroun"
                  />
                </Field>
              </div>

              <SectionTitle>Chiffres clés</SectionTitle>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Année de création">
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
                <Field label="Effectif">
                  <Input
                    value={showcaseForm.nombre_employes}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({
                        ...f,
                        nombre_employes: e.target.value,
                      }))
                    }
                    placeholder="50-200 employés"
                  />
                </Field>
                <Field label="Chiffre d'affaires">
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

              <SectionTitle>Contacts directs</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email de contact">
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
                <Field label="Téléphone">
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

              <SectionTitle>Réseaux sociaux</SectionTitle>
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

              <SectionTitle>Médias &amp; Documents</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Logo (URL)"
                  hint="Image carrée recommandée."
                >
                  <Input
                    value={showcaseForm.logo_url}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({
                        ...f,
                        logo_url: e.target.value,
                      }))
                    }
                    placeholder="https://exemple.com/logo.png"
                  />
                </Field>
                <Field
                  label="Image de couverture (URL)"
                  hint="Image d'en-tête de votre profil. Format recommandé : 1200×400px."
                >
                  <Input
                    value={showcaseForm.cover_url}
                    onChange={(e) =>
                      setShowcaseForm((f) => ({
                        ...f,
                        cover_url: e.target.value,
                      }))
                    }
                    placeholder="https://exemple.com/cover.jpg"
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Vidéo de présentation (URL embed YouTube / Vimeo)"
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
                  hint="Lien direct vers votre brochure téléchargeable."
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

              <Button
                onClick={saveShowcase}
                disabled={savingShowcase}
                className="rounded-xl"
              >
                {savingShowcase ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer la vitrine"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="produits">
          {/* ─── Catalogue produits ─── */}
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="surface-panel border-0">
              <CardHeader>
                <CardTitle>
                  {productForm.id
                    ? "Modifier un produit"
                    : "Ajouter un produit"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Nom">
                  <Input
                    value={productForm.nom}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, nom: e.target.value }))
                    }
                    placeholder="Catalogue premium"
                  />
                </Field>
                <Field label="Catégorie">
                  <Input
                    value={productForm.categorie}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        categorie: e.target.value,
                      }))
                    }
                    placeholder="Service / Produit / Solution"
                  />
                </Field>
                <Field label="Prix indicatif">
                  <Input
                    value={productForm.prix_indicatif}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        prix_indicatif: e.target.value,
                      }))
                    }
                    placeholder="Sur devis / À partir de 500€"
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    rows={5}
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Décrivez votre offre, sa valeur et son usage."
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
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <PackagePlus className="mr-2 size-4" />
                        {productForm.id ? "Mettre à jour" : "Ajouter"}
                      </>
                    )}
                  </Button>
                  {productForm.id && (
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setProductForm(emptyProductForm)}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="surface-panel border-0">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Catalogue publié</CardTitle>
                  <Badge variant="secondary" className="rounded-full">
                    {products.length} produit{products.length > 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="surface-subtle py-12 text-center">
                    <Store className="mx-auto mb-3 size-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Votre catalogue est vide. Ajoutez votre première offre
                      pour rendre votre profil plus visible.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {products.map((product) => (
                      <article
                        key={product.id}
                        className="surface-subtle flex flex-col gap-4 p-5"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h2 className="text-xl text-foreground">
                              {product.nom}
                            </h2>
                            {product.categorie && (
                              <Badge
                                variant="outline"
                                className="rounded-full shrink-0"
                              >
                                {product.categorie}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {product.description ||
                              "Aucune description renseignée."}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-foreground">
                            {product.prix_indicatif || "Prix non renseigné"}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => startEditProduct(product)}
                            >
                              <PencilLine className="mr-2 size-3.5" />
                              Modifier
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
        <TabsContent value="gallery"></TabsContent>
      </Tabs>
    </div>
  );
}
