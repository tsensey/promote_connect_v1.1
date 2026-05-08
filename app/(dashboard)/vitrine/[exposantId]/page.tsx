'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Globe,
  MapPin,
  Building2,
  MessageSquare,
  Tag,
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

export default function VitrineExposantPage() {
  const params = useParams();
  const exposantId = params.exposantId as string;

  const [exposant, setExposant] = useState<Exposant | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: exp } = await supabaseClient
        .from('exposants')
        .select('*')
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="surface-panel h-8 w-48 animate-pulse rounded-xl" />
        <div className="surface-panel h-48 animate-pulse border-0" />
        <div className="surface-panel h-64 animate-pulse border-0" />
      </div>
    );
  }

  if (!exposant) {
    return (
      <Card className="surface-panel border-0 py-0">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <Package className="size-16 text-muted-foreground/30" />
          <div>
            <h1 className="text-2xl font-heading text-foreground">
              Exposant non trouve
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cet exposant n&apos;existe pas ou a ete retire.
            </p>
          </div>
          <Link
            href="/vitrine"
            className={cn(buttonVariants({ variant: 'outline' }), 'rounded-xl')}
          >
            <ArrowLeft className="mr-2 size-4" />
            Retour a la vitrine
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/vitrine"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour a la vitrine
      </Link>

      <Card className="surface-panel overflow-hidden border-0 py-0">
        <div className="brand-gradient px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold text-white shadow-lg backdrop-blur-sm">
              {exposant.nom.charAt(0).toUpperCase()}
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-heading font-semibold">
                {exposant.nom}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {exposant.description || 'Vitrine PROMOTE-CONNECT'}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap gap-3">
            {exposant.secteur && (
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full border-border/70 text-xs"
              >
                <Building2 className="size-3" />
                {exposant.secteur}
              </Badge>
            )}
            {exposant.pays && (
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full border-border/70 text-xs"
              >
                <MapPin className="size-3" />
                {exposant.pays}
              </Badge>
            )}
            {exposant.pavillon && (
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full border-border/70 text-xs"
              >
                Pavillon {exposant.pavillon}
              </Badge>
            )}
            {exposant.website && (
              <a
                href={exposant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Globe className="size-3" />
                Site web
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="surface-panel border-0">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Tag className="size-5 text-primary" />
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

          {produits.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Package className="size-12 text-muted-foreground/30" />
              <p className="text-base font-medium text-foreground">
                Aucun produit ou service publie
              </p>
              <p className="text-sm text-muted-foreground">
                Cet exposant n&apos;a pas encore ajoute de produits a sa
                vitrine.
              </p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      <Card className="surface-panel border-0">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">
              Interesse par cet exposant ?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Contactez-le directement via le chat PROMOTE-CONNECT pour
              discuter de vos besoins.
            </p>
          </div>
          <Link href={`/annuaire/${exposantId}`}>
            <Button className="rounded-xl whitespace-nowrap">
              <MessageSquare className="mr-2 size-4" />
              Voir la fiche complete
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
