'use client';

import { useAuth } from '@/lib/auth/context';
import { useFeed } from '@/hooks/useFeed';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostCard } from '@/components/feed/PostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Sparkles, Loader2 } from 'lucide-react';

export default function FeedPage() {
  const { profile } = useAuth();
  const {
    posts,
    loading,
    hasMore,
    loadMore,
    createPost,
    deletePost,
    toggleLike,
    getComments,
    addComment,
    myUserId,
  } = useFeed();

  const totalLikes = posts.reduce((acc, p) => acc + p.likes_count, 0);
  const totalComments = posts.reduce((acc, p) => acc + p.comments_count, 0);
  const myPosts = posts.filter((p) => p.author_id === myUserId).length;

  return (
    <div className="mx-auto ">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Fil d actualites</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Restez connecte avec les exposants et visiteurs de PROMOTE
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 space-y-4">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Votre activite
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4" />
                      Publications
                    </div>
                    <Badge variant="secondary">{myPosts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Reactions
                    </div>
                    <Badge variant="secondary">{totalLikes}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Commentaires
                    </div>
                    <Badge variant="secondary">{totalComments}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Types de publication
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Annonces
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    Actualites
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                    Offres d emploi
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    Evenements
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                    General
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="col-span-12 space-y-4 lg:col-span-6">
          <CreatePost onSubmit={createPost} />

          {loading && posts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Chargement du fil...
              </p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="flex h-64 flex-col items-center justify-center text-center">
                <Sparkles className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <h3 className="text-base font-semibold text-slate-900">
                  Aucune publication pour le moment
                </h3>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Soyez le premier a partager une actualite ou une annonce avec
                  la communaute PROMOTE.
                </p>
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
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Charger plus
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 space-y-4">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Conseils de publication
                </h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    Partagez vos actualites d entreprise
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    Annoncez vos nouveaux produits
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    Proposez des opportunites B2B
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    Relatez vos experiences du salon
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
