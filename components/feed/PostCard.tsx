import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  MessageSquare,
  Send,
  MoreHorizontal,
  Trash2,
  BadgeCheck,
  Share2,
  Repeat2,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { useFeed } from '@/hooks/useFeed';

type Post = NonNullable<ReturnType<typeof useFeed>['posts']>[number];

interface PostCardProps {
  post: Post;
  isOwner: boolean;
  onLike: () => void;
  onShare: () => void;
  onRepost: () => void;
  onDelete: () => void;
  onGetComments: ReturnType<typeof useFeed>['getComments'];
  onAddComment: ReturnType<typeof useFeed>['addComment'];
}

const TYPE_BADGE: Record<string, { bg: string; label: string }> = {
  annonce: { bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', label: 'Annonce' },
  actualite: { bg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', label: 'Actualite' },
  offre: { bg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300', label: 'Offre' },
  evenement: { bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300', label: 'Evenement' },
  general: { bg: 'bg-muted text-muted-foreground', label: 'General' },
};

export function PostCard({
  post,
  isOwner,
  onLike,
  onShare,
  onRepost,
  onDelete,
  onGetComments,
  onAddComment,
}: PostCardProps) {
  const [comments, setComments] = useState<Awaited<ReturnType<typeof onGetComments>>>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = useCallback(() => {
    setLikeAnim(true);
    onLike();
    setTimeout(() => setLikeAnim(false), 300);
  }, [onLike]);

  const handleToggleComments = useCallback(async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const data = await onGetComments(post.id);
        setComments(data);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments((prev) => !prev);
  }, [showComments, onGetComments, post.id]);

  const handleAddComment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;

      const { data, error } = await onAddComment(post.id, newComment);
      if (!error && data) {
        setComments((prev) => [...prev, data]);
        setNewComment('');
      }
    },
    [newComment, onAddComment, post.id]
  );

  const authorInitials = post.author.full_name
    ? post.author.full_name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : '?';

  const timeAgo = formatDistanceToNow(new Date(post.created_at as string), {
    locale: fr,
    addSuffix: true,
  });

  const typeInfo = TYPE_BADGE[post.type] || TYPE_BADGE.general;

  return (
    <Card className="border-border/60 transition-all duration-200 hover:shadow-md dark:hover:shadow-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            {post.author.avatar_url ? (
              <AvatarImage src={post.author.avatar_url} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {authorInitials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {post.author.full_name || 'Utilisateur'}
              </span>
              {post.author.role === 'exposant' && (
                <BadgeCheck className="h-4 w-4 text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {post.author.company && <span>{post.author.company}</span>}
              {post.author.company && <span className="text-border">•</span>}
              <span>{timeAgo}</span>
              {post.type !== 'general' && (
                <>
                  <span className="text-border">•</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', typeInfo.bg)}>
                    {typeInfo.label}
                  </span>
                </>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-border bg-card py-1 shadow-lg">
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 whitespace-pre-wrap text-sm text-foreground/85 leading-relaxed">
          {post.content}
        </div>

        {post.image_url && (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/20">
            <img
              src={post.image_url}
              alt=""
              className="w-full object-cover max-h-96"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {(post.likes_count > 0 || post.comments_count > 0 || post.shares_count > 0 || post.reposts_count > 0) && (
          <div className="mt-2 flex items-center gap-4 px-1 py-1 text-xs text-muted-foreground">
            {post.likes_count > 0 && <span>{post.likes_count} {post.likes_count === 1 ? 'jaime' : 'j aimes'}</span>}
            {post.comments_count > 0 && <span>{post.comments_count} commentaire{post.comments_count > 1 ? 's' : ''}</span>}
            {post.shares_count > 0 && <span>{post.shares_count} partage{post.shares_count > 1 ? 's' : ''}</span>}
            {post.reposts_count > 0 && <span>{post.reposts_count} republication{post.reposts_count > 1 ? 's' : ''}</span>}
          </div>
        )}

        <div className="mt-2 flex items-center gap-1 border-t border-border pt-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-1.5 text-muted-foreground transition-colors',
              post.is_liked && 'text-red-500 hover:text-red-600'
            )}
            onClick={handleLike}
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-all',
                post.is_liked && 'fill-current',
                likeAnim && 'scale-125'
              )}
            />
            <span className="text-xs">J aime</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-blue-500"
            onClick={handleToggleComments}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">Commenter</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-1.5 text-muted-foreground transition-colors',
              post.is_shared && 'text-emerald-500'
            )}
            onClick={onShare}
          >
            {post.is_shared ? (
              <Check className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            <span className="text-xs">Partager</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-1.5 text-muted-foreground transition-colors',
              post.is_reposted && 'text-violet-500'
            )}
            onClick={onRepost}
          >
            <Repeat2 className="h-4 w-4" />
            <span className="text-xs">Republier</span>
          </Button>
        </div>

        {showComments && (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            {loadingComments && (
              <p className="text-center text-xs text-muted-foreground">
                Chargement des commentaires...
              </p>
            )}

            {comments.map((comment) => {
              const commentInitials = comment.author.full_name
                ? comment.author.full_name.split(' ').map((n) => n[0]).join('').toUpperCase()
                : '?';

              return (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-7 w-7 shrink-0" size="sm">
                    {comment.author.avatar_url ? (
                      <AvatarImage src={comment.author.avatar_url} />
                    ) : (
                      <AvatarFallback className="bg-muted text-[10px] font-semibold">
                        {commentInitials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {comment.author.full_name || 'Utilisateur'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {comment.created_at
                          ? formatDistanceToNow(new Date(comment.created_at), {
                              locale: fr,
                              addSuffix: true,
                            })
                          : ''}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground/80">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })}

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ecrire un commentaire..."
                className="flex-1 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-muted/80"
              />
              <Button
                type="submit"
                size="icon-sm"
                className="h-9 w-9 rounded-full"
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
