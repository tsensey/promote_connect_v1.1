'use client';

import { useState, useDeferredValue, useEffect, useMemo } from 'react';
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
  Eye,
  Star,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { Ban } from 'lucide-react';

const COVER_GRADIENTS = [
  'from-blue-600/20 via-blue-500/10 to-transparent',
  'from-emerald-600/20 via-emerald-500/10 to-transparent',
  'from-violet-600/20 via-violet-500/10 to-transparent',
  'from-amber-600/20 via-amber-500/10 to-transparent',
  'from-rose-600/20 via-rose-500/10 to-transparent',
  'from-cyan-600/20 via-cyan-500/10 to-transparent',
];

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
}

export default function AnnuairePage() {
  const { t } = useTranslation();
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
  const { loadBlockedUsers, isBlocked } = useBlockedUsers();
  const pageSize = 20;

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

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

  const activeFilters = useMemo(() => {
    const f: { label: string; onRemove: () => void }[] = [];
    if (secteur) f.push({ label: secteur, onRemove: () => { setSecteur(''); setPage(0); } });
    if (pavillon) f.push({ label: `${t('annuaire.space')} ${pavillon}`, onRemove: () => { setPavillon(''); setPage(0); } });
    if (pays) f.push({ label: pays, onRemove: () => { setPays(''); setPage(0); } });
    return f;
  }, [secteur, pavillon, pays]);

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
        toast.error(t('annuaire.must_be_logged'));
        return;
      }

      const { data: exposant } = await supabaseClient
        .from('exposants')
        .select('profile_id')
        .eq('id', exposantId)
        .single();

      if (!exposant?.profile_id) {
        toast.error(t('annuaire.cannot_contact'));
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
      toast.error(t('annuaire.conversation_error'));
    } finally {
      setContactingId(null);
    }
  };

  const paginationRange = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const current = page;
    if (current <= 2) return [0, 1, 2, '...', totalPages - 1];
    if (current >= totalPages - 3) return [0, '...', totalPages - 3, totalPages - 2, totalPages - 1];
    return [0, '...', current - 1, current, current + 1, '...', totalPages - 1];
  }, [page, totalPages]);

  return (
    <div className="space-y-5 pb-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-background border border-border/50 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm shadow-primary/5">
              <Store className="size-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t('annuaire.title')}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {totalCount
                  ? t('annuaire.subtitle', { count: totalCount })
                  : t('annuaire.desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="space-y-4 p-5">
          {/* Barre de recherche + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('annuaire.search')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="h-11 rounded-xl border-border/70 bg-muted/30 pl-11 shadow-none focus:bg-background"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'gap-2 rounded-xl h-11 px-4 transition-all',
                  showFilters && 'border-primary/40 bg-primary/5 text-primary'
                )}
              >
                <SlidersHorizontal className="size-4" />
                {t('annuaire.filters')}
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 rounded-full px-1.5 text-[10px]"
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
                  className="gap-1.5 rounded-xl h-11 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                  <span className="hidden sm:inline">{t('annuaire.reset')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-3">
              <Select
                value={secteur}
                onValueChange={(v) => {
                  setSecteur(v ?? '');
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('annuaire.all_sectors')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('annuaire.all_sectors')}</SelectItem>
                  {filterOptions.secteurs.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
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
                  <SelectValue placeholder={t('annuaire.all_spaces')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('annuaire.all_spaces')}</SelectItem>
                  {filterOptions.espaces.map((espace) => (
                    <SelectItem key={espace.id} value={espace.code}>
                      {espace.type === 'pavillon' ? t('annuaire.pavillon_prefix') : t('annuaire.space')} {espace.code} — {espace.nom}
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
                  <SelectValue placeholder={t('annuaire.all_countries')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('annuaire.all_countries')}</SelectItem>
                  {filterOptions.pays.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags actifs */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{t('annuaire.active_filters')}</span>
              {activeFilters.map((f, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="gap-1.5 rounded-full px-3 py-1 text-xs font-normal"
                >
                  {f.label}
                  <button onClick={f.onRemove} className="ml-0.5 hover:text-foreground">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                {t('annuaire.clear_all')}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grille d'exposants */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/50 shadow-sm">
              <div className="h-28 w-full animate-pulse bg-muted" />
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  <div className="size-12 animate-pulse rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded-lg bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded-lg bg-muted" />
                  </div>
                </div>
                <div className="h-3 w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded-lg bg-muted" />
                <div className="flex gap-2 pt-1">
                  <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-7 w-20 animate-pulse rounded-full bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <div className="col-span-full rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
            {t('annuaire.load_error', { error: error.message })}
          </div>
        ) : exposants.length > 0 ? (
          exposants.map((exposant) => {
            const gradient = getGradient(exposant.id);
            const isOwn = exposant.profile_id === user?.id;

            return (
              <Card
                key={exposant.id}
                className={cn(
                  'group relative overflow-hidden border-border/50 shadow-sm transition-all duration-200 py-0',
                  'hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5',
                  exposant.is_featured && 'border-amber-200/60 dark:border-amber-800/40',
                )}
              >
                {/* Cover */}
                <div className={cn(
                  'relative h-28 bg-gradient-to-br',
                  gradient,
                  exposant.cover_url ? '' : 'bg-muted',
                )}>
                  {exposant.cover_url && (
                    <img
                      src={exposant.cover_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-60"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

                  {/* Badges */}
                  <div className="absolute right-3 top-3 flex flex-col gap-1.5">
                    {exposant.is_featured && (
                      <Badge className="rounded-full border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                        <Star className="mr-0.5 size-3 fill-amber-500 text-amber-500" />
                        {t('annuaire.featured')}
                      </Badge>
                    )}
                    {isOwn && (
                      <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm">
                        {t('annuaire.your_stand')}
                      </Badge>
                    )}
                  </div>

                  {/* Stand */}
                  {exposant.stand && (
                    <div className="absolute bottom-3 left-4">
                      <Badge
                        variant="outline"
                        className="rounded-full border-white/30 bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                      >
                        <MapPin className="mr-1 size-3" />
                        {t('annuaire.stand_label', { stand: exposant.stand })}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="space-y-3.5 p-5">
                  {/* Logo + Nom */}
                  <div className="flex items-start gap-3 -mt-8">
                    <Avatar className="size-12  ring-2 ring-background shadow-md shrink-0">
                      {exposant.logo_url ? (
                        <AvatarImage src={exposant.logo_url} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
                          {exposant.nom.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1 pt-1">
                      <h2 className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {exposant.nom}
                      </h2>
                      {exposant.pays && (
                        <p className="truncate text-xs text-muted-foreground/70">
                          <MapPin className="mr-0.5 inline size-3" />
                          {exposant.pays}
                          {exposant.pavillon && ` — ${t('annuaire.pavillon_prefix')} ${exposant.pavillon}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/80">
                    {exposant.description || t('annuaire.no_description')}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {exposant.secteur && (
                      <Badge variant="outline" className="rounded-full border-border/60 text-[11px] font-normal">
                        <Building2 className="mr-1 size-3" />
                        {exposant.secteur}
                      </Badge>
                    )}
                    {exposant.pavillon && (
                      <Badge variant="outline" className="rounded-full border-border/60 text-[11px] font-normal">
                        {t('annuaire.pavillon_prefix')} {exposant.pavillon}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1.5">
                    <Button
                      size="sm"
                      className="flex-1 rounded-xl text-xs h-9"
                      onClick={() => router.push(`/annuaire/${exposant.id}`)}
                    >
                      <Eye className="mr-1.5 size-3.5" />
                      {t('common.view_profile')}
                    </Button>
                    {!isOwn && exposant.profile_id && isBlocked(exposant.profile_id) ? (
                      <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                        <Ban className="size-3.5" />
                        {t('annuaire.detail.blocked')}
                      </div>
                    ) : !isOwn && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContact(exposant.id)}
                        disabled={contactingId === exposant.id}
                        className="flex-1 rounded-xl text-xs h-9"
                      >
                        <MessageSquare className="mr-1.5 size-3.5" />
                        {contactingId === exposant.id ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          t('annuaire.contact_btn')
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>

                {/* Featured glow */}
                {exposant.is_featured && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                )}
              </Card>
            );
          })
        ) : (
          <div className="col-span-full">
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                <Building2 className="size-8 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {t('common.no_results')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('common.no_results_hint')}
                </p>
              </div>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-xl">
                  <X className="mr-1.5 size-3.5" />
                  {t('common.reset_filters')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(0)}
            disabled={page === 0}
            className="rounded-xl h-9 w-9 p-0"
          >
            <ChevronLeft className="size-3.5" />
            <ChevronLeft className="size-3.5 -ml-2" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-xl h-9 w-9 p-0"
          >
            <ChevronLeft className="size-3.5" />
          </Button>

          <div className="flex items-center gap-1">
            {paginationRange.map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="flex h-9 w-6 items-center justify-center text-xs text-muted-foreground/50">
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'rounded-xl h-9 min-w-9 p-0 text-xs font-medium',
                    page === p ? 'shadow-sm' : ''
                  )}
                  onClick={() => setPage(p as number)}
                >
                  {(p as number) + 1}
                </Button>
              )
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-xl h-9 w-9 p-0"
          >
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="rounded-xl h-9 w-9 p-0"
          >
            <ChevronRight className="size-3.5" />
            <ChevronRight className="size-3.5 -ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
