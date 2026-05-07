'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useExposants } from '@/hooks/useExposants';
import { supabaseClient } from '@/lib/supabase/client';
import { Search, Filter, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AnnuairePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [secteur, setSecteur] = useState('');
  const [pavillon, setPavillon] = useState('');
  const [pays, setPays] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const pageSize = 20;

  const { exposants, loading, error, filterOptions, totalCount } = useExposants({
    search,
    secteur,
    pavillon,
    pays,
    page,
    pageSize,
  });

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;

  const activeFiltersCount = [secteur, pavillon, pays].filter(Boolean).length;
  const hasFilters = search || secteur || pavillon || pays;

  const clearFilters = () => {
    setSearch('');
    setSecteur('');
    setPavillon('');
    setPays('');
    setPage(0);
  };

  const handleContact = async (exposantId: string) => {
    setContactingId(exposantId);
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const myId = session?.session?.user?.id;
      if (!myId) {
        toast.error('Vous devez etre connecte');
        return;
      }

      const { data: exposant } = await supabaseClient
        .from('exposants')
        .select('profile_id')
        .eq('id', exposantId)
        .single();

      if (!exposant?.profile_id) {
        toast.error('Cet exposant ne peut pas etre contacte');
        return;
      }

      const [a, b] = [myId, exposant.profile_id].sort();
      const { data: conv, error: convError } = await supabaseClient
        .from('conversations')
        .upsert({ participant_a: a, participant_b: b }, { onConflict: 'participant_a,participant_b' })
        .select()
        .single();

      if (convError) throw convError;
      router.push(`/chat/${conv.id}`);
    } catch {
      toast.error('Erreur lors de la creation de la conversation');
    } finally {
      setContactingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Annuaire des exposants</CardTitle>
          <CardDescription>Recherchez et filtrez les exposants PROMOTE par secteur, pavillon, pays et type d activite.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un exposant..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1.5"
              >
                <Filter className="h-3.5 w-3.5" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  Reinitialiser
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid gap-3 sm:grid-cols-3 rounded-lg border border-border bg-muted/50 p-3">
                <Select value={secteur} onValueChange={(v) => { setSecteur(v ?? ''); setPage(0); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les secteurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les secteurs</SelectItem>
                    {filterOptions.secteurs.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={pavillon} onValueChange={(v) => { setPavillon(v ?? ''); setPage(0); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les pavillons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les pavillons</SelectItem>
                    {filterOptions.pavillons.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={pays} onValueChange={(v) => { setPays(v ?? ''); setPage(0); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les pays</SelectItem>
                    {filterOptions.pays.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <section>
        <p className="mb-3 text-sm text-muted-foreground">
          {loading
            ? 'Recherche...'
            : totalCount
              ? `${totalCount} resultat${totalCount !== 1 ? 's' : ''} (page ${page + 1}/${totalPages})`
              : `${exposants.length} resultat${exposants.length !== 1 ? 's' : ''}`}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="h-5 w-1/2 animate-pulse rounded-md bg-muted" />
                  <div className="mt-2 h-4 w-full animate-pulse rounded-md bg-muted" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded-md bg-muted" />
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <div className="col-span-full rounded-lg bg-destructive/10 p-4 text-sm text-destructive">Erreur : {error.message}</div>
          ) : exposants.length > 0 ? (
            exposants.map((exposant) => (
              <Card key={exposant.id} className="transition hover:shadow-md">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-semibold">{exposant.nom}</h2>
                      {exposant.is_featured && (
                        <Badge variant="default" className="mt-1">
                          En vedette
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{exposant.description || 'Pas de description'}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {exposant.secteur && <Badge variant="outline">{exposant.secteur}</Badge>}
                    {exposant.pavillon && <Badge variant="outline">Pavillon {exposant.pavillon}</Badge>}
                    {exposant.pays && <Badge variant="outline">{exposant.pays}</Badge>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" className="gap-1.5" onClick={() => router.push(`/annuaire/${exposant.id}`)}>
                      Voir fiche
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContact(exposant.id)}
                      disabled={contactingId === exposant.id}
                      className="gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {contactingId === exposant.id ? '...' : 'Contacter'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full rounded-lg bg-muted/50 p-8 text-center">
              <p className="text-base font-medium">Aucun resultat</p>
              <p className="mt-1 text-sm text-muted-foreground">Essayez de modifier vos filtres de recherche.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Precedent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="gap-1"
            >
              Suivant
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
