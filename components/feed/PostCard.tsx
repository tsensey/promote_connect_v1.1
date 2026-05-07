import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Heart,
  MessageSquare,
  Send,
  MoreHorizontal,
  Trash2,
  BadgeCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { useFeed } from '@/hooks/useFeed';

type Post = NonNullable<ReturnType<typeof useFeed>['posts']>[number];

interface PostCardProps {
  post: Post;
  isOwner: boolean;
  onLike: () => void;
  onDelete: () => void;
  onGetComments: ReturnType<typeof useFeed>['getComments'];
  onAddComment: ReturnType<typeof useFeed>['addComment'];
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  annonce: 'bg-blue-100 text-blue-700',
  actualite: 'bg-green-100 text-green-700',
  offre: 'bg-purple-100 text-purple-700',
  evenement: 'bg-orange-100 text-orange-700',
  general: 'bg-muted text-muted-foreground',
};

export function PostCard({
  post,
  isOwner,
  onLike,
  onDelete,
  onGetComments,
  onAddComment,
}: PostCardProps) {
  const [comments, setComments] = useState<
    Awaited<ReturnType<typeof onGetComments>>
  >([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
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
    ? post.author.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  const timeAgo = formatDistanceToNow(new Date(post.created_at as string), {
    locale: fr,
    addSuffix: true,
  });

  const typeLabel = post.category || 'General';

  return (
    <Card className="border-border/60 transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">
                {post.author.full_name || 'Utilisateur'}
              </span>
              {post.author.role === 'exposant' && (
                <BadgeCheck className="h-4 w-4 text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {post.author.company && <span>{post.author.company}</span>}
              {post.author.company && <span>•</span>}
              <span>{timeAgo}</span>
              {post.type !== 'general' && (
                <>
                  <span>•</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_BADGE_COLORS[post.type] || TYPE_BADGE_COLORS.general}`}
                  >
                    {typeLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-border bg-white py-1 shadow-lg">
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
          {post.content}
        </div>

        {post.image_url && (
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <img
              src={post.image_url}
              alt=""
              className="w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 ${post.is_liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
            onClick={onLike}
          >
            <Heart
              className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`}
            />
            <span className="text-xs">{post.likes_count || 0}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-blue-500"
            onClick={handleToggleComments}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">{post.comments_count || 0}</span>
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
                ? comment.author.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                : '?';

              return (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-muted text-[10px] font-semibold">
                      {commentInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
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
                    <p className="mt-0.5 text-sm text-slate-700">
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
                className="flex-1 rounded-full border border-border bg-muted px-4 py-2 text-sm outline-none focus:border-primary"
              />
              <Button
                type="submit"
                size="icon"
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
