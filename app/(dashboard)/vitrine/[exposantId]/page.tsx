'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { ArrowLeft, Globe, MapPin, Building2, MessageSquare, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <div className="space-y-4">
        <Card className="p-4 rounded-lg">
          <div className="h-8 w-1/3 animate-pulse rounded-md bg-muted" />
        </Card>
      </div>
    );
  }

  if (!exposant) {
    return (
      <Card className="p-6 rounded-lg text-center">
        <h1 className="text-xl font-semibold text-slate-900">Exposant non trouve</h1>
        <Link href="/vitrine" className="mt-3 inline-block text-blue-600 underline">
          Retour a la vitrine
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/vitrine" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Retour a la vitrine
      </Link>

      <Card className="p-4 rounded-lg">
        <h1 className="text-2xl font-semibold text-slate-900">{exposant.nom}</h1>
        <p className="mt-2 text-muted-foreground">{exposant.description}</p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {exposant.secteur && (
            <Badge variant="secondary" className="gap-1.5">
              <Building2 className="h-3 w-3" />
              {exposant.secteur}
            </Badge>
          )}
          {exposant.pays && (
            <Badge variant="secondary" className="gap-1.5">
              <MapPin className="h-3 w-3" />
              {exposant.pays}
            </Badge>
          )}
          {exposant.website && (
            <a
              href={exposant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 underline underline-offset-2"
            >
              <Globe className="h-3 w-3" />
              Site web
            </a>
          )}
        </div>
      </Card>

      <Card className="p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Produits et services ({produits.length})
        </h2>

        {produits.length === 0 ? (
          <p className="mt-3 text-muted-foreground">Aucun produit ou service publie.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {produits.map((prod) => (
              <Card key={prod.id} className="p-4 rounded-lg">
                <h3 className="font-semibold text-slate-900">{prod.nom}</h3>
                {prod.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{prod.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  {prod.categorie && (
                    <Badge variant="secondary" className="text-xs">
                      {prod.categorie}
                    </Badge>
                  )}
                  {prod.prix_indicatif && (
                    <span className="font-bold text-slate-900">{prod.prix_indicatif}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-slate-900">Interesse par cet exposant ?</h2>
        <p className="mt-2 text-muted-foreground">
          Contactez-le directement via le chat PROMOTE-CONNECT pour discuter de vos besoins.
        </p>
        <Link href={`/annuaire/${exposantId}`}>
          <Button className="mt-3">
            <MessageSquare className="mr-2 h-4 w-4" />
            Voir la fiche complete
          </Button>
        </Link>
      </Card>
    </div>
  );
}
