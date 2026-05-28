'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { useSearch } from '@/hooks/useSearch';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { SearchEntity, SearchResult } from '@/types/search';
import {
  Store,
  Package,
  CalendarDays,
  Rss,
  Building2,
  Search,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const ENTITY_STYLES: Record<SearchEntity, { icon: typeof Store; color: string; bg: string }> = {
  exposant: { icon: Store, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/60' },
  produit: { icon: Package, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/60' },
  evenement: { icon: CalendarDays, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-950/60' },
  post: { icon: Rss, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/60' },
  espace: { icon: Building2, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-950/60' },
};

interface SearchCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommandPalette({ open, onOpenChange }: SearchCommandPaletteProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const { results, loading, total, facets, search, clear } = useSearch({
    limit: 5,
  });

  useEffect(() => {
    if (open) {
      setQuery('');
      clear();
    }
  }, [open, clear]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    search(value);
  }, [search]);

  const handleSelect = useCallback((result: SearchResult) => {
    onOpenChange(false);
    setQuery('');
    clear();
    router.push(result.url);
  }, [onOpenChange, clear, router]);

  const handleShowAll = useCallback((type: SearchEntity) => {
    onOpenChange(false);
    setQuery('');
    clear();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (type) params.set('type', type);
    router.push(`/recherche${params.toString() ? `?${params.toString()}` : ''}`);
  }, [onOpenChange, clear, router, query]);

  const groupedResults = groupByType(results);

  const hasResults = Object.values(groupedResults).some((group) => group.length > 0);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          setQuery('');
          clear();
        }
        onOpenChange(newOpen);
      }}
      title={t('search.title')}
      description={t('search.placeholder')}
      className="w-[calc(100vw-1.5rem)] sm:max-w-[700px]"
    >
      <CommandInput
        placeholder={t('search.placeholder')}
        value={query}
        onValueChange={handleSearch}
      />
      <CommandList className="max-h-[min(80vh,600px)] overflow-y-auto overscroll-contain">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t('common.searching')}
          </div>
        )}

        {!loading && query && !hasResults && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                <Search className="size-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground">{t('search.no_results')}</p>
              <p className="text-xs text-muted-foreground">{t('search.no_results_hint')}</p>
            </div>
          </CommandEmpty>
        )}

        {!query && !loading && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <Sparkles className="size-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('search.start_typing')}</p>
            <p className="text-xs text-muted-foreground max-w-xs">{t('search.start_typing_hint')}</p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground/60">
              <kbd className="rounded-md border border-border/50 bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">↑↓</kbd>
              <span>{t('search.navigate')}</span>
              <kbd className="rounded-md border border-border/50 bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">↵</kbd>
              <span>{t('search.open')}</span>
              <kbd className="rounded-md border border-border/50 bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">ESC</kbd>
              <span>{t('search.close')}</span>
            </div>
          </div>
        )}

        {hasResults && (
          <>
            {(Object.entries(groupedResults) as [SearchEntity, SearchResult[]][]).map(([type, items]) => {
              if (items.length === 0) return null;
              const style = ENTITY_STYLES[type];
              const Icon = style.icon;
              const count = facets?.[type] ?? items.length;

              return (
                <CommandGroup key={type} heading={
                  <span className="flex items-center gap-2 px-1">
                    <Icon className={cn('size-3.5', style.color)} />
                    {t(`search.type_${type}`)}
                    <span className="ml-auto text-[11px] text-muted-foreground/50 font-normal">{count}</span>
                  </span>
                }>
                  {items.map((item) => (
                    <CommandItem
                      key={`${item.entity_type}-${item.entity_id}`}
                      value={`${type}-${item.title}-${item.entity_id}`}
                      onSelect={() => handleSelect(item)}
                      className="group flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer aria-selected:bg-accent/80 my-1"
                    >
                      <div className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150 group-aria-selected:scale-110 ',
                        style.bg,
                      )}>
                        <Icon className={cn('size-3.5', style.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground group-aria-selected:text-primary transition-colors">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="truncate text-[11px] text-muted-foreground/70 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/20 group-aria-selected:text-primary/50 group-aria-selected:translate-x-0.5 transition-all" />
                    </CommandItem>
                  ))}
                  {count > items.length && (
                    <CommandItem
                      value={`show-all-${type}`}
                      onSelect={() => handleShowAll(type)}
                      className="group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground cursor-pointer aria-selected:text-primary aria-selected:bg-accent/50"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 group-aria-selected:bg-primary/10 transition-colors">
                        <ArrowRight className="size-3.5 text-muted-foreground/50 group-aria-selected:text-primary transition-colors" />
                      </div>
                      <span>{t('search.show_all_type', { count, type: t(`search.type_${type}`).toLowerCase() })}</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              );
            })}

            {total > results.length && (
              <div className="sticky bottom-0 border-t border-border/40 bg-popover/95 backdrop-blur-sm">
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (query) params.set('q', query);
                    onOpenChange(false);
                    setQuery('');
                    clear();
                    router.push(`/recherche${params.toString() ? `?${params.toString()}` : ''}`);
                  }}
                  className="group flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/5"
                >
                  <span>{t('search.show_all_results', { count: total })}</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function groupByType(results: SearchResult[]): Partial<Record<SearchEntity, SearchResult[]>> {
  const grouped: Partial<Record<SearchEntity, SearchResult[]>> = {};
  const order: SearchEntity[] = ['exposant', 'produit', 'evenement', 'post', 'espace'];

  for (const type of order) {
    const items = results.filter((r) => r.entity_type === type);
    if (items.length > 0) {
      grouped[type] = items;
    }
  }

  return grouped;
}
