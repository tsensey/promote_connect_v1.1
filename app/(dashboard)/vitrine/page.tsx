'use client';

import { useEffect, useState, useDeferredValue } from 'react';
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
  Tag,
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
import type { Database } from '@/types/database.types';

type Produit = Database['public']['Tables']['produits']['Row'];
type Exposant = Database['public']['Tables']['exposants']['Row'];

type ProduitWithExposant = Produit & {
  exposants: Pick<Exposant, 'id' | 'nom' | 'secteur' | 'pays' | 'pavillon'> | null;
};

export default function VitrinePage() {
  const router = useRouter();
  const [produits, setProduits] = useState<ProduitWithExposant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [contacting, setContacting] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search);

  // Collect all unique categories from products
  const categories = Array.from(
    new Set(produits.map((p) => p.categorie).filter(Boolean) as string[])
  ).sort();

  useEffect(() => {
    const fetchProduits = async () => {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('produits')
        .select('*, exposants(id, nom, secteur, pays, pavillon)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProduits(data as ProduitWithExposant[]);
      }
      setLoading(false);
    };

    fetchProduits();
  }, []);

  const filtered = produits.filter((p) => {
    const matchSearch =
      !deferredSearch ||
      p.nom.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(deferredSearch.toLowerCase()) ||
      (p.exposants?.nom || '').toLowerCase().includes(deferredSearch.toLowerCase());
    const matchCategorie = !categorie || p.categorie === categorie;
    return matchSearch && matchCategorie;
  });

  const handleContact = async (exposantId: string, productName: string, exposantProfileId?: string) => {
    if (!exposantProfileId) {
      toast.error('Cet exposant ne peut pas être contacté directement.');
      return;
    }
    setContacting(exposantId + productName);
    const { data } = await createConversation(exposantProfileId);
    if (data) {
      const { data: session } = await supabaseClient.auth.getSession();
      if (session?.session?.user) {
        await supabaseClient.from('messages').insert({
          conversation_id: data.id,
          sender_id: session.session.user.id,
          content: `Bonjour, je suis intéressé(e) par votre produit/service : "${productName}". Pourriez-vous m'en dire plus ?`,
          is_read: false,
        });
      }
      router.push(`/chat/${data.id}`);
    } else {
      toast.error('Erreur lors de la création de la conversation');
    }
    setContacting(null);
  };

  const clearFilters = () => {
    setSearch('');
    setCategorie('');
  };

  const hasFilters = deferredSearch || categorie;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-heading text-foreground">Catalogue produits</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Explorez tous les produits et services proposés par les exposants PROMOTE.
          Trouvez une offre et contactez directement l&apos;exposant.
        </p>
      </div>

      {/* Search & Filters */}
      <Card className="border-0 py-0">
        <CardContent className="space-y-4 p-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un produit, service ou exposant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              Filtrer par catégorie
              {categorie && (
                <Badge variant="secondary" className="ml-0.5 h-5 rounded-full px-1.5 text-[10px]">
                  1
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
                Réinitialiser
              </Button>
            )}

            <span className="ml-auto text-sm text-muted-foreground">
              {loading
                ? 'Chargement...'
                : `${filtered.length} produit${filtered.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {showFilters && categories.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-muted/50 p-4">
              <Select
                value={categorie}
                onValueChange={(v) => setCategorie(v ?? '')}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les catégories</SelectItem>
                  {categories.map((c) => (
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

      {/* Products Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="surface-panel border-0">
              <CardContent className="space-y-4 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded-lg bg-muted" />
                <div className="h-8 w-full animate-pulse rounded-xl bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="surface-panel border-0">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Package className="size-16 text-muted-foreground/30" />
            <div>
              <p className="text-lg font-semibold text-foreground">Aucun produit trouvé</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasFilters
                  ? 'Essayez de modifier vos critères de recherche.'
                  : 'Aucun produit n\'a encore été publié par les exposants.'}
              </p>
            </div>
            {hasFilters && (
              <Button variant="outline" className="rounded-xl" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((produit) => {
            const key = `${produit.exposant_id}-${produit.id}`;
            return (
              <Card
                key={key}
                className="group border-0 flex flex-col transition-all hover:shadow-lg py-0"
              >
                <CardContent className="flex flex-1 flex-col space-y-4 p-5">
                  {produit.image_url && (
                    <div className="relative h-40 w-full overflow-hidden rounded-lg bg-muted border border-border/50 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={produit.image_url} alt={produit.nom} className="size-full object-cover" />
                    </div>
                  )}
                  {/* Product name & category */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                        {produit.nom}
                      </h2>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {(produit as any).type && (
                          <span className="inline-flex items-center rounded-sm bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground">
                            {(produit as any).type === 'service' ? 'Service' : 'Produit'}
                          </span>
                        )}
                        {produit.categorie && (
                          <Badge variant="outline" className="rounded-full text-[10px]">
                            {produit.categorie}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {produit.prix_indicatif && (
                      <p className="text-sm font-bold text-primary">{produit.prix_indicatif}</p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
                    {produit.description || 'Aucune description disponible.'}
                  </p>

                  {/* Exposant info */}
                  {produit.exposants && (
                    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {produit.exposants.nom.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {produit.exposants.nom}
                        </p>
                        {(produit.exposants.secteur || produit.exposants.pays) && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {[produit.exposants.secteur, produit.exposants.pays].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 rounded-xl"
                      disabled={contacting === (produit.exposant_id + produit.nom) || !produit.exposants}
                      onClick={async () => {
                        if (!produit.exposants) return;
                        // Fetch profile_id for this exposant
                        const { data } = await supabaseClient
                          .from('exposants')
                          .select('profile_id')
                          .eq('id', produit.exposants.id)
                          .single();
                        if (data?.profile_id) {
                          await handleContact(produit.exposants.id, produit.nom, data.profile_id);
                        } else {
                          toast.error('Exposant non contactable.');
                        }
                      }}
                    >
                      <MessageSquare className="mr-1.5 size-3.5" />
                      Contacter
                    </Button>
                    {produit.exposants && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => router.push(`/annuaire/${produit.exposants!.id}`)}
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

      {/* CTA — Invite exposants to add products */}
      <Card className="surface-panel border-0">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">
              Vous êtes exposant ?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Publiez vos produits et services pour être visible par toute la communauté PROMOTE-CONNECT.
            </p>
          </div>
          <Link href="/exposant/ma-vitrine">
            <Button className="shrink-0 rounded-xl">
              Gérer ma vitrine
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
