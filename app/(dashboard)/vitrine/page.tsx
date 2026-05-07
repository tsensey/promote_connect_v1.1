'use client';

import Link from 'next/link';
import { useExposants } from '@/hooks/useExposants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export default function VitrinePage() {
  const { exposants, loading, error } = useExposants();

  return (
    <main className="min-h-screen bg-muted px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <Card className="p-4 rounded-lg">
          <h1 className="text-2xl font-semibold text-slate-900">Vitrine produits</h1>
          <p className="mt-2 text-muted-foreground">Mettez en valeur vos produits et services auprès de la communauté PROMOTE.</p>
          {loading ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-red-600">
              Erreur: {error instanceof Error ? error.message : String(error)}
            </div>
          ) : exposants.length === 0 ? (
            <div className="mt-4 rounded-lg border border-border bg-white p-4 text-center">
              <ExternalLink className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <p className="text-muted-foreground">Aucun exposant trouvé.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {exposants.map((exposant) => (
                <Card key={exposant.id} className="p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-slate-900">{exposant.nom}</h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{exposant.description}</p>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {exposant.secteur && <p><strong>Secteur:</strong> {exposant.secteur}</p>}
                    {exposant.pavillon && <p><strong>Pavillon:</strong> {exposant.pavillon}</p>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/vitrine/${exposant.id}`}>
                      <Button size="sm">
                        Voir
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline">
                      Contacter
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
