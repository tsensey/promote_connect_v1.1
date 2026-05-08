'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { createConversation } from '@/hooks/useChat';
import {
  ArrowLeft,
  Globe,
  MapPin,
  Building2,
  MessageSquare,
  Star,
  Package,
  ExternalLink,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type Exposant = Database['public']['Tables']['exposants']['Row'];
type Produit = Database['public']['Tables']['produits']['Row'];

export default function ExposantDetailPage() {
  const params = useParams();
  const exposantId = params.exposantId as string;

  const [exposant, setExposant] = useState<Exposant | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: exp } = await supabaseClient
        .from('exposants')
        .select('*, profiles(full_name, company, role)')
        .eq('id', exposantId)
        .single();

      if (exp) setExposant(exp);

      const { data: prods } = await supabaseClient
        .from('produits')
        .select('*')
        .eq('exposant_id', exposantId);

      if (prods) setProduits(prods);
      setLoading(false);
    };

    loadData();
  }, [exposantId]);

  const handleContact = async () => {
    if (!exposant?.profile_id) return;
    setContacting(true);
    const { data, error } = await createConversation(exposant.profile_id);
    if (data) {
      window.location.href = `/chat/${data.id}`;
    }
    setContacting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="surface-panel h-8 w-48 animate-pulse rounded-xl" />
        <div className="surface-panel h-64 animate-pulse border-0" />
        <div className="surface-panel h-48 animate-pulse border-0" />
      </div>
    );
  }

  if (!exposant) {
    return (
      <Card className="surface-panel border-0 py-0">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <Building2 className="size-16 text-muted-foreground/30" />
          <div>
            <h1 className="text-2xl font-heading text-foreground">
              Exposant non trouve
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cet exposant n&apos;existe pas ou a ete retire.
            </p>
          </div>
          <Link
            href="/annuaire"
            className={cn(buttonVariants({ variant: 'outline' }), 'rounded-xl')}
          >
            <ArrowLeft className="mr-2 size-4" />
            Retour a l&apos;annuaire
          </Link>
        </CardContent>
      </Card>
    );
  }

  const profile = (exposant as any).profiles;

  return (
    <div className="space-y-6">
      <Link
        href="/annuaire"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour a l&apos;annuaire
      </Link>

      <Card className="surface-panel overflow-hidden border-0 py-0">
        <div className="brand-gradient px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold text-white shadow-lg backdrop-blur-sm">
                {exposant.nom.charAt(0).toUpperCase()}
              </div>
              <div className="text-white">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-heading font-semibold">
                    {exposant.nom}
                  </h1>
                  {exposant.is_featured && (
                    <Badge className="rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30">
                      <Star className="mr-1 size-3" />
                      En vedette
                    </Badge>
                  )}
                </div>
                {profile?.full_name && (
                  <p className="mt-1 text-sm text-white/80">
                    Contact : {profile.full_name}
                    {profile?.company && ` — ${profile.company}`}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={handleContact}
              disabled={contacting || !exposant.profile_id}
              className="rounded-xl bg-white text-primary shadow-lg hover:bg-white/90"
            >
              <MessageSquare className="mr-2 size-4" />
              {contacting ? '...' : 'Contacter'}
            </Button>
          </div>
        </div>

        <CardContent className="space-y-6 p-6">
          <p className="text-base leading-7 text-muted-foreground">
            {exposant.description || 'Aucune description disponible.'}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {exposant.secteur && (
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <Building2 className="mb-2 size-5 text-primary" />
                <p className="text-xs text-muted-foreground">Secteur</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {exposant.secteur}
                </p>
              </div>
            )}
            {exposant.pays && (
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <MapPin className="mb-2 size-5 text-primary" />
                <p className="text-xs text-muted-foreground">Pays</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {exposant.pays}
                </p>
              </div>
            )}
            {(exposant.pavillon || exposant.stand) && (
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <MapPin className="mb-2 size-5 text-primary" />
                <p className="text-xs text-muted-foreground">Localisation</p>
                <p className="mt-0.5 font-medium text-foreground">
                  Pavillon {exposant.pavillon}
                  {exposant.stand && ` — Stand ${exposant.stand}`}
                </p>
              </div>
            )}
            {exposant.website && (
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <Globe className="mb-2 size-5 text-primary" />
                <p className="text-xs text-muted-foreground">Site web</p>
                <a
                  href={exposant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {exposant.website.replace(/^https?:\/\//, '').slice(0, 25)}
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {produits.length > 0 && (
        <Card className="surface-panel border-0">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Package className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Catalogue
                </p>
                <h2 className="text-2xl font-heading text-foreground">
                  Produits et services ({produits.length})
                </h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {produits.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-xl border border-border/60 bg-white/80 p-5 transition-all hover:border-primary/20 hover:shadow-md"
                >
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {prod.nom}
                  </h3>
                  {prod.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {prod.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    {prod.categorie && (
                      <Badge
                        variant="secondary"
                        className="rounded-full text-xs"
                      >
                        {prod.categorie}
                      </Badge>
                    )}
                    {prod.prix_indicatif && (
                      <span className="font-bold text-foreground">
                        {prod.prix_indicatif}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {produits.length === 0 && (
        <Card className="surface-panel border-0">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Package className="size-12 text-muted-foreground/30" />
            <p className="text-base font-medium text-foreground">
              Aucun produit ou service publie
            </p>
            <p className="text-sm text-muted-foreground">
              Cet exposant n&apos;a pas encore ajoute de produits a sa vitrine.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
