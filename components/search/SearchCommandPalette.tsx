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

const ENTITY_ICONS: Record<SearchEntity, typeof Store> = {
  exposant: Store,
  produit: Package,
  evenement: CalendarDays,
  post: Rss,
  espace: Building2,
};

const ENTITY_COLORS: Record<SearchEntity, string> = {
  exposant: 'text-blue-500',
  produit: 'text-emerald-500',
  evenement: 'text-violet-500',
  post: 'text-amber-500',
  espace: 'text-cyan-500',
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
      className="sm:max-w-[600px]"
    >
      <CommandInput
        placeholder={t('search.placeholder')}
        value={query}
        onValueChange={handleSearch}
      />
      <CommandList className="max-h-[60vh]">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t('common.searching') || 'Recherche...'}
          </div>
        )}

        {!loading && query && !hasResults && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <Search className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">{t('search.no_results')}</p>
              <p className="text-xs text-muted-foreground">{t('search.no_results_hint')}</p>
            </div>
          </CommandEmpty>
        )}

        {!query && !loading && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <Sparkles className="size-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('search.start_typing')}</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {t('search.start_typing_hint')}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/60">
              <kbd className="rounded-md border border-border/50 bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
                ↑↓
              </kbd>
              <span>{t('search.navigate')}</span>
              <kbd className="rounded-md border border-border/50 bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
                ↵
              </kbd>
              <span>{t('search.open')}</span>
              <kbd className="rounded-md border border-border/50 bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
                ESC
              </kbd>
              <span>{t('search.close')}</span>
            </div>
          </div>
        )}

        {hasResults && (
          <>
            {(Object.entries(groupedResults) as [SearchEntity, SearchResult[]][]).map(([type, items]) => {
              if (items.length === 0) return null;
              const Icon = ENTITY_ICONS[type];
              const count = facets?.[type] ?? items.length;

              return (
                <CommandGroup key={type} heading={
                  <span className="flex items-center gap-2">
                    <Icon className={cn('size-3.5', ENTITY_COLORS[type])} />
                    {t(`search.type_${type}`)}
                    <span className="ml-auto text-[11px] text-muted-foreground/50 font-normal">
                      {count}
                    </span>
                  </span>
                }>
                  {items.map((item) => (
                    <CommandItem
                      key={`${item.entity_type}-${item.entity_id}`}
                      value={`${type}-${item.title}-${item.entity_id}`}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 rounded-lg px-2 py-2"
                    >
                      <div className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted',
                      )}>
                        <Icon className={cn('size-4', ENTITY_COLORS[type])} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="truncate text-xs text-muted-foreground/70">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                  {count > items.length && (
                    <CommandItem
                      value={`show-all-${type}`}
                      onSelect={() => handleShowAll(type)}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-xs text-muted-foreground"
                    >
                      <ArrowRight className="size-3.5" />
                      <span>{t('search.show_all_type', { count, type: t(`search.type_${type}`) })}</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              );
            })}

            {total > results.length && (
              <div className="border-t border-border/50 px-2 py-2">
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (query) params.set('q', query);
                    onOpenChange(false);
                    setQuery('');
                    clear();
                    router.push(`/recherche${params.toString() ? `?${params.toString()}` : ''}`);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  {t('search.show_all_results', { count: total })}
                  <ArrowRight className="size-3.5" />
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
