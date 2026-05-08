'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, PackagePlus, PencilLine, Store, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { supabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Database } from '@/types/database.types';

type Exposant = Database['public']['Tables']['exposants']['Row'];
type Produit = Database['public']['Tables']['produits']['Row'];

const emptyProductForm = {
  id: '',
  nom: '',
  description: '',
  categorie: '',
  prix_indicatif: '',
};

export default function ManageProductsPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingShowcase, setSavingShowcase] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [exposant, setExposant] = useState<Exposant | null>(null);
  const [products, setProducts] = useState<Produit[]>([]);
  const [showcaseForm, setShowcaseForm] = useState({
    nom: '',
    description: '',
    secteur: '',
    pavillon: '',
    stand: '',
    pays: '',
    website: '',
  });
  const [productForm, setProductForm] = useState(emptyProductForm);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        return;
      }

      setLoading(true);
      const { data: existingExposant } = await supabaseClient
        .from('exposants')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (existingExposant) {
        setExposant(existingExposant);
        setShowcaseForm({
          nom: existingExposant.nom,
          description: existingExposant.description || '',
          secteur: existingExposant.secteur || '',
          pavillon: existingExposant.pavillon || '',
          stand: existingExposant.stand || '',
          pays: existingExposant.pays || '',
          website: existingExposant.website || '',
        });

        const { data: existingProducts } = await supabaseClient
          .from('produits')
          .select('*')
          .eq('exposant_id', existingExposant.id)
          .order('created_at', { ascending: false });

        setProducts(existingProducts || []);
      } else {
        setShowcaseForm((current) => ({
          ...current,
          nom: profile?.company || profile?.full_name || '',
          secteur: profile?.sector || '',
          pavillon: profile?.pavillon || '',
          pays: profile?.country || '',
        }));
      }

      setLoading(false);
    };

    void loadData();
  }, [profile?.company, profile?.country, profile?.full_name, profile?.pavillon, profile?.sector, user]);

  const refreshProducts = async (exposantId: string) => {
    const { data } = await supabaseClient
      .from('produits')
      .select('*')
      .eq('exposant_id', exposantId)
      .order('created_at', { ascending: false });

    setProducts(data || []);
  };

  const saveShowcase = async () => {
    if (!user) {
      return;
    }

    if (!showcaseForm.nom.trim()) {
      toast.error('Le nom de la vitrine est requis.');
      return;
    }

    setSavingShowcase(true);

    try {
      if (exposant) {
        const { data, error } = await supabaseClient
          .from('exposants')
          .update({
            nom: showcaseForm.nom.trim(),
            description: showcaseForm.description.trim() || null,
            secteur: showcaseForm.secteur.trim() || null,
            pavillon: showcaseForm.pavillon.trim() || null,
            stand: showcaseForm.stand.trim() || null,
            pays: showcaseForm.pays.trim() || null,
            website: showcaseForm.website.trim() || null,
          })
          .eq('id', exposant.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setExposant(data);
      } else {
        const { data, error } = await supabaseClient
          .from('exposants')
          .insert({
            profile_id: user.id,
            nom: showcaseForm.nom.trim(),
            description: showcaseForm.description.trim() || null,
            secteur: showcaseForm.secteur.trim() || null,
            pavillon: showcaseForm.pavillon.trim() || null,
            stand: showcaseForm.stand.trim() || null,
            pays: showcaseForm.pays.trim() || null,
            website: showcaseForm.website.trim() || null,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        setExposant(data);
      }

      toast.success('Vitrine enregistree.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l enregistrement de la vitrine.');
    } finally {
      setSavingShowcase(false);
    }
  };

  const saveProduct = async () => {
    if (!exposant) {
      toast.error('Enregistrez d abord votre vitrine.');
      return;
    }

    if (!productForm.nom.trim()) {
      toast.error('Le nom du produit est requis.');
      return;
    }

    setSavingProduct(true);

    try {
      if (productForm.id) {
        const { error } = await supabaseClient
          .from('produits')
          .update({
            nom: productForm.nom.trim(),
            description: productForm.description.trim() || null,
            categorie: productForm.categorie.trim() || null,
            prix_indicatif: productForm.prix_indicatif.trim() || null,
          })
          .eq('id', productForm.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabaseClient
          .from('produits')
          .insert({
            exposant_id: exposant.id,
            nom: productForm.nom.trim(),
            description: productForm.description.trim() || null,
            categorie: productForm.categorie.trim() || null,
            prix_indicatif: productForm.prix_indicatif.trim() || null,
          });

        if (error) {
          throw error;
        }
      }

      setProductForm(emptyProductForm);
      await refreshProducts(exposant.id);
      toast.success(productForm.id ? 'Produit mis a jour.' : 'Produit ajoute.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l enregistrement du produit.');
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
    });
  };

  const deleteProduct = async (productId: string) => {
    setDeletingProductId(productId);

    try {
      const { error } = await supabaseClient.from('produits').delete().eq('id', productId);
      if (error) {
        throw error;
      }

      if (exposant) {
        await refreshProducts(exposant.id);
      }
      toast.success('Produit supprime.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Suppression impossible.');
    } finally {
      setDeletingProductId(null);
    }
  };

  if (profile?.role !== 'exposant') {
    return (
      <Card className="surface-panel border-0">
        <CardContent className="space-y-4 p-8 text-center">
          <Store className="mx-auto size-10 text-primary" />
          <div>
            <h1 className="text-2xl text-foreground">Espace reserve aux exposants</h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              La gestion de la vitrine est disponible uniquement pour les comptes exposes en tant qu exposants.
            </p>
          </div>
          <Link href="/app">
            <Button className="rounded-xl">
              Retour a l accueil
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
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">
            Module vitrine
          </p>
          <h1 className="text-4xl text-foreground">Gerer ma vitrine et mes produits</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Mettez a jour votre presentation, vos offres et votre catalogue visible par toute la communaute PROMOTE-CONNECT.
          </p>
        </div>
        {exposant && (
          <Link href={`/vitrine/${exposant.id}`}>
            <Button variant="outline" className="rounded-xl bg-white/85">
              Voir ma vitrine publique
            </Button>
          </Link>
        )}
      </div>

      <Card className="surface-panel border-0">
        <CardHeader>
          <CardTitle>Presentation de la vitrine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom de la vitrine">
              <Input
                value={showcaseForm.nom}
                onChange={(event) => setShowcaseForm((current) => ({ ...current, nom: event.target.value }))}
                placeholder="Nom de votre entreprise"
              />
            </Field>
            <Field label="Site web">
              <Input
                value={showcaseForm.website}
                onChange={(event) => setShowcaseForm((current) => ({ ...current, website: event.target.value }))}
                placeholder="https://entreprise.com"
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              rows={4}
              value={showcaseForm.description}
              onChange={(event) => setShowcaseForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Ce que votre entreprise apporte a la communaute PROMOTE-CONNECT."
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Secteur">
              <Input
                value={showcaseForm.secteur}
                onChange={(event) => setShowcaseForm((current) => ({ ...current, secteur: event.target.value }))}
                placeholder="Agroalimentaire"
              />
            </Field>
            <Field label="Pavillon">
              <Input
                value={showcaseForm.pavillon}
                onChange={(event) => setShowcaseForm((current) => ({ ...current, pavillon: event.target.value }))}
                placeholder="A"
              />
            </Field>
            <Field label="Stand">
              <Input
                value={showcaseForm.stand}
                onChange={(event) => setShowcaseForm((current) => ({ ...current, stand: event.target.value }))}
                placeholder="A1-03"
              />
            </Field>
            <Field label="Pays">
              <Input
                value={showcaseForm.pays}
                onChange={(event) => setShowcaseForm((current) => ({ ...current, pays: event.target.value }))}
                placeholder="Cameroun"
              />
            </Field>
          </div>

          <Button onClick={saveShowcase} disabled={savingShowcase} className="rounded-xl">
            {savingShowcase ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer la vitrine'
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="surface-panel border-0">
          <CardHeader>
            <CardTitle>{productForm.id ? 'Modifier un produit' : 'Ajouter un produit'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nom">
              <Input
                value={productForm.nom}
                onChange={(event) => setProductForm((current) => ({ ...current, nom: event.target.value }))}
                placeholder="Catalogue premium"
              />
            </Field>
            <Field label="Categorie">
              <Input
                value={productForm.categorie}
                onChange={(event) => setProductForm((current) => ({ ...current, categorie: event.target.value }))}
                placeholder="Service"
              />
            </Field>
            <Field label="Prix indicatif">
              <Input
                value={productForm.prix_indicatif}
                onChange={(event) => setProductForm((current) => ({ ...current, prix_indicatif: event.target.value }))}
                placeholder="Sur devis"
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={5}
                value={productForm.description}
                onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Decrivez votre offre, sa valeur et son usage."
              />
            </Field>

            <div className="flex flex-wrap gap-3">
              <Button onClick={saveProduct} disabled={savingProduct || !exposant} className="rounded-xl">
                {savingProduct ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <PackagePlus className="mr-2 size-4" />
                    {productForm.id ? 'Mettre a jour' : 'Ajouter'}
                  </>
                )}
              </Button>
              {productForm.id && (
                <Button variant="outline" className="rounded-xl" onClick={() => setProductForm(emptyProductForm)}>
                  Annuler l edition
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel border-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Catalogue publie</CardTitle>
              <Badge variant="secondary" className="rounded-full">
                {products.length} produit{products.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="surface-subtle py-12 text-center">
                <Store className="mx-auto mb-3 size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Votre catalogue est vide. Ajoutez votre premiere offre pour rendre votre vitrine plus visible.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {products.map((product) => (
                  <article key={product.id} className="surface-subtle flex flex-col gap-4 p-5">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-xl text-foreground">{product.nom}</h2>
                        {product.categorie && (
                          <Badge variant="outline" className="rounded-full">
                            {product.categorie}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {product.description || 'Aucune description renseignee.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-foreground">
                        {product.prix_indicatif || 'Prix non renseigne'}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-full" onClick={() => startEditProduct(product)}>
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
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
