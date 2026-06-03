'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  Mail,
  Phone,
  Video,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Award,
  Tag,
  Euro,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, getValidImageUrl } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import type { Database } from '@/types/database.types';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfilePosts } from '@/hooks/useProfilePosts';
import { PostCard } from '@/components/feed/PostCard';
import Image from 'next/image';
import { Ban, ShieldAlert } from 'lucide-react';

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
  const { t, locale } = useTranslation();
  const params = useParams();
  const exposantId = params.exposantId as string;
  const perms = usePermissions();

  const [exposant, setExposant] = useState<Exposant | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const router = useRouter();

  const { blockUser, unblockUser, isBlocked, loadBlockedUsers } = useBlockedUsers();

  const exposantProfileId = exposant?.profile_id;
  const { posts: publications, toggleLike, sharePost, repostPost, toggleSave, toggleReaction, toggleFollow, getComments, addComment, updatePost, deletePost, createPost, myUserId } = useProfilePosts(exposantProfileId);
  const isCurrentlyBlocked = exposantProfileId ? isBlocked(exposantProfileId) : false;

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const { data: exp } = await supabaseClient
          .from('exposants')
          .select('*')
          .eq('id', exposantId)
          .single();

        if (exp) {
          if (!cancelled) setExposant(exp);
          const { data: session } = await supabaseClient.auth.getSession();
          const viewerId = session?.session?.user?.id;
          try {
            await supabaseClient.from('exposant_views').insert({
              exposant_id: exposantId,
              viewer_id: viewerId || null,
            });
          } catch {
            // Non bloquant
          }
        }

        const { data: prods } = await supabaseClient
          .from('produits')
          .select('*')
          .eq('exposant_id', exposantId)
          .order('created_at', { ascending: false });

        if (prods && !cancelled) setProduits(prods);
      } catch (err) {
        console.error('Erreur chargement exposant:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [exposantId]);

  const handleContact = async (productName?: string) => {
    if (!exposant?.profile_id) return;
    setContacting(true);
    const { data } = await createConversation(exposant.profile_id);
    if (data) {
      const quotaRes = await fetch('/api/chat/check-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: data.id }),
      });
      const quotaData = await quotaRes.json();
      if (!quotaRes.ok || !quotaData.allowed) {
        if (quotaData.showConversionModal) {
          window.dispatchEvent(new CustomEvent('show-conversion-modal'));
        } else {
          toast.error('Quota de messagerie atteint ou accès refusé.');
        }
        setContacting(false);
        return;
      }

      if (productName) {
        const { data: session } = await supabaseClient.auth.getSession();
        if (session?.session?.user) {
          await supabaseClient.from('messages').insert({
            conversation_id: data.id,
            sender_id: session.session.user.id,
            content: t('annuaire.detail.contact_interest', { product: productName }),
            is_read: false,
          });
        }
      }
      router.push(`/chat/${data.id}`);
    } else {
      toast.error(t('annuaire.detail.contact_error'));
    }
    setContacting(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = exposant?.nom || t('annuaire.detail.profile_title');
    if (navigator.share) {
      try {
        await navigator.share({ title, text: exposant?.description || '', url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('annuaire.detail.link_copied'));
    }
  };

  const handleBlockExposant = async () => {
    if (!exposantProfileId) return;
    setBlocking(true);
    await blockUser(exposantProfileId, 'harassment');
    toast.success(t('annuaire.detail.block_success'));
    setBlocking(false);
  };

  const handleUnblockExposant = async () => {
    if (!exposantProfileId) return;
    setBlocking(true);
    await unblockUser(exposantProfileId);
    toast.success(t('annuaire.detail.unblock_success'));
    setBlocking(false);
  };

  const COVER_GRADIENTS = [
    'from-blue-600/30 via-blue-500/10 to-transparent',
    'from-emerald-600/30 via-emerald-500/10 to-transparent',
    'from-violet-600/30 via-violet-500/10 to-transparent',
    'from-amber-600/30 via-amber-500/10 to-transparent',
    'from-rose-600/30 via-rose-500/10 to-transparent',
    'from-cyan-600/30 via-cyan-500/10 to-transparent',
  ];

  function getGradient(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
    return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 pb-8">
        <div className="h-5 w-36 animate-pulse rounded-lg bg-muted" />
        <div className="overflow-hidden rounded-2xl bg-muted/50">
          <div className="aspect-[3/1] animate-pulse bg-muted" />
          <div className="space-y-4 p-6">
            <div className="flex gap-4">
              <div className="size-24 animate-pulse rounded-xl bg-muted sm:size-32" />
              <div className="flex-1 space-y-3 pt-4">
                <div className="h-7 w-64 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!exposant) {
    return (
      <Card className="border-0 py-0-none">
        <CardContent className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-muted">
            <Building2 className="size-10 text-muted-foreground/40" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('annuaire.detail.not_found')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('annuaire.detail.not_found_desc')}</p>
          </div>
          <Link href="/annuaire" className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full')}>
            <ArrowLeft className="mr-2 size-4" />
            {t('annuaire.detail.back')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* Lightbox */}
      {lightboxIndex !== null && exposant.gallery_urls && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setLightboxIndex(null)}>
          <button onClick={() => setLightboxIndex(null)} className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white">
            <X className="size-5" />
          </button>
          {Array.isArray(exposant.gallery_urls) && exposant.gallery_urls.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(((lightboxIndex - 1) % (exposant.gallery_urls as string[]).length + (exposant.gallery_urls as string[]).length) % (exposant.gallery_urls as string[]).length); }} className="absolute left-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white">
                <ChevronLeft className="size-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % (exposant.gallery_urls as string[]).length); }} className="absolute right-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white">
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
          <div className="relative flex h-[85vh] w-[90vw] max-h-[85vh] max-w-[90vw] items-center justify-center">
            <Image
              src={getValidImageUrl((exposant.gallery_urls as string[])[lightboxIndex])}
              alt=""
              fill
              sizes="100vw"
              className="rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white">
            {lightboxIndex + 1} / {(exposant.gallery_urls as string[]).length}
          </div>
        </div>
      )}

      {/* Back nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/annuaire"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t('annuaire.detail.back')}
        </Link>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={handleShare}>
          <Share2 className="mr-2 size-4" />
          {t('common.share')}
        </Button>
      </div>

      {/* HEADER CARD (LinkedIn Style) */}
      <Card className="surface-panel overflow-hidden border-0 p-0">
        <div className="relative h-48 w-full bg-muted sm:h-64">
          {exposant.cover_url ? (
            <Image src={getValidImageUrl(exposant.cover_url)} alt={t('annuaire.detail.cover_alt')} fill sizes="100vw" className="object-cover" />
          ) : (
            <div className={cn("h-full w-full bg-gradient-to-br", getGradient(exposant.id))} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-5 -mt-12 sm:-mt-16">
              <div className="relative shrink-0">
                <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-2xl border-[3px] border-background bg-white dark:bg-slate-900 sm:size-36">
                  {exposant.logo_url ? (
                    <Image src={getValidImageUrl(exposant.logo_url)} alt={exposant.nom} fill sizes="(max-width: 640px) 112px, 144px" className="object-contain p-2" />
                  ) : (
                    <Building2 className="size-14 text-muted-foreground/30" />
                  )}
                </div>
                {exposant.is_featured && (
                  <div className="absolute -right-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full bg-amber-400">
                    <Award className="size-4 text-white" />
                  </div>
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{exposant.nom}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  {exposant.secteur && (
                    <Badge variant="secondary" className="rounded-full text-xs font-normal">
                      <Tag className="mr-1 size-3" />
                      {exposant.secteur}
                    </Badge>
                  )}
                  {exposant.pays && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {exposant.pays}
                    </span>
                  )}
                  {exposant.nombre_employes && (
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      {exposant.nombre_employes}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {exposant.profile_id && !isCurrentlyBlocked && perms.canContactExposant && (
                <Button
                  className="rounded-full px-5"
                  onClick={() => handleContact()}
                  disabled={contacting}
                >
                  {contacting ? (
                    <span className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <MessageSquare className="mr-2 size-4" />
                  )}
                  {t('annuaire.detail.contact')}
                </Button>
              )}
              {exposant.website && (
                <a
                  href={exposant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'rounded-full size-10')}
                  title={t('annuaire.detail.visit_website')}
                >
                  <Globe className="size-4" />
                </a>
              )}
              {exposant.profile_id && perms.canBlockUsers && (
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full size-10"
                  onClick={isCurrentlyBlocked ? handleUnblockExposant : handleBlockExposant}
                  disabled={blocking}
                  title={isCurrentlyBlocked ? t('annuaire.detail.unblock') : t('annuaire.detail.block')}
                >
                  {isCurrentlyBlocked ? (
                    <Ban className="size-4 text-destructive" />
                  ) : (
                    <ShieldAlert className="size-4 text-destructive" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {exposant.description && (
              <p className="w-full text-base leading-relaxed text-muted-foreground sm:w-auto">
                {exposant.description}
              </p>
            )}
          </div>

          {(exposant.pavillon || exposant.stand) && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <MapPin className="size-4" />
              {exposant.pavillon && exposant.stand
                ? t('annuaire.detail.pavillon_stand', { pavillon: exposant.pavillon, stand: exposant.stand })
                : exposant.pavillon
                  ? `${t('annuaire.pavillon_prefix')} ${exposant.pavillon}`
                  : t('annuaire.stand_label', { stand: exposant.stand! })}
            </div>
          )}
        </div>
      </Card>

      {/* Two Columns */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        {/* Main */}
        <div className="space-y-6">
          {(exposant.long_description || exposant.video_url || exposant.brochure_url) && (
            <Card className="border-0 py-0">
              {exposant.long_description && (
                <CardContent className="p-6">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">{t('annuaire.detail.about')}</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                    {exposant.long_description}
                  </p>
                </CardContent>
              )}
              {exposant.brochure_url && (
                <div className={cn("border-t border-border/50 px-6 py-4", exposant.long_description ? "" : "border-t-0")}>
                  <a
                    href={exposant.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted/60 hover:border-border"
                  >
                    <Download className="size-4 text-muted-foreground" />
                    {t('annuaire.detail.brochure')}
                  </a>
                </div>
              )}

              {exposant.video_url && (
                <div className="border-t border-border/50">
                  <div className="flex items-center gap-2 bg-muted/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Video className="size-3.5" />
                    {t('annuaire.detail.video')}
                  </div>
                  <div className="aspect-video w-full">
                    <iframe
                      src={toEmbedUrl(exposant.video_url)}
                      className="h-full w-full"
                      allowFullScreen
                      title={t('annuaire.detail.video_title', { name: exposant.nom })}
                    />
                  </div>
                </div>
              )}
            </Card>
          )}

          {Array.isArray(exposant.gallery_urls) && (exposant.gallery_urls as string[]).length > 0 && (
            <Card className="border-0">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">{t('annuaire.detail.gallery')}</h2>
                  <span className="text-xs text-muted-foreground">{(exposant.gallery_urls as string[]).length} photos</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(exposant.gallery_urls as string[]).map((url: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
                    >
                      <Image
                        src={getValidImageUrl(url)}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 py-0">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">{t('annuaire.detail.posts')}</h2>
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {publications.length}
                </span>
              </div>

              {publications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
                  <Rss className="mx-auto mb-3 size-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{t('annuaire.detail.no_posts')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {publications.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post as unknown as Parameters<typeof PostCard>[0]['post']}
                      isOwner={myUserId === post.author_id}
                      onLike={() => toggleLike(post.id)}
                      onShare={() => sharePost(post.id)}
                      onRepost={(content, originalPostId) => repostPost(content, originalPostId)}
                      onSave={() => toggleSave(post.id)}
                       onFollow={() => toggleFollow((post as any).repost_of?.author_id ?? post.author_id)}
                      onReaction={(type) => toggleReaction(post.id, type)}
                      onEdit={(postId, content, type, category, imageUrl) =>
                        updatePost(postId, content, type, category, imageUrl)
                      }
                      createPost={createPost}
                      onDelete={() => deletePost(post.id)}
                      onGetComments={() => getComments(post.id)}
                      onAddComment={(content, parentCommentId) => addComment(post.id, content, parentCommentId)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-0 py-0">
            <CardContent className="p-6">
              <h2 className="mb-5 text-lg font-semibold text-foreground">{t('annuaire.detail.company_details')}</h2>
              <dl className="space-y-4 text-sm">
                {exposant.website && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 font-medium text-muted-foreground">{t('annuaire.detail.website')}</dt>
                    <dd className="truncate text-right font-medium text-primary hover:underline">
                      <a href={exposant.website} target="_blank" rel="noopener noreferrer">
                        {exposant.website.replace(/^https?:\/\//, '')}
                      </a>
                    </dd>
                  </div>
                )}
                {exposant.secteur && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 font-medium text-muted-foreground">{t('annuaire.detail.sector')}</dt>
                    <dd className="text-right text-foreground">{exposant.secteur}</dd>
                  </div>
                )}
                {exposant.pays && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 font-medium text-muted-foreground">{t('annuaire.detail.country')}</dt>
                    <dd className="text-right text-foreground">{exposant.pays}</dd>
                  </div>
                )}
                {exposant.nombre_employes && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 font-medium text-muted-foreground">{t('annuaire.detail.company_size')}</dt>
                    <dd className="text-right text-foreground">{t('annuaire.detail.employees', { count: exposant.nombre_employes! })}</dd>
                  </div>
                )}
                {exposant.annee_creation && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 font-medium text-muted-foreground">{t('annuaire.detail.founded')}</dt>
                    <dd className="text-right text-foreground">{exposant.annee_creation}</dd>
                  </div>
                )}
                {exposant.chiffre_affaires && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 font-medium text-muted-foreground">{t('annuaire.detail.revenue')}</dt>
                    <dd className="text-right font-semibold text-foreground">{exposant.chiffre_affaires}</dd>
                  </div>
                )}

                {(exposant.email_contact || exposant.phone_contact) && (
                  <div className="border-t border-border/50 pt-4">
                    <dt className="mb-3 font-medium text-muted-foreground">{t('annuaire.detail.contacts')}</dt>
                    {perms.canSeeContactDetails ? (
                      <dd className="space-y-2">
                        {exposant.email_contact && (
                          <a
                            href={`mailto:${exposant.email_contact}`}
                            className="flex items-center gap-2.5 rounded-lg bg-primary/5 px-3.5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                          >
                            <Mail className="size-4 shrink-0" />
                            <span className="truncate">{exposant.email_contact}</span>
                          </a>
                        )}
                        {exposant.phone_contact && (
                          <a
                            href={`tel:${exposant.phone_contact}`}
                            className="flex items-center gap-2.5 rounded-lg bg-primary/5 px-3.5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                          >
                            <Phone className="size-4 shrink-0" />
                            <span>{exposant.phone_contact}</span>
                          </a>
                        )}
                      </dd>
                    ) : (
                      <dd className="rounded-lg bg-muted/50 px-3.5 py-2.5 text-sm text-muted-foreground">
                        Connectez-vous en Premium pour voir les coordonnées
                      </dd>
                    )}
                  </div>
                )}
              </dl>

              {(exposant.linkedin_url || exposant.facebook_url || exposant.twitter_url || exposant.instagram_url) && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-border/50 pt-5">
                  {exposant.linkedin_url && (
                    <a href={exposant.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex size-9 items-center justify-center rounded-full bg-[#0077B5]/10 text-[#0077B5] transition-colors hover:bg-[#0077B5]/20" title="LinkedIn">
                      <IconLinkedin className="size-4" />
                    </a>
                  )}
                  {exposant.facebook_url && (
                    <a href={exposant.facebook_url} target="_blank" rel="noopener noreferrer" className="flex size-9 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2] transition-colors hover:bg-[#1877F2]/20" title="Facebook">
                      <IconFacebook className="size-4" />
                    </a>
                  )}
                  {exposant.twitter_url && (
                    <a href={exposant.twitter_url} target="_blank" rel="noopener noreferrer" className="flex size-9 items-center justify-center rounded-full bg-foreground/5 text-foreground transition-colors hover:bg-foreground/10" title="X / Twitter">
                      <IconTwitter className="size-4" />
                    </a>
                  )}
                  {exposant.instagram_url && (
                    <a href={exposant.instagram_url} target="_blank" rel="noopener noreferrer" className="flex size-9 items-center justify-center rounded-full bg-[#E1306C]/10 text-[#E1306C] transition-colors hover:bg-[#E1306C]/20" title="Instagram">
                      <IconInstagram className="size-4" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 py-0">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{t('annuaire.detail.products')}</h2>
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {produits.length}
                </span>
              </div>

              {produits.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('annuaire.detail.no_products')}</p>
              ) : (
                <div className="space-y-3">
                  {produits.map((prod) => (
                    <div
                      key={prod.id}
                      className="group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-border "
                    >
                      <div className="flex gap-3 p-3">
                        {prod.image_url ? (
                          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <Image src={getValidImageUrl(prod.image_url)} alt="" fill sizes="80px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                            <Package className="size-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                                {prod.nom}
                              </h3>
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {(prod as any).type && (
                                <span className="shrink-0 rounded-md bg-secondary/50 px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground">
                                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                  {(prod as any).type === 'service' ? 'Service' : 'Produit'}
                                </span>
                              )}
                            </div>
                            {prod.categorie && (
                              <p className="mt-0.5 text-[10px] font-medium text-muted-foreground/70">
                                {prod.categorie}
                              </p>
                            )}
                            {prod.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {prod.description}
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            {prod.prix_indicatif && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                                <Euro className="size-3 text-muted-foreground" />
                                {prod.prix_indicatif}
                              </span>
                            )}
                            {exposant.profile_id && perms.canContactExposant && (
                              <button
                                onClick={() => handleContact(prod.nom)}
                                disabled={contacting}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 hover:underline"
                              >
                                <MessageSquare className="size-3" />
                                {t('annuaire.detail.inquire')}
                              </button>
                            )}
                          </div>
                        </div>
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
