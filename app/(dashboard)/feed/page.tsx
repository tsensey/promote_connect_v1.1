'use client';

import { useFeed } from '@/hooks/useFeed';
import { CreatePost } from '@/components/feed/CreatePost';
import { CreatePostFAB } from '@/components/feed/CreatePostFAB';
import { PostCard } from '@/components/feed/PostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sparkles,
  Loader2,
  Rss,
  MessageSquare,
  Heart,
  Share2,
  Repeat2,
  Send,
  Package,
  Flame,
  Clock,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { createConversation } from '@/hooks/useChat';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type Product = Database['public']['Tables']['produits']['Row'] & {
  exposants: { nom: string; profile_id: string; logo_url: string | null } | null;
};

export default function FeedPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    posts,
    loading,
    hasMore,
    loadMore,
    feedFilter,
    setFeedFilter,
    createPost,
    repostPost,
    updatePost,
    deletePost,
    toggleLike,
    sharePost,
    toggleSave,
    toggleReaction,
    toggleFollow,
    getComments,
    addComment,
    uploadImage,
    myUserId,
  } = useFeed();

  const [randomProducts, setRandomProducts] = useState<Product[]>([]);
  const [contactingProd, setContactingProd] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadRandomProducts() {
      const { data } = await supabaseClient
        .from('produits')
        .select('*, exposants(nom, profile_id, logo_url)')
        .limit(20);
      if (data && data.length > 0) {
        const shuffled = (data as Product[]).sort(() => 0.5 - Math.random()).slice(0, 4);
        setRandomProducts(shuffled);
      }
    }
    loadRandomProducts();
    const interval = setInterval(loadRandomProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleContactProduct = async (product: Product) => {
    if (!product.exposants?.profile_id) {
      toast.error(t('annuaire.cannot_contact'));
      return;
    }
    setContactingProd(product.id);
    const { data } = await createConversation(product.exposants.profile_id);
    if (data) {
      const { data: session } = await supabaseClient.auth.getSession();
      if (session?.session?.user) {
        const type = (product.type ?? 'produit') === 'service' ? 'service' : 'produit';
        await supabaseClient.from('messages').insert({
          conversation_id: data.id,
          sender_id: session.session.user.id,
          content: t('feed.contact_about', { type, product: product.nom }),
          is_read: false,
        });
        // Redirige vers la conversation
        router.push(`/chat/${data.id}`);
      }
    } else {
      toast.error(t('feed.contact_error'));
    }
    setContactingProd(null);
  };

  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loading, loadMore]);

  useEffect(() => {
    if (posts.length === 0) return;
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      el.classList.add('ring-2', 'ring-primary', 'rounded-xl');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'rounded-xl'), 3000);
    }
  }, [posts]);

  const totalLikes = posts.reduce((acc, p) => acc + (p.likes_count ?? 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (p.comments_count ?? 0), 0);
  const totalShares = posts.reduce((acc, p) => acc + (p.shares_count ?? 0), 0);
  const totalReposts = posts.reduce((acc, p) => acc + (p.reposts_count ?? 0), 0);
  const myPosts = posts.filter((p) => p.author_id === myUserId).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="hidden space-y-4 lg:col-span-3 lg:block">
          <div className="sticky top-20 space-y-4">
            <Card className="border-border/60 p-0">
              <CardContent className="p-3">
                <div className="mb-4 flex items-center gap-2">
                  <Rss className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                    {t('feed.your_activity')}
                  </h3>
                </div>
                <div className="space-y-1">
                  {[
                    { icon: Sparkles, label: t('feed.posts'), value: myPosts },
                    { icon: Heart, label: t('feed.reactions'), value: totalLikes },
                    { icon: MessageSquare, label: t('feed.comments'), value: totalComments },
                    { icon: Share2, label: t('feed.shares'), value: totalShares },
                    { icon: Repeat2, label: t('feed.reposts'), value: totalReposts },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl bg-muted/50 px-2 py-1.5 transition-colors hover:bg-muted/80"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon className="size-4" />
                        {label}
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        {value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 p-0">
              <CardContent className="p-3">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                  {t('feed.post_types')}
                </h3>
                <div className="space-y-2.5 text-xs">
                  {[
                    { color: 'bg-blue-500', label: t('feed.type.announcement') },
                    { color: 'bg-emerald-500', label: t('feed.type.news') },
                    { color: 'bg-violet-500', label: t('feed.type.job') },
                    { color: 'bg-amber-500', label: t('feed.type.event') },
                    { color: 'bg-muted-foreground', label: t('feed.type.general') },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <span className={`size-2.5 rounded-full ${color}`} />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="col-span-12 space-y-4 lg:col-span-6">
          <CreatePost onSubmit={createPost} onUpload={uploadImage} />

          {/* Filter tabs */}
          <div className="flex gap-1 rounded-xl border border-border/60 bg-card p-1">
            {[
              { key: 'top' as const, icon: Flame, label: t('feed.filter.top') },
              { key: 'recent' as const, icon: Clock, label: t('feed.filter.recent') },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setFeedFilter(key)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                  feedFilter === key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {loading && posts.length === 0 ? (
            <Card className="border-border/60 p-0">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t('feed.loading')}
                </p>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card className="border-border/60 p-0">
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="size-8 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-lg font-heading font-semibold text-foreground">
                    {t('feed.empty')}
                  </p>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                    {t('feed.empty_hint')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isOwner={post.author_id === myUserId}
                  onLike={() => toggleLike(post.id)}
                  onShare={() => sharePost(post.id)}
                  onRepost={(content, originalId) => repostPost(content, originalId)}
                  onSave={() => toggleSave(post.id)}
                  onFollow={() => toggleFollow(post.author_id)}
                  onReaction={(type) => toggleReaction(post.id, type)}
                  onEdit={updatePost}
                  createPost={createPost}
                  onDelete={() => deletePost(post.id)}
                  onGetComments={() => getComments(post.id)}
                  onAddComment={(content, parentCommentId) => addComment(post.id, content, parentCommentId)}
                />
              ))}

              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                    className="rounded-xl"
                  >
                    {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {t('common.load_more')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="hidden space-y-4 lg:col-span-3 lg:block">
          <div className="sticky top-20 space-y-4">
            {randomProducts.slice(0, 3).map((product) => {
              return (
                <Card key={product.id} className="border-border/60 p-0 overflow-hidden group shadow-sm hover:shadow-md transition-all">
                  {product.image_url && (
                    <div className="h-28 w-full overflow-hidden">
                      <img src={product.image_url} alt={product.nom} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  )}
                  <CardContent className={product.image_url ? "p-3" : "p-3"}>
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      <Package className="size-3" />
                      {t('feed.sponsored')}
                    </div>
                    <h4 className="font-semibold text-sm text-foreground line-clamp-1">{product.nom}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description || t('feed.discover_product')}</p>

                    {/* Exposant + CTA */}
                    <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-2.5">
                      <Avatar className="size-6 shrink-0">
                        {product.exposants?.logo_url ? (
                          <AvatarImage src={product.exposants.logo_url} />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">
                            {product.exposants?.nom?.charAt(0) || '?'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="truncate text-[11px] font-medium text-muted-foreground flex-1">
                        {product.exposants?.nom || t('common.exposant')}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-lg text-[10px] px-2.5 gap-1 shrink-0"
                        disabled={contactingProd === product.id}
                        onClick={() => handleContactProduct(product)}
                      >
                        {contactingProd === product.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Send className="size-3" />
                        )}
                        {t('feed.contact')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      <CreatePostFAB onSubmit={createPost} onUpload={uploadImage} />
    </div>
  );
}
