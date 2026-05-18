'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Store,
  Package,
  Sparkles,
  CalendarDays,
  Rss,
  Building2,
  MapPin,
  Euro,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import type { SearchResult } from '@/types/search';

interface SearchResultItemProps {
  result: SearchResult;
  onSelect?: () => void;
  variant?: 'default' | 'compact';
}

const TYPE_STYLES: Record<string, { icon: typeof Store; gradient: string; badge: string }> = {
  exposant: {
    icon: Store,
    gradient: 'from-blue-600/20 via-blue-500/10 to-transparent',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  },
  produit: {
    icon: Package,
    gradient: 'from-emerald-600/20 via-emerald-500/10 to-transparent',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  evenement: {
    icon: CalendarDays,
    gradient: 'from-violet-600/20 via-violet-500/10 to-transparent',
    badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300',
  },
  post: {
    icon: Rss,
    gradient: 'from-amber-600/20 via-amber-500/10 to-transparent',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
  espace: {
    icon: Building2,
    gradient: 'from-cyan-600/20 via-cyan-500/10 to-transparent',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300',
  },
};

export function SearchResultItem({ result, onSelect, variant = 'default' }: SearchResultItemProps) {
  const { t } = useTranslation();
  const style = TYPE_STYLES[result.entity_type] || TYPE_STYLES.exposant;
  const Icon = style.icon;

  if (variant === 'compact') {
    return (
      <Link
        href={result.url}
        onClick={onSelect}
        className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60 group"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
          <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{result.title}</p>
          {result.description && (
            <p className="truncate text-xs text-muted-foreground/70">{result.description}</p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={result.url}
      onClick={onSelect}
      className="group block"
    >
      <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5">
        {/* Entity icon */}
        {result.entity_type === 'exposant' ? (
          <Avatar className="size-12 shrink-0 ring-2 ring-background shadow-md">
            {result.metadata?.logo_url ? (
              <AvatarImage src={result.metadata.logo_url as string} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
                {String(result.title).charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        ) : result.entity_type === 'produit' && result.metadata?.image_url ? (
          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
            <Image
              src={result.metadata.image_url as string}
              alt={result.title}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Icon className="size-6 text-muted-foreground/60" />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {result.title}
            </h3>
            <Badge className={cn('shrink-0 rounded-full px-2 py-px text-[10px] font-semibold', style.badge)}>
              <Icon className="mr-1 size-3" />
              {t(`search.type_${result.entity_type}`)}
            </Badge>
          </div>

          {result.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
              {result.description}
            </p>
          )}

          {/* Entity-specific metadata */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70">
            {result.entity_type === 'exposant' && (
              <>
                {result.metadata?.secteur && (
                  <span>{result.metadata.secteur as string}</span>
                )}
                {result.metadata?.pays && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {result.metadata.pays as string}
                  </span>
                )}
              </>
            )}
            {result.entity_type === 'produit' && (
              <>
                {result.metadata?.type && (
                  <span className="flex items-center gap-1">
                    {result.metadata.type === 'service' ? (
                      <Sparkles className="size-3" />
                    ) : (
                      <Package className="size-3" />
                    )}
                    {result.metadata.type === 'service' ? t('vitrine.type_service') : t('vitrine.type_produit')}
                  </span>
                )}
                {result.metadata?.prix_indicatif && (
                  <span className="flex items-center gap-1">
                    <Euro className="size-3" />
                    {result.metadata.prix_indicatif as string}
                  </span>
                )}
              </>
            )}
            {result.entity_type === 'evenement' && (
              <>
                {result.metadata?.starts_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(result.metadata.starts_at as string).toLocaleDateString(
                      undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
                    )}
                  </span>
                )}
                {result.metadata?.salle && (
                  <span>Salle {result.metadata.salle as string}</span>
                )}
              </>
            )}
            {result.entity_type === 'post' && (
              <>
                {result.metadata?.created_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(result.metadata.created_at as string).toLocaleDateString(
                      undefined, { day: 'numeric', month: 'short' }
                    )}
                  </span>
                )}
              </>
            )}
            {result.entity_type === 'espace' && (
              <>
                <span className="flex items-center gap-1">
                  <Building2 className="size-3" />
                  {result.metadata?.code as string}
                </span>
                {result.metadata?.type && (
                  <Badge variant="outline" className="rounded-full text-[9px] px-1.5 py-px font-normal">
                    {result.metadata.type === 'pavillon' ? t('annuaire.pavillon') : t('annuaire.space')}
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
