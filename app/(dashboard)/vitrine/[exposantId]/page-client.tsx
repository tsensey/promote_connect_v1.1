'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { createConversation } from '@/hooks/useChat';
import { toast } from 'sonner';
import { toEmbedUrl } from '@/lib/utils';
import {
  ArrowLeft,
  Globe,
  MapPin,
  Building2,
  MessageSquare,
  Tag,
  Package,
  ExternalLink,
  Phone,
  Mail,
  Users,
  Calendar,
  TrendingUp,
  Share2,
  Star,
  FileText,
  Play,
} from 'lucide-react';

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
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { usePermissions } from '@/hooks/usePermissions';
import { ReportButton } from '@/components/shared/ReportButton';
import type { Database } from '@/types/database.types';

type Exposant = Database['public']['Tables']['exposants']['Row'];
type Produit = Database['public']['Tables']['produits']['Row'];

export default function VitrineExposantPage() {
  const params = useParams();
  const exposantId = params.exposantId as string;

  const [exposant, setExposant] = useState<Exposant | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const perms = usePermissions();
  const [contacting, setContacting] = useState(false);
  const router = useRouter();

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

  const handleContact = async (product?: { id: string; nom: string; image_url: string | null; prix_indicatif: string | null } | null) => {
    if (!exposant?.profile_id) return;
    setContacting(true);
    const { data } = await createConversation(exposant.profile_id);
    if (data) {
      let url = `/chat?conv=${data.id}`;
      if (product && exposant) {
        const payload = {
          id: product.id,
          nom: product.nom,
          image_url: product.image_url,
          prix_indicatif: product.prix_indicatif,
          exposant_nom: exposant.nom,
          exposant_id: exposant.id,
        };
        url += `&product=${btoa(JSON.stringify(payload))}`;
      }
      router.push(url);
    } else {
      toast.error(t('vitrine.detail.contact_error'));
    }
    setContacting(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = exposant?.nom || 'Vitrine PROMOTE-CONNECT';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('vitrine.detail.link_copied'));
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
          <Package className="size-16 text-muted-foreground/30" />
          <div>
            <h1 className="text-2xl font-heading text-foreground">{t('vitrine.detail.not_found')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('vitrine.detail.not_found_desc')}
            </p>
          </div>
          <Link href="/vitrine" className={cn(buttonVariants({ variant: 'outline' }), 'rounded-xl')}>
            <ArrowLeft className="mr-2 size-4" />
            {t('vitrine.detail.back')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  const hasSocials = exposant.facebook_url || exposant.linkedin_url || exposant.twitter_url || exposant.instagram_url;
  const hasContact = exposant.email_contact || exposant.phone_contact;
  const hasStats = exposant.annee_creation || exposant.nombre_employes || exposant.chiffre_affaires;

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/vitrine"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t('vitrine.detail.back')}
        </Link>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={handleShare}>
          <Share2 className="mr-2 size-4" />
          {t('vitrine.detail.share')}
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
            <Image
              src={exposant.cover_url}
              alt={t('vitrine.detail.cover_alt', { name: exposant.nom })}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="brand-gradient h-full w-full" />
          )}
          {exposant.is_featured && (
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold text-amber-900 backdrop-blur-sm">
              <Star className="size-3.5" />
              {t('vitrine.detail.featured')}
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            {/* Logo */}
            <div className="relative -mt-14 shrink-0 sm:-mt-16">
              <div className="relative flex size-24 items-center justify-center rounded-2xl border-4 border-background bg-primary/10 text-3xl font-bold text-primary shadow-lg">
                {exposant.logo_url ? (
                  <Image src={exposant.logo_url} alt={exposant.nom} fill sizes="96px" className="rounded-xl object-contain" />
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
                {exposant.description || t('vitrine.detail.welcome')}
              </p>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2">
              {exposant.profile_id && perms.canContactExposant && (
                <Button
                  className="shrink-0 rounded-xl"
                  onClick={() => handleContact()}
                  disabled={contacting}
                >
                  <MessageSquare className="mr-2 size-4" />
                  {t('vitrine.detail.contact')}
                </Button>
              )}
              {exposant.profile_id && (
                <ReportButton
                  reportedId={exposant.profile_id}
                  reportedName={exposant.nom}
                  variant="outline"
                  className="rounded-xl px-3 shrink-0 h-10 border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  showText
                />
              )}
            </div>
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
                {t('vitrine.detail.pavillon_stand', { pavillon: exposant.pavillon, stand: exposant.stand || '' })}
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
                {t('vitrine.detail.website')}
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
                <Calendar className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('vitrine.detail.founded')}</p>
                <p className="text-xl font-bold text-foreground">{exposant.annee_creation}</p>
              </div>
            </div>
          )}
          {exposant.nombre_employes && (
            <div className="surface-panel flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10">
                <Users className="size-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('vitrine.detail.employees')}</p>
                <p className="text-xl font-bold text-foreground">{exposant.nombre_employes}</p>
              </div>
            </div>
          )}
          {exposant.chiffre_affaires && (
            <div className="surface-panel flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('vitrine.detail.revenue')}</p>
                <p className="text-xl font-bold text-foreground">{exposant.chiffre_affaires}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* About / Long description */}
      {exposant.long_description && (
        <Card className="surface-panel border-0">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary/70">
              <Tag className="size-4" />
              {t('vitrine.detail.about')}
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
              <Play className="size-4" />
              {t('vitrine.detail.video')}
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-xl">
              <iframe
                src={toEmbedUrl(exposant.video_url)}
                className="h-full w-full"
                allowFullScreen
                title={t('vitrine.detail.video_title', { name: exposant.nom })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact & Socials */}
      {perms.canSeeContactDetails && (hasContact || hasSocials || exposant.brochure_url) && (
        <Card className="surface-panel border-0">
          <CardContent className="p-6 space-y-5">
            <div className="text-sm font-semibold uppercase tracking-widest text-primary/70">{t('vitrine.detail.contacts')}</div>
            <div className="flex flex-wrap gap-3">
              {exposant.email_contact && (
                <a
                  href={`mailto:${exposant.email_contact}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Mail className="size-4 text-muted-foreground" />
                  {exposant.email_contact}
                </a>
              )}
              {exposant.phone_contact && (
                <a
                  href={`tel:${exposant.phone_contact}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Phone className="size-4 text-muted-foreground" />
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
                  <FileText className="size-4 text-muted-foreground" /> {t('vitrine.detail.brochure')}
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products */}
      <Card className="surface-panel border-0">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Package className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">{t('vitrine.detail.catalogue')}</p>
                <h2 className="text-2xl font-heading text-foreground">
                  {t('vitrine.detail.products', { count: produits.length })}
                </h2>
              </div>
            </div>
          </div>

          {produits.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Package className="size-12 text-muted-foreground/30" />
              <p className="text-base font-medium text-foreground">{t('vitrine.detail.no_products')}</p>
              <p className="text-sm text-muted-foreground">
                {t('vitrine.detail.no_products_hint')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {produits.map((prod) => (
                <Dialog key={prod.id}>
                  <DialogTrigger>
                    <div className="cursor-pointer rounded-xl border border-border/60 bg-muted/20 p-5 transition-all hover:border-primary/30 hover:shadow-md hover:bg-muted/40 group">
                      {prod.image_url && (
                        <div className="relative mb-3 h-40 w-full">
                          <Image src={prod.image_url} alt={prod.nom} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="rounded-lg object-cover" />
                        </div>
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
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-xl">{prod.nom}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      {prod.image_url && (
                        <div className="relative h-52 w-full">
                          <Image src={prod.image_url} alt={prod.nom} fill sizes="(max-width: 640px) 100vw, 512px" className="rounded-xl object-cover" />
                        </div>
                      )}
                      {prod.categorie && <Badge>{prod.categorie}</Badge>}
                      <p className="text-sm leading-7 text-muted-foreground">
                        {prod.description || t('vitrine.detail.no_description')}
                      </p>
                      {prod.prix_indicatif && (
                        <div className="rounded-xl bg-primary/5 px-4 py-3">
                          <p className="text-xs text-muted-foreground">{t('vitrine.detail.price')}</p>
                          <p className="text-2xl font-bold text-foreground">{prod.prix_indicatif}</p>
                        </div>
                      )}
                      {perms.canContactExposant && (
                        <Button
                          className="w-full rounded-xl"
                          onClick={() => handleContact({ id: prod.id, nom: prod.nom, image_url: prod.image_url, prix_indicatif: prod.prix_indicatif })}
                          disabled={contacting}
                        >
                          <MessageSquare className="mr-2 size-4" />
                          {t('vitrine.detail.contact_about')}
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom CTA */}
      {exposant.profile_id && perms.canContactExposant && (
        <Card className="surface-panel border-0">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">
                {t('vitrine.detail.interested')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('vitrine.detail.interested_desc')}
              </p>
            </div>
            <Button
              className="shrink-0 rounded-xl"
              onClick={() => handleContact()}
              disabled={contacting}
            >
              <MessageSquare className="mr-2 size-4" />
              {t('vitrine.detail.start_conversation')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
