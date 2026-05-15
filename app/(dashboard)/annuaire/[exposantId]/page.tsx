'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { createConversation } from '@/hooks/useChat';
import { toEmbedUrl } from '@/lib/utils';
import {
  ArrowLeft,
  Globe,
  MapPin,
  Building2,
  MessageSquare,
  Package,
  ExternalLink,
  Share2,
  Rss,
  ThumbsUp,
  MessageCircle,
  Mail,
  Phone,
  Video,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
type Post = Database['public']['Tables']['posts']['Row'];

export default function ExposantDetailPage() {
  const params = useParams();
  const exposantId = params.exposantId as string;

  const [exposant, setExposant] = useState<Exposant | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [publications, setPublications] = useState<Post[]>([]);
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

      if (exp?.profile_id) {
        const { data: posts } = await supabaseClient
          .from('posts')
          .select('*')
          .eq('author_id', exp.profile_id)
          .order('created_at', { ascending: false });
        if (posts) setPublications(posts);
      }

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
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="surface-panel h-8 w-48 animate-pulse rounded-xl" />
        <div className="surface-panel h-72 animate-pulse border-0" />
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="surface-panel h-96 animate-pulse border-0" />
          <div className="surface-panel h-96 animate-pulse border-0" />
        </div>
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      {/* Back nav & share */}
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

      {/* HEADER CARD (LinkedIn Style) */}
      <Card className="surface-panel overflow-hidden border-0 p-0">
        <div className="relative h-48 w-full bg-muted sm:h-64">
          {exposant.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={exposant.cover_url} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900" />
          )}
        </div>
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="relative -mt-16 sm:-mt-20">
              <div className="flex size-32 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-white shadow-sm dark:bg-slate-900 sm:size-40">
                {exposant.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={exposant.logo_url} alt={exposant.nom} className="size-full object-contain" />
                ) : (
                  <Building2 className="size-16 text-muted-foreground/30" />
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 sm:mt-6">
              {exposant.profile_id && (
                <Button className="rounded-full px-6 shadow-sm" onClick={() => handleContact()} disabled={contacting}>
                  <MessageSquare className="mr-2 size-4" />
                  Contacter
                </Button>
              )}
              {exposant.website && (
                <a
                  href={exposant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full shadow-sm')}
                >
                  <Globe className="mr-2 size-4" />
                  Visiter le site
                  <ExternalLink className="ml-2 size-3" />
                </a>
              )}
            </div>
          </div>

          <div className="mt-4 sm:mt-2">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{exposant.nom}</h1>
            {exposant.description && (
              <p className="mt-1.5 max-w-3xl text-base text-foreground/90">{exposant.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {exposant.secteur && <span>{exposant.secteur}</span>}
              {exposant.secteur && exposant.pays && <span>•</span>}
              {exposant.pays && <span>{exposant.pays}</span>}
              {(exposant.secteur || exposant.pays) && exposant.nombre_employes && <span>•</span>}
              {exposant.nombre_employes && <span>{exposant.nombre_employes} employés</span>}
            </div>

            {(exposant.pavillon || exposant.stand) && (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                <MapPin className="size-4" />
                Pavillon {exposant.pavillon} {exposant.stand && `— Stand ${exposant.stand}`}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Two Columns Layout */}
      <div className="grid gap-6 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_380px]">
        {/* Left Column (Main) */}
        <div className="space-y-6">
          {/* About Section */}
          {(exposant.long_description || exposant.video_url || exposant.brochure_url) && (
            <Card className="surface-panel border-0">
              <CardContent className="space-y-6 p-6">
                <h2 className="text-xl font-semibold text-foreground">À propos</h2>
                {exposant.long_description && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                    {exposant.long_description}
                  </p>
                )}

                {exposant.brochure_url && (
                  <a
                    href={exposant.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
                  >
                    <Download className="size-4 text-muted-foreground" />
                    Télécharger la brochure commerciale
                  </a>
                )}

                {exposant.video_url && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Video className="size-3.5" />
                      Vidéo de présentation
                    </div>
                    <div className="aspect-video w-full">
                      <iframe
                        src={toEmbedUrl(exposant.video_url)}
                        className="h-full w-full"
                        allowFullScreen
                        title={`Vidéo ${exposant.nom}`}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gallery Section */}
          {exposant.gallery_urls && exposant.gallery_urls.length > 0 && (
            <Card className="surface-panel border-0">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-xl font-semibold text-foreground">Galerie multimédia</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {exposant.gallery_urls.map((url: string, i: number) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted border border-border/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Galerie ${i}`} className="size-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Publications Section */}
          <Card className="surface-panel border-0">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">Publications</h2>
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {publications.length}
                </span>
              </div>

              {publications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 py-12 text-center text-muted-foreground">
                  <Rss className="mx-auto mb-3 size-8 opacity-20" />
                  <p className="text-sm">Aucune publication pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {publications.map((post) => (
                    <div
                      key={post.id}
                      className="group relative overflow-hidden rounded-xl border border-border/50 bg-background/50 p-5 transition-colors hover:bg-muted/20"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                          {exposant.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={exposant.logo_url} className="size-full object-cover" alt="" />
                          ) : (
                            <Building2 className="size-6 text-primary/50" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{exposant.nom}</p>
                          {post.created_at && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {post.content}
                      </p>
                      {post.image_url && (
                        <div className="mt-3 overflow-hidden rounded-lg border border-border/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.image_url} alt="" className="max-h-96 w-full object-cover" />
                        </div>
                      )}
                      <div className="mt-5 flex items-center gap-6 border-t border-border/50 pt-4 text-sm font-medium text-muted-foreground">
                        <button className="flex items-center gap-2 transition-colors hover:text-primary">
                          <ThumbsUp className="size-4" /> {post.likes_count}
                        </button>
                        <button className="flex items-center gap-2 transition-colors hover:text-primary">
                          <MessageCircle className="size-4" /> {post.comments_count}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          {/* Details Sidebar */}
          <Card className="surface-panel border-0">
            <CardContent className="space-y-5 p-6">
              <h2 className="text-lg font-semibold text-foreground">Détails de l&apos;entreprise</h2>
              <dl className="space-y-4 text-sm">
                {exposant.website && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Site web</dt>
                    <dd className="mt-1 font-medium text-primary hover:underline">
                      <a href={exposant.website} target="_blank" rel="noopener noreferrer">
                        {exposant.website.replace(/^https?:\/\//, '')}
                      </a>
                    </dd>
                  </div>
                )}
                {exposant.secteur && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Secteur d&apos;activité</dt>
                    <dd className="mt-1 text-foreground">{exposant.secteur}</dd>
                  </div>
                )}
                {exposant.nombre_employes && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Taille de l&apos;entreprise</dt>
                    <dd className="mt-1 text-foreground">{exposant.nombre_employes} employés</dd>
                  </div>
                )}
                {exposant.annee_creation && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Fondée en</dt>
                    <dd className="mt-1 text-foreground">{exposant.annee_creation}</dd>
                  </div>
                )}
                {exposant.chiffre_affaires && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Chiffre d&apos;affaires</dt>
                    <dd className="mt-1 text-foreground">{exposant.chiffre_affaires}</dd>
                  </div>
                )}
                
                {/* Contacts Section */}
                {(exposant.email_contact || exposant.phone_contact) && (
                  <div className="border-t border-border/50 pt-4">
                    <dt className="mb-2 font-medium text-muted-foreground">Contacts</dt>
                    <dd className="space-y-2 text-foreground">
                      {exposant.email_contact && (
                        <a href={`mailto:${exposant.email_contact}`} className="flex items-center gap-2 transition-colors hover:text-primary">
                          <Mail className="size-4 text-muted-foreground" /> {exposant.email_contact}
                        </a>
                      )}
                      {exposant.phone_contact && (
                        <a href={`tel:${exposant.phone_contact}`} className="flex items-center gap-2 transition-colors hover:text-primary">
                          <Phone className="size-4 text-muted-foreground" /> {exposant.phone_contact}
                        </a>
                      )}
                    </dd>
                  </div>
                )}
              </dl>

              {/* Socials Row */}
              {(exposant.linkedin_url || exposant.facebook_url || exposant.twitter_url || exposant.instagram_url) && (
                <div className="flex gap-2 border-t border-border/50 pt-5">
                  {exposant.linkedin_url && (
                    <a href={exposant.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-full bg-[#0077B5]/10 text-[#0077B5] transition-colors hover:bg-[#0077B5]/20">
                      <IconLinkedin className="size-4" />
                    </a>
                  )}
                  {exposant.facebook_url && (
                    <a href={exposant.facebook_url} target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2] transition-colors hover:bg-[#1877F2]/20">
                      <IconFacebook className="size-4" />
                    </a>
                  )}
                  {exposant.twitter_url && (
                    <a href={exposant.twitter_url} target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-full bg-foreground/5 text-foreground transition-colors hover:bg-foreground/10">
                      <IconTwitter className="size-4" />
                    </a>
                  )}
                  {exposant.instagram_url && (
                    <a href={exposant.instagram_url} target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-full bg-[#E1306C]/10 text-[#E1306C] transition-colors hover:bg-[#E1306C]/20">
                      <IconInstagram className="size-4" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Sidebar */}
          <Card className="surface-panel border-0">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Produits & Services</h2>
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {produits.length}
                </span>
              </div>
              
              {produits.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun produit publié.</p>
              ) : (
                <div className="space-y-4">
                  {produits.map((prod) => (
                    <div key={prod.id} className="group flex items-start gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border/50 hover:bg-muted/30">
                      {prod.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={prod.image_url} alt="" className="size-16 shrink-0 rounded-md bg-muted object-cover" />
                      ) : (
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted/50">
                          <Package className="size-6 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {prod.nom}
                          </h3>
                          {(prod as any).type && (
                            <span className="inline-flex shrink-0 items-center rounded-sm bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground">
                              {(prod as any).type === 'service' ? 'Service' : 'Produit'}
                            </span>
                          )}
                        </div>
                        {prod.categorie && (
                          <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                            {prod.categorie}
                          </span>
                        )}
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {prod.description}
                        </p>
                        {exposant.profile_id && (
                          <button
                            onClick={() => handleContact(prod.nom)}
                            className="mt-1.5 flex items-center gap-1 text-xs font-medium text-primary hover:underline text-left"
                            disabled={contacting}
                          >
                            <MessageSquare className="size-3" />
                            Se renseigner
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
