'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { createConversation } from '@/hooks/useChat';
import {
  ArrowLeft,
  Globe,
  MapPin,
  Building2,
  MessageSquare,
  Star,
  Package,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

// ── Icônes de marque SVG inline ──
const IconLinkedin = ({ className }: { className?: string }) => (
  <svg className={className ?? 'size-4'} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const IconFacebook = ({ className }: { className?: string }) => (
  <svg className={className ?? 'size-4'} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IconTwitter = ({ className }: { className?: string }) => (
  <svg className={className ?? 'size-4'} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h7l11 18H14Z" />
    <path d="M20.5 3 13 10.5M3.5 21 11 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);
const IconInstagram = ({ className }: { className?: string }) => (
  <svg className={className ?? 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

type Exposant = Database['public']['Tables']['exposants']['Row'];
type Produit = Database['public']['Tables']['produits']['Row'];

export default function ExposantDetailPage() {
  const params = useParams();
  const exposantId = params.exposantId as string;

  const [exposant, setExposant] = useState<Exposant | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: exp } = await supabaseClient
        .from('exposants')
        .select('*')
        .eq('id', exposantId)
        .single();

      if (exp) {
        setExposant(exp);

        const { data: session } = await supabaseClient.auth.getSession();
        const viewerId = session?.session?.user?.id;
        await supabaseClient.from('exposant_views').insert({
          exposant_id: exposantId,
          viewer_id: viewerId || null,
        });
      }

      const { data: prods } = await supabaseClient
        .from('produits')
        .select('*')
        .eq('exposant_id', exposantId)
        .order('created_at', { ascending: false });

      if (prods) setProduits(prods);
      setLoading(false);
    };

    loadData();
  }, [exposantId]);

  const handleContact = async (productName?: string) => {
    if (!exposant?.profile_id) return;
    setContacting(true);
    const { data } = await createConversation(exposant.profile_id);
    if (data) {
      if (productName) {
        const { data: session } = await supabaseClient.auth.getSession();
        if (session?.session?.user) {
          await supabaseClient.from('messages').insert({
            conversation_id: data.id,
            sender_id: session.session.user.id,
            content: `Bonjour, je suis intéressé(e) par votre produit/service : "${productName}". Pourriez-vous m'en dire plus ?`,
            is_read: false,
          });
        }
      }
      window.location.href = `/chat/${data.id}`;
    } else {
      toast.error('Erreur lors de la création de la conversation');
    }
    setContacting(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = exposant?.nom || 'Profil PROMOTE-CONNECT';
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: exposant?.description || `Découvrez ${exposant?.nom} sur PROMOTE-CONNECT`,
          url,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papier');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="surface-panel h-8 w-48 animate-pulse rounded-xl" />
        <div className="surface-panel h-72 animate-pulse border-0" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="surface-panel h-24 animate-pulse border-0" />
          ))}
        </div>
        <div className="surface-panel h-64 animate-pulse border-0" />
      </div>
    );
  }

  if (!exposant) {
    return (
      <Card className="surface-panel border-0 py-0">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <Building2 className="size-16 text-muted-foreground/30" />
          <div>
            <h1 className="text-2xl font-heading text-foreground">Exposant non trouvé</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cet exposant n&apos;existe pas ou a été retiré.
            </p>
          </div>
          <Link href="/annuaire" className={cn(buttonVariants({ variant: 'outline' }), 'rounded-xl')}>
            <ArrowLeft className="mr-2 size-4" />
            Retour à l&apos;annuaire
          </Link>
        </CardContent>
      </Card>
    );
  }

  const hasSocials = exposant.facebook_url || exposant.linkedin_url || exposant.twitter_url || exposant.instagram_url;
  const hasContact = exposant.email_contact || exposant.phone_contact;
  const hasStats = exposant.annee_creation || exposant.nombre_employes || exposant.chiffre_affaires;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/annuaire"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour à l&apos;annuaire
        </Link>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={handleShare}>
          <Share2 className="mr-2 size-4" />
          Partager
        </Button>
      </div>

      {/* Hero header */}
      <Card className="surface-panel overflow-hidden border-0 py-0">
        {/* Cover image or gradient */}
        <div
          className={cn(
            'relative w-full',
            exposant.cover_url ? 'h-52 sm:h-64' : 'h-36'
          )}
        >
          {exposant.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exposant.cover_url}
              alt={`Image de couverture de ${exposant.nom}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="brand-gradient h-full w-full" />
          )}
          {exposant.is_featured && (
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold text-amber-900 backdrop-blur-sm">
              <Star className="size-3.5" />
              Exposant vedette
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            {/* Logo */}
            <div className="relative -mt-14 shrink-0 sm:-mt-16">
              <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-background bg-primary/10 text-3xl font-bold text-primary shadow-lg">
                {exposant.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={exposant.logo_url} alt={exposant.nom} className="size-full rounded-xl object-contain" />
                ) : (
                  exposant.nom.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Name and description */}
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-heading font-semibold text-foreground">
                {exposant.nom}
              </h1>
              <p className="mt-1 text-base leading-7 text-muted-foreground">
                {exposant.description || 'Bienvenue sur le profil de cet exposant PROMOTE-CONNECT.'}
              </p>
            </div>

            {/* CTA */}
            {exposant.profile_id && (
              <Button
                className="shrink-0 rounded-xl"
                onClick={() => handleContact()}
                disabled={contacting}
              >
                <MessageSquare className="mr-2 size-4" />
                Contacter
              </Button>
            )}
          </div>

          {/* Badges */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {exposant.secteur && (
              <Badge variant="outline" className="gap-1.5 rounded-full border-border/70">
                <Building2 className="size-3" />
                {exposant.secteur}
              </Badge>
            )}
            {exposant.pays && (
              <Badge variant="outline" className="gap-1.5 rounded-full border-border/70">
                <MapPin className="size-3" />
                {exposant.pays}
              </Badge>
            )}
            {exposant.pavillon && (
              <Badge variant="secondary" className="rounded-full">
                Pavillon {exposant.pavillon}
                {exposant.stand && ` — Stand ${exposant.stand}`}
              </Badge>
            )}
            {exposant.website && (
              <a
                href={exposant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Globe className="size-3" />
                Site web
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key figures */}
      {hasStats && (
        <div className="grid gap-4 sm:grid-cols-3">
          {exposant.annee_creation && (
            <div className="surface-panel flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10">
                <svg className="size-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fondée en</p>
                <p className="text-xl font-bold text-foreground">{exposant.annee_creation}</p>
              </div>
            </div>
          )}
          {exposant.nombre_employes && (
            <div className="surface-panel flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10">
                <svg className="size-5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Effectif</p>
                <p className="text-xl font-bold text-foreground">{exposant.nombre_employes}</p>
              </div>
            </div>
          )}
          {exposant.chiffre_affaires && (
            <div className="surface-panel flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <svg className="size-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Chiffre d&apos;affaires</p>
                <p className="text-xl font-bold text-foreground">{exposant.chiffre_affaires}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* About */}
      {exposant.long_description && (
        <Card className="surface-panel border-0">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary/70">
              <Package className="size-4" />
              À propos
            </div>
            <p className="text-base leading-8 text-muted-foreground whitespace-pre-wrap">
              {exposant.long_description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Video */}
      {exposant.video_url && (
        <Card className="surface-panel border-0">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary/70">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Vidéo de présentation
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-xl">
              <iframe
                src={exposant.video_url}
                className="h-full w-full"
                allowFullScreen
                title={`Présentation de ${exposant.nom}`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact & Socials */}
      {(hasContact || hasSocials || exposant.brochure_url) && (
        <Card className="surface-panel border-0">
          <CardContent className="p-6 space-y-5">
            <div className="text-sm font-semibold uppercase tracking-widest text-primary/70">
              Contacts &amp; Liens
            </div>
            <div className="flex flex-wrap gap-3">
              {exposant.email_contact && (
                <a
                  href={`mailto:${exposant.email_contact}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                >
                  <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {exposant.email_contact}
                </a>
              )}
              {exposant.phone_contact && (
                <a
                  href={`tel:${exposant.phone_contact}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                >
                  <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.59 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {exposant.phone_contact}
                </a>
              )}
              {exposant.linkedin_url && (
                <a href={exposant.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0077B5]/10 px-4 py-2 text-sm font-medium text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors">
                  <IconLinkedin /> LinkedIn
                </a>
              )}
              {exposant.facebook_url && (
                <a href={exposant.facebook_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1877F2]/10 px-4 py-2 text-sm font-medium text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors">
                  <IconFacebook /> Facebook
                </a>
              )}
              {exposant.twitter_url && (
                <a href={exposant.twitter_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/20 transition-colors">
                  <IconTwitter /> X / Twitter
                </a>
              )}
              {exposant.instagram_url && (
                <a href={exposant.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#E1306C]/10 px-4 py-2 text-sm font-medium text-[#E1306C] hover:bg-[#E1306C]/20 transition-colors">
                  <IconInstagram /> Instagram
                </a>
              )}
              {exposant.brochure_url && (
                <a href={exposant.brochure_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors">
                  <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Télécharger la brochure
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products */}
      <Card className="surface-panel border-0">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">Catalogue</p>
              <h2 className="text-2xl font-heading text-foreground">
                Produits &amp; Services ({produits.length})
              </h2>
            </div>
          </div>

          {produits.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Package className="size-12 text-muted-foreground/30" />
              <p className="text-base font-medium text-foreground">Aucun produit ou service publié</p>
              <p className="text-sm text-muted-foreground">
                Cet exposant n&apos;a pas encore ajouté de produits à son profil.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {produits.map((prod) => (
                <div
                  key={prod.id}
                  className="group rounded-xl border border-border/60 bg-muted/20 p-5 transition-all hover:border-primary/30 hover:shadow-md hover:bg-muted/40"
                >
                  {prod.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={prod.image_url} alt={prod.nom} className="mb-3 h-40 w-full rounded-lg object-cover" />
                  )}
                  <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {prod.nom}
                  </h3>
                  {prod.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {prod.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    {prod.categorie && (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {prod.categorie}
                      </Badge>
                    )}
                    {prod.prix_indicatif && (
                      <span className="font-bold text-foreground">{prod.prix_indicatif}</span>
                    )}
                  </div>
                  {exposant.profile_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full rounded-xl"
                      onClick={() => handleContact(prod.nom)}
                      disabled={contacting}
                    >
                      <MessageSquare className="mr-2 size-3.5" />
                      Contacter à propos de ce produit
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom CTA */}
      {exposant.profile_id && (
        <Card className="surface-panel border-0">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">
                Intéressé par cet exposant ?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Contactez-le directement via le chat PROMOTE-CONNECT pour discuter de vos besoins.
              </p>
            </div>
            <Button
              className="shrink-0 rounded-xl"
              onClick={() => handleContact()}
              disabled={contacting}
            >
              <MessageSquare className="mr-2 size-4" />
              Démarrer une conversation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
