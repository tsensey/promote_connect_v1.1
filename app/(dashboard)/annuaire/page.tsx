'use client';

import { useState, useDeferredValue, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useExposants } from '@/hooks/useExposants';
import { useAuth } from '@/lib/auth/context';
import { supabaseClient } from '@/lib/supabase/client';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  SlidersHorizontal,
  Building2,
  MapPin,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AnnuairePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [secteur, setSecteur] = useState(searchParams.get('secteur') || '');
  const [pavillon, setPavillon] = useState(searchParams.get('pavillon') || '');
  const [pays, setPays] = useState(searchParams.get('pays') || '');
  const [showFilters, setShowFilters] = useState(
    !!(searchParams.get('secteur') || searchParams.get('pavillon') || searchParams.get('pays'))
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 0);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const pageSize = 20;

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredSearch) params.set('q', deferredSearch);
    if (secteur) params.set('secteur', secteur);
    if (pavillon) params.set('pavillon', pavillon);
    if (pays) params.set('pays', pays);
    if (page > 0) params.set('page', page.toString());
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [deferredSearch, secteur, pavillon, pays, page, pathname, router]);

  const { exposants, loading, error, filterOptions, totalCount } = useExposants({
    search: deferredSearch,
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
        .upsert(
          { participant_a: a, participant_b: b },
          { onConflict: 'participant_a,participant_b' },
        )
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-heading text-foreground">
          Annuaire des exposants
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Recherchez et filtrez les exposants PROMOTE par secteur, pavillon,
          pays et type d&apos;activite.
        </p>
      </div>

      <Card className="surface-panel border-0">
        <CardContent className="space-y-4 p-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un exposant par nom, secteur ou pays..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="h-11 rounded-xl border-border/70 bg-white/90 pl-11 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5 rounded-full"
            >
              <SlidersHorizontal className="size-3.5" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-5 rounded-full px-1.5 text-[10px]"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1 rounded-full text-xs text-muted-foreground"
              >
                <X className="size-3" />
                Reinitialiser
              </Button>
            )}

            <span className="ml-auto text-sm text-muted-foreground">
              {loading
                ? 'Recherche...'
                : `${totalCount} resultat${totalCount !== 1 ? 's' : ''}`}
            </span>
          </div>

          {showFilters && (
            <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/50 p-4 sm:grid-cols-3">
              <Select
                value={secteur}
                onValueChange={(v) => {
                  setSecteur(v ?? '');
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les secteurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les secteurs</SelectItem>
                  {filterOptions.secteurs.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={pavillon}
                onValueChange={(v) => {
                  setPavillon(v ?? '');
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les pavillons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les pavillons</SelectItem>
                  {filterOptions.pavillons.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={pays}
                onValueChange={(v) => {
                  setPays(v ?? '');
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les pays</SelectItem>
                  {filterOptions.pays.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="surface-panel border-0 overflow-hidden">
              <CardContent className="space-y-4 p-5">
                <div className="h-5 w-1/2 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded-lg bg-muted" />
                <div className="flex gap-2">
                  <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-7 w-20 animate-pulse rounded-full bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <div className="col-span-full rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Erreur : {error.message}
          </div>
        ) : exposants.length > 0 ? (
          exposants.map((exposant) => (
            <Card
              key={exposant.id}
              className="surface-panel group border-0 overflow-hidden transition-all hover:shadow-lg"
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-semibold text-primary">
                      {exposant.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground group-hover:text-primary">
                        {exposant.nom}
                      </h2>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exposant.is_featured && (
                          <Badge
                            variant="outline"
                            className="rounded-full bg-amber-50 px-2 py-0 text-[10px] text-amber-700 border-amber-200"
                          >
                            En vedette
                          </Badge>
                        )}
                        {exposant.profile_id === user?.id && (
                          <Badge
                            variant="outline"
                            className="rounded-full bg-emerald-50 px-2 py-0 text-[10px] text-emerald-700 border-emerald-200"
                          >
                            Votre stand
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {exposant.description || 'Pas de description'}
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

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={() => router.push(`/annuaire/${exposant.id}`)}
                  >
                    Voir fiche
                  </Button>
                  {exposant.profile_id !== user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContact(exposant.id)}
                      disabled={contactingId === exposant.id}
                      className="gap-1.5 rounded-xl"
                    >
                      <MessageSquare className="size-3.5" />
                      {contactingId === exposant.id ? '...' : 'Contacter'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <div className="surface-panel flex flex-col items-center gap-3 border-0 py-12 text-center">
              <Building2 className="size-12 text-muted-foreground/40" />
              <p className="text-base font-medium text-foreground">
                Aucun resultat
              </p>
              <p className="text-sm text-muted-foreground">
                Essayez de modifier vos filtres de recherche.
              </p>
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="gap-1 rounded-xl"
          >
            <ChevronLeft className="size-3.5" />
            Precedent
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={page === i ? 'default' : 'outline'}
                size="xs"
                className="min-w-[2rem] rounded-xl"
                onClick={() => setPage(i)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="gap-1 rounded-xl"
          >
            Suivant
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
