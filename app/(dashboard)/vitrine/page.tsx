'use client';

import { useEffect, useState, useDeferredValue, useMemo } from 'react';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase/client';
import { createConversation } from '@/hooks/useChat';
import { useRouter } from 'next/navigation';
import {
  Package,
  Search,
  SlidersHorizontal,
  Building2,
  MessageSquare,
  X,
  ArrowRight,
  Sparkles,
  Euro,
  Store,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Database } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { usePermissions } from '@/hooks/usePermissions';

type Produit = Database['public']['Tables']['produits']['Row'];
type Exposant = Database['public']['Tables']['exposants']['Row'];

type ProduitWithExposant = Produit & {
  exposants: Pick<Exposant, 'id' | 'nom' | 'secteur' | 'pays' | 'pavillon' | 'logo_url'> | null;
};

const TYPE_STYLES = {
  produit: {
    icon: Package,
    label: 'vitrine.type_produit',
    gradient: 'from-blue-600/20 via-blue-500/10 to-transparent',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  },
  service: {
    icon: Sparkles,
    label: 'vitrine.type_service',
    gradient: 'from-violet-600/20 via-violet-500/10 to-transparent',
    badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300',
    iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',
  },
} as const;

export default function VitrinePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const perms = usePermissions();
  const [produits, setProduits] = useState<ProduitWithExposant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'produit' | 'service'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [contacting, setContacting] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const fetchProduits = async () => {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('produits')
        .select('*, exposants(id, nom, secteur, pays, pavillon, logo_url)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProduits(data as ProduitWithExposant[]);
      }
      setLoading(false);
    };

    fetchProduits();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(produits.map((p) => p.categorie).filter(Boolean) as string[])).sort(),
    [produits]
  );

  const counts = useMemo(() => ({
    all: produits.length,
    produit: produits.filter((p) => (p.type ?? 'produit') === 'produit').length,
    service: produits.filter((p) => p.type === 'service').length,
  }), [produits]);

  const filtered = useMemo(() => {
    return produits.filter((p) => {
      const matchSearch =
        !deferredSearch ||
        p.nom.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(deferredSearch.toLowerCase()) ||
        (p.exposants?.nom || '').toLowerCase().includes(deferredSearch.toLowerCase());
      const matchCategorie = !categorie || p.categorie === categorie;
      const matchType = typeFilter === 'all' || (p.type ?? 'produit') === typeFilter;
      return matchSearch && matchCategorie && matchType;
    });
  }, [produits, deferredSearch, categorie, typeFilter]);

  const handleContact = async (exposantId: string, productName: string, exposantProfileId?: string) => {
    if (!exposantProfileId) {
      toast.error(t('vitrine.cannot_contact_direct'));
      return;
    }
    setContacting(exposantId + productName);
    const { data } = await createConversation(exposantProfileId);
    if (data) {
      const { data: session } = await supabaseClient.auth.getSession();
      if (session?.session?.user) {
        const type = (produits.find(p => p.exposant_id === exposantId)?.type ?? 'produit') === 'service' ? 'service' : 'produit';
        await supabaseClient.from('messages').insert({
          conversation_id: data.id,
          sender_id: session.session.user.id,
          content: t('vitrine.contact_interest', { type, product: productName }),
          is_read: false,
        });
      }
      router.push(`/chat/${data.id}`);
    } else {
      toast.error(t('vitrine.contact_error'));
    }
    setContacting(null);
  };

  const clearFilters = () => {
    setSearch('');
    setCategorie('');
    setTypeFilter('all');
  };

  const hasFilters = deferredSearch || categorie || typeFilter !== 'all';

  return (
    <div className="space-y-8 pb-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-background border border-border/50 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm shadow-primary/5">
              <Store className="size-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t('vitrine.title')}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading
                  ? t('vitrine.loading')
                  : t('vitrine.subtitle', { count: produits.length })
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="space-y-4 p-5">
          {/* Search + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('vitrine.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                {t('vitrine.categories')}
                {categorie && (
                  <Badge variant="secondary" className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                    1
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
                  <span className="hidden sm:inline">{t('common.reset')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filtre catégorie */}
          {showFilters && categories.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategorie('')}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                    !categorie
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('vitrine.all')}
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategorie(c)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                      categorie === c
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Type tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'produit', 'service'] as const).map((type) => {
          const style = type !== 'all' ? TYPE_STYLES[type] : null;
          const Icon = style?.icon ?? Filter;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                typeFilter === type
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {style && <Icon className="size-4" />}
              {type === 'all' ? t('common.all') : t(style?.label || '')}
              <Badge
                variant={typeFilter === type ? 'secondary' : 'outline'}
                className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-semibold',
                  typeFilter === type
                    ? 'bg-primary-foreground/15 text-primary-foreground'
                    : ''
                )}
              >
                {counts[type]}
              </Badge>
            </button>
          );
        })}
        <span className="ml-auto text-sm text-muted-foreground hidden sm:block">
          {t('vitrine.results', { count: filtered.length })}
        </span>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/50 shadow-sm">
              <div className="h-44 w-full animate-pulse bg-muted" />
              <CardContent className="space-y-3 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded-lg bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded-lg bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-3 w-full animate-pulse rounded-lg bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded-lg bg-muted" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-9 flex-1 animate-pulse rounded-xl bg-muted" />
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/60 py-0">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
              {typeFilter === 'service' ? (
                <Sparkles className="size-8 text-muted-foreground/40" />
              ) : (
                <Package className="size-8 text-muted-foreground/40" />
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                  {hasFilters
                    ? t('common.no_results')
                    : t('vitrine.no_offers')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                  {hasFilters
                    ? t('vitrine.no_results_hint_search')
                    : t('vitrine.no_results_hint_general')}
              </p>
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-xl">
                <X className="mr-1.5 size-3.5" />
                {t('common.reset_filters')}
              </Button>
            )}
            {!hasFilters && (
              <Link href="/annuaire">
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                  <Building2 className="size-3.5" />
                  {t('vitrine.browse_exposants')}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((produit) => {
            const type = (produit.type ?? 'produit') as 'produit' | 'service';
            const typeStyle = TYPE_STYLES[type];

            return (
              <Card
                key={`${produit.exposant_id}-${produit.id}`}
                className="group relative overflow-hidden border-border/50 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col py-0"
              >
                {/* Image / Type header */}
                {produit.image_url ? (
                  <div className="relative h-44 overflow-hidden bg-muted">
                    <img
                      src={produit.image_url}
                      alt={produit.nom}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-start justify-between gap-2">
                      {produit.prix_indicatif && (
                        <Badge className="rounded-full border-white/30 bg-black/50 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm shadow-sm">
                          <Euro className="mr-0.5 size-3" />
                          {produit.prix_indicatif}
                        </Badge>
                      )}
                      <Badge className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold shadow-sm ml-auto', typeStyle.badge)}>
                        {t(typeStyle.label)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    'relative flex h-28 items-center justify-center bg-gradient-to-br',
                    typeStyle.gradient,
                    'bg-muted'
                  )}>
                    <div className={cn(
                      'flex size-14 items-center justify-center rounded-2xl shadow-sm',
                      typeStyle.iconBg
                    )}>
                      <typeStyle.icon className="size-7" />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-start justify-between gap-2">
                      {produit.prix_indicatif && (
                        <Badge className="rounded-full border-white/30 bg-black/50 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm shadow-sm">
                          <Euro className="mr-0.5 size-3" />
                          {produit.prix_indicatif}
                        </Badge>
                      )}
                      <Badge className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold shadow-sm ml-auto', typeStyle.badge)}>
                        {t(typeStyle.label)}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  {/* Nom + Catégorie */}
                  <div>
                    <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {produit.nom}
                    </h2>
                    {produit.categorie && (
                      <Badge variant="outline" className="mt-1.5 rounded-full border-border/60 text-[10px] font-normal">
                        <Tag className="mr-1 size-3" />
                        {produit.categorie}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground/80">
                    {produit.description || t('vitrine.no_description')}
                  </p>

                  {/* Exposant */}
                  {produit.exposants && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 p-2.5">
                      <Avatar className="size-8 shrink-0 ring-1 ring-border/30">
                        {produit.exposants.logo_url ? (
                          <AvatarImage src={produit.exposants.logo_url} />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">
                            {produit.exposants.nom.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {produit.exposants.nom}
                        </p>
                        {(produit.exposants.secteur || produit.exposants.pays) && (
                          <p className="truncate text-[11px] text-muted-foreground/70">
                            {[produit.exposants.secteur, produit.exposants.pays].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {perms.canContactExposant ? (
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl text-xs h-9"
                        disabled={contacting === (produit.exposant_id + produit.nom) || !produit.exposants}
                        onClick={async () => {
                          if (!produit.exposants) return;
                          const { data } = await supabaseClient
                            .from('exposants')
                            .select('profile_id')
                            .eq('id', produit.exposants.id)
                            .single();
                          if (data?.profile_id) {
                            await handleContact(produit.exposants.id, produit.nom, data.profile_id);
                          } else {
                            toast.error(t('vitrine.cannot_contact'));
                          }
                        }}
                      >
                        <MessageSquare className="mr-1.5 size-3.5" />
                        {contacting === (produit.exposant_id + produit.nom) ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          t('vitrine.contact_exposant')
                        )}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled className="flex-1 rounded-xl text-xs h-9">
                        <MessageSquare className="mr-1.5 size-3.5" />
                        {t('vitrine.contact_exposant')}
                      </Button>
                    )}
                    {produit.exposants && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-9 w-9 p-0"
                        onClick={() => router.push(`/annuaire/${produit.exposants!.id}`)}
                        title={t('vitrine.view_exposant_sheet')}
                      >
                        <Building2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t('vitrine.you_are_exposant')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('vitrine.you_are_exposant_desc')}
            </p>
          </div>
          <Link href="/exposant/ma-vitrine">
            <Button className="shrink-0 rounded-xl gap-1.5">
              {t('vitrine.manage_vitrine')}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Tag({ className, ...props }: { className?: string } & React.ComponentProps<'svg'>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}
