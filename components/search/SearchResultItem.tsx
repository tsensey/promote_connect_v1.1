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
  ArrowRight,
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

const TYPE_STYLES: Record<string, { icon: typeof Store; badge: string; iconBg: string }> = {
  exposant: {
    icon: Store,
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
  },
  produit: {
    icon: Package,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  evenement: {
    icon: CalendarDays,
    badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/50',
    iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
  },
  post: {
    icon: Rss,
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
  },
  espace: {
    icon: Building2,
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50',
    iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400',
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
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-muted/80 group cursor-pointer"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/15 group-hover:text-primary transition-all">
          <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">{result.title}</p>
          {result.description && (
            <p className="truncate text-xs text-muted-foreground/70">{result.description}</p>
          )}
        </div>
        <ArrowRight className="size-4 text-muted-foreground/30 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      href={result.url}
      onClick={onSelect}
      className="group block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-2xl"
    >
      <div className="relative flex items-start gap-5 rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:hover:-translate-y-1 hover:bg-accent/30">
        {/* Visit indicator */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs font-medium text-muted-foreground/0 group-hover:text-primary/70 transition-all duration-200 group-hover:translate-x-1">
          <span className="hidden sm:inline">Voir</span>
          <ArrowRight className="size-4" />
        </div>

        {/* Entity icon/avatar */}
        {result.entity_type === 'exposant' ? (
          <Avatar className="size-14 shrink-0 ring-2 ring-background transition-all duration-200 group-hover:scale-110 group-hover:group-hover:ring-primary/20">
            {result.metadata?.logo_url ? (
              <AvatarImage src={result.metadata.logo_url as string} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                {String(result.title).charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        ) : result.entity_type === 'produit' && result.metadata?.image_url ? (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-muted transition-all duration-200 group-hover:scale-110 group-hover:ring-1 ring-border/50">
            <Image
              src={result.metadata.image_url as string}
              alt={result.title}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className={cn(
            'flex size-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 group-hover:scale-110 group-hover:ring-1 ring-border/30',
            style.iconBg,
          )}>
            <Icon className="size-6" />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2 pr-16">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
              {result.title}
            </h3>
            <Badge className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border transition-all duration-200',
              'group-hover:group-hover:scale-110',
              style.badge,
            )}>
              <Icon className="mr-1 size-3" />
              {t(`search.type_${result.entity_type}`)}
            </Badge>
          </div>

          {result.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">
              {result.description}
            </p>
          )}

          {/* Entity-specific metadata */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground/70">
            {result.entity_type === 'exposant' && (
              <>
                {result.metadata?.secteur && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-0.5 text-muted-foreground/80">
                    <Building2 className="size-3.5" />
                    {result.metadata.secteur as string}
                  </span>
                )}
                {result.metadata?.pays && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {result.metadata.pays as string}
                  </span>
                )}
                {result.metadata?.pavillon && (
                  <span className="text-muted-foreground/50">
                    {result.metadata.pavillon as string}
                  </span>
                )}
              </>
            )}
            {result.entity_type === 'produit' && (
              <>
                {result.metadata?.type && (
                  <span className="inline-flex items-center gap-1.5">
                    {result.metadata.type === 'service' ? (
                      <Sparkles className="size-3.5" />
                    ) : (
                      <Package className="size-3.5" />
                    )}
                    {result.metadata.type === 'service' ? t('vitrine.type_service') : t('vitrine.type_produit')}
                  </span>
                )}
                {result.metadata?.prix_indicatif && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-0.5">
                    <Euro className="size-3.5" />
                    {result.metadata.prix_indicatif as string}
                  </span>
                )}
              </>
            )}
            {result.entity_type === 'evenement' && (
              <>
                {result.metadata?.starts_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {new Date(result.metadata.starts_at as string).toLocaleDateString(
                      undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
                    )}
                  </span>
                )}
                {result.metadata?.salle && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-0.5">
                    Salle {result.metadata.salle as string}
                  </span>
                )}
              </>
            )}
            {result.entity_type === 'post' && (
              <>
                {result.metadata?.created_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {new Date(result.metadata.created_at as string).toLocaleDateString(
                      undefined, { day: 'numeric', month: 'short' }
                    )}
                  </span>
                )}
              </>
            )}
            {result.entity_type === 'espace' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-3.5" />
                  {result.metadata?.code as string}
                </span>
                {result.metadata?.type && (
                  <Badge variant="outline" className="rounded-full text-[10px] px-2 py-px font-normal">
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
