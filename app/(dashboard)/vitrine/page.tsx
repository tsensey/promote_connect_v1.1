"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useExposants } from "@/hooks/useExposants";
import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Building2, MapPin, Package } from "lucide-react";

export default function VitrinePage() {
  const { exposants, loading, error } = useExposants();
  const [productCounts, setProductCounts] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    if (exposants.length === 0) return;

    const fetchCounts = async () => {
      const { data } = await supabaseClient
        .from("produits")
        .select("exposant_id, id")
        .in(
          "exposant_id",
          exposants.map((e) => e.id),
        );

      if (data) {
        const counts: Record<string, number> = {};
        for (const p of data) {
          if (!p.exposant_id) continue;
          counts[p.exposant_id] = (counts[p.exposant_id] || 0) + 1;
        }
        setProductCounts(counts);
      }
    };

    fetchCounts();
  }, [exposants]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-heading text-foreground">
          Vitrine produits
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Mettez en valeur vos produits et services aupres de la communaute
          PROMOTE.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="surface-panel border-0">
              <CardContent className="space-y-4 p-5">
                <div className="h-5 w-1/2 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded-lg bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="surface-panel border-0">
          <CardContent className="p-6 text-center text-destructive">
            Erreur : {error instanceof Error ? error.message : String(error)}
          </CardContent>
        </Card>
      ) : exposants.length === 0 ? (
        <Card className="surface-panel border-0">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Store className="size-16 text-muted-foreground/30" />
            <div>
              <p className="text-lg font-semibold text-foreground">
                Aucun exposant trouve
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Revenez plus tard ou explorez l&apos;annuaire.
              </p>
            </div>
            <Link href="/annuaire">
              <Button variant="outline" className="rounded-xl">
                Explorer l&apos;annuaire
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {exposants.map((exposant) => {
            const produitCount = productCounts[exposant.id] || 0;
            return (
              <Card
                key={exposant.id}
                className="surface-panel group border-0 transition-all hover:shadow-lg"
              >
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-base font-semibold text-primary">
                        {exposant.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground group-hover:text-primary">
                          {exposant.nom}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {exposant.secteur || "Secteur non renseigne"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {exposant.description || "Pas de description"}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {exposant.secteur && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/60 text-xs"
                      >
                        <Building2 className="mr-1 size-3" />
                        {exposant.secteur}
                      </Badge>
                    )}
                    {exposant.pavillon && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/60 text-xs"
                      >
                        Pavillon {exposant.pavillon}
                      </Badge>
                    )}
                    {exposant.pays && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/60 text-xs"
                      >
                        <MapPin className="mr-1 size-3" />
                        {exposant.pays}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Package className="size-3.5" />
                      {produitCount} produit{produitCount !== 1 ? "s" : ""}
                    </div>
                    <Link href={`/vitrine/${exposant.id}`}>
                      <Button size="sm" className="rounded-xl">
                        Voir la vitrine
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
