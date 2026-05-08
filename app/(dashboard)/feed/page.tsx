'use client';

import { useFeed } from '@/hooks/useFeed';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostCard } from '@/components/feed/PostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Loader2,
  Rss,
  MessageSquare,
  Heart,
  Share2,
  Repeat2,
} from 'lucide-react';

export default function FeedPage() {
  const {
    posts,
    loading,
    hasMore,
    loadMore,
    createPost,
    deletePost,
    toggleLike,
    toggleShare,
    toggleRepost,
    getComments,
    addComment,
    uploadImage,
    myUserId,
  } = useFeed();

  const totalLikes = posts.reduce((acc, p) => acc + p.likes_count, 0);
  const totalComments = posts.reduce((acc, p) => acc + p.comments_count, 0);
  const totalShares = posts.reduce((acc, p) => acc + p.shares_count, 0);
  const totalReposts = posts.reduce((acc, p) => acc + p.reposts_count, 0);
  const myPosts = posts.filter((p) => p.author_id === myUserId).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="hidden space-y-4 lg:col-span-3 lg:block">
          <div className="sticky top-20 space-y-4">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Rss className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                    Votre activité
                  </h3>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: Sparkles, label: 'Publications', value: myPosts },
                    { icon: Heart, label: 'Reactions', value: totalLikes },
                    { icon: MessageSquare, label: 'Commentaires', value: totalComments },
                    { icon: Share2, label: 'Partages', value: totalShares },
                    { icon: Repeat2, label: 'Republications', value: totalReposts },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5 transition-colors hover:bg-muted/80"
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

            <Card className="border-border/60">
              <CardContent className="p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Types de publication
                </h3>
                <div className="space-y-2.5 text-xs">
                  {[
                    { color: 'bg-blue-500', label: 'Annonces' },
                    { color: 'bg-emerald-500', label: 'Actualites' },
                    { color: 'bg-violet-500', label: 'Offres d emploi' },
                    { color: 'bg-amber-500', label: 'Evenements' },
                    { color: 'bg-muted-foreground', label: 'General' },
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

          {loading && posts.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Chargement du fil...
                </p>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="size-8 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-lg font-heading font-semibold text-foreground">
                    Aucune publication pour le moment
                  </p>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                    Soyez le premier a partager une actualite ou une annonce
                    avec la communaute PROMOTE.
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
                  onShare={() => toggleShare(post.id)}
                  onRepost={() => toggleRepost(post.id)}
                  onDelete={() => deletePost(post.id)}
                  onGetComments={() => getComments(post.id)}
                  onAddComment={(content) => addComment(post.id, content)}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                    className="rounded-xl"
                  >
                    {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Charger plus
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="hidden space-y-4 lg:col-span-3 lg:block">
          <div className="sticky top-20 space-y-4">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Conseils de publication
                </h3>
                <ul className="space-y-3 text-xs text-muted-foreground">
                  {[
                    'Partagez vos actualites d entreprise',
                    'Annoncez vos nouveaux produits',
                    'Proposez des opportunites B2B',
                    'Relatez vos experiences du salon',
                  ].map((tip) => (
                    <li key={tip} className="flex gap-2.5">
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                  A propos
                </h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  Le fil d&apos;actualites vous permet de rester informe des
                  dernieres nouvelles de la communaute PROMOTE. Interagissez
                  avec les autres membres en aimant, commentant et partageant
                  leurs publications.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
