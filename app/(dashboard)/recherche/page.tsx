'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search,
  Store,
  Package,
  CalendarDays,
  Rss,
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchResultItem } from '@/components/search/SearchResultItem';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { SearchEntity, SearchResult, SearchResponse } from '@/types/search';
import { SEARCH_ENTITY_ORDER } from '@/types/search';

const ENTITY_CONFIG: Record<SearchEntity, { icon: typeof Store; color: string; gradient: string }> = {
  exposant: { icon: Store, color: 'text-blue-500', gradient: 'from-blue-500/10 to-transparent' },
  produit: { icon: Package, color: 'text-emerald-500', gradient: 'from-emerald-500/10 to-transparent' },
  evenement: { icon: CalendarDays, color: 'text-violet-500', gradient: 'from-violet-500/10 to-transparent' },
  post: { icon: Rss, color: 'text-amber-500', gradient: 'from-amber-500/10 to-transparent' },
  espace: { icon: Building2, color: 'text-cyan-500', gradient: 'from-cyan-500/10 to-transparent' },
};

export default function RecherchePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as SearchEntity) || null;

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<Record<string, number> | null>(null);
  const [activeType, setActiveType] = useState<SearchEntity | null>(initialType);
  const [page, setPage] = useState(0);
  const facetsRef = useRef<Record<string, number> | null>(null);

  const pageSize = 12;

  const executeSearch = useCallback(async (searchQuery: string, searchType: SearchEntity | null, searchPage: number) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      setFacets(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: String(searchPage),
        limit: String(pageSize),
      });
      if (searchType) {
        params.set('types', searchType);
      }

      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erreur de recherche');
      }

      const data: SearchResponse = await res.json();
      setResults(data.results);
      setTotal(data.total);
      setFacets(data.facets.types as Record<string, number>);
      facetsRef.current = data.facets.types as Record<string, number>;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de recherche');
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (activeType) params.set('type', activeType);
    if (page > 0) params.set('page', page.toString());

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [query, activeType, page, pathname, router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      executeSearch(query, activeType, page);
    }, query ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [query, activeType, page, executeSearch]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(0);
  };

  const handleTypeChange = (type: SearchEntity | null) => {
    setActiveType(type);
    setPage(0);
  };

  const clearAll = () => {
    setQuery('');
    setActiveType(null);
    setPage(0);
    setResults([]);
    setTotal(0);
    setFacets(null);
    facetsRef.current = null;
  };

  const totalPages = Math.ceil(total / pageSize);

  const safeFacets = facets ?? facetsRef.current;
  const totalFiltered = activeType && safeFacets ? (safeFacets[activeType] ?? 0) : total;

  return (
    <div className="pb-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-background border border-border/50 p-6 sm:p-8 mb-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm shadow-primary/5">
              <Search className="size-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t('search.title')}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground min-h-[1.25rem] transition-opacity duration-200">
                {query
                  ? loading
                    ? t('common.searching')
                    : t('search.results_count', { count: total })
                  : t('search.desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <Card className="border-border/50 shadow-sm mb-6 py-0">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('search.placeholder')}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-11 rounded-xl border-border/70 bg-muted/30 pl-11 pr-10 shadow-none focus:bg-background"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="gap-1.5 rounded-xl h-11 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                  <span className="hidden sm:inline">{t('common.reset')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Type tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleTypeChange(null)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                !activeType
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {t('common.all')}
              <span className={cn(
                'inline-flex items-center justify-center rounded-full px-1.5 py-px text-[9px] font-semibold min-w-[1.25rem] transition-opacity duration-200',
                !activeType
                  ? 'bg-primary-foreground/15 text-primary-foreground'
                  : 'bg-muted-foreground/10 text-muted-foreground',
              )}>
                {query ? total : '0'}
              </span>
            </button>

            {(SEARCH_ENTITY_ORDER as SearchEntity[]).map((type) => {
              const config = ENTITY_CONFIG[type];
              const Icon = config.icon;
              const count = safeFacets?.[type] ?? 0;

              return (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                    activeType === type
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className={cn(
                    'size-3.5',
                    activeType === type ? '' : config.color,
                  )} />
                  {t(`search.type_${type}`)}
                  <span className={cn(
                    'inline-flex items-center justify-center rounded-full px-1.5 py-px text-[9px] font-semibold min-w-[1.25rem] transition-opacity duration-200',
                    activeType === type
                      ? 'bg-primary-foreground/15 text-primary-foreground'
                      : 'bg-muted-foreground/10 text-muted-foreground',
                  )}>
                    {query ? count : '0'}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="min-h-[300px]">
        {loading && results.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/50 shadow-sm py-0">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="size-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3 rounded-lg" />
                      <Skeleton className="h-3 w-full rounded-lg" />
                      <div className="flex gap-3">
                        <Skeleton className="h-3 w-20 rounded" />
                        <Skeleton className="h-3 w-16 rounded" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive/20 bg-destructive/5 py-0">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => executeSearch(query, activeType, page)} className="rounded-xl">
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : query && results.length === 0 && !loading ? (
          <Card className="border-dashed border-border/60 py-0">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                <Search className="size-8 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">{t('search.no_results')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('search.no_results_hint')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearAll} className="rounded-xl gap-1.5">
                <X className="size-3.5" />
                {t('common.reset_filters')}
              </Button>
            </CardContent>
          </Card>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {total > 0 && (
              <p className="text-xs text-muted-foreground/70 min-h-[1rem]">
                {totalFiltered} résultat{totalFiltered !== 1 ? 's' : ''}
                {activeType && ` dans ${t(`search.type_${activeType}`).toLowerCase()}`}
                {query && ` pour "${query}"`}
              </p>
            )}

            <div className={cn('space-y-6', loading && 'opacity-50 pointer-events-none transition-opacity duration-200')}>
              {results.map((result) => (
                <SearchResultItem key={`${result.entity_type}-${result.entity_id}`} result={result} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="rounded-xl h-9 w-9 p-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i;
                    } else if (page <= 3) {
                      pageNum = i;
                    } else if (page >= totalPages - 4) {
                      pageNum = totalPages - 7 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'rounded-xl h-9 min-w-9 p-0 text-xs font-medium',
                          page === pageNum && 'shadow-sm',
                        )}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-xl h-9 w-9 p-0"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        ) : !query ? (
          <Card className="border-dashed border-border/60 py-0">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                <Sparkles className="size-8 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">{t('search.start_typing')}</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  {t('search.start_typing_hint')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
