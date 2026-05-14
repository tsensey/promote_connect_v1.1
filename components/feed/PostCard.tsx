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
  Share2,
  Repeat2,
  Check,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Link2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { useFeed, Comment } from '@/hooks/useFeed';

type Post = NonNullable<ReturnType<typeof useFeed>['posts']>[number];

interface PostCardProps {
  post: Post;
  isOwner: boolean;
  onLike: () => void;
  onShare: () => void;
  onRepost: () => void;
  onDelete: () => void;
  onGetComments: () => Promise<Comment[]>;
  onAddComment: (content: string, parentCommentId?: string) => Promise<{ data: Comment | null; error: unknown }>;
}

const TYPE_BADGE: Record<string, { bg: string; label: string }> = {
  annonce:   { bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',       label: 'Annonce'    },
  actualite: { bg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', label: 'Actualité' },
  offre:     { bg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',     label: 'Offre'      },
  evenement: { bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',        label: 'Événement'  },
  general:   { bg: 'bg-muted text-muted-foreground',                                               label: 'Général'    },
};

const PREVIEW_CHARS = 80;

function getInitials(name: string | null | undefined) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─────────────────────────────────────────────────────────
// Composant récursif : un commentaire + ses réponses
// ─────────────────────────────────────────────────────────
function CommentItem({
  comment,
  depth = 0,
  onAddComment,
}: {
  comment: Comment;
  depth?: number;
  onAddComment: PostCardProps['onAddComment'];
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies ?? []);
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    const { data, error } = await onAddComment(replyText, comment.id);
    if (!error && data) {
      setLocalReplies((prev) => [...prev, { ...data, replies: [] }]);
      setReplyText('');
      setShowReply(false);
    }
    setSubmitting(false);
  };

  const authorInitials = getInitials(comment.author.full_name);

  return (
    <div className={cn('flex gap-2', depth > 0 && 'ml-8 mt-2')}>
      {depth > 0 && <CornerDownRight className="mt-1.5 size-3.5 shrink-0 text-muted-foreground/40" />}
      <div className="flex-1 min-w-0">
        <div className="flex gap-2.5 items-start">
          <Avatar className="size-7 shrink-0">
            {comment.author.avatar_url ? (
              <AvatarImage src={comment.author.avatar_url} />
            ) : (
              <AvatarFallback className="bg-muted text-[10px] font-semibold">{authorInitials}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl rounded-tl-sm bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-foreground">
                  {comment.author.full_name || 'Utilisateur'}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  {comment.created_at
                    ? formatDistanceToNow(new Date(comment.created_at), { locale: fr, addSuffix: true })
                    : ''}
                </span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">{comment.content}</p>
            </div>

            {depth < 2 && (
              <button
                onClick={() => setShowReply((v) => !v)}
                className="mt-1 ml-2 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Répondre
              </button>
            )}

            {showReply && (
              <form onSubmit={handleReply} className="mt-2 flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Répondre à ${comment.author.full_name || 'Utilisateur'}...`}
                  className="flex-1 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
                />
                <Button type="submit" size="icon-sm" className="size-7 rounded-full" disabled={!replyText.trim() || submitting}>
                  <Send className="size-3" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {localReplies.map((reply) => (
          <CommentItem key={reply.id} comment={reply} depth={depth + 1} onAddComment={onAddComment} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PostCard principal
// ─────────────────────────────────────────────────────────
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [repostAnim, setRepostAnim] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const isLong = (post.content?.length ?? 0) > PREVIEW_CHARS;
  const displayContent = isLong && !expanded ? post.content.slice(0, PREVIEW_CHARS) + '…' : post.content;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = useCallback(() => {
    setLikeAnim(true);
    onLike();
    setTimeout(() => setLikeAnim(false), 400);
  }, [onLike]);

  const handleRepost = useCallback(() => {
    setRepostAnim(true);
    onRepost();
    setTimeout(() => setRepostAnim(false), 400);
  }, [onRepost]);

  const handleNativeShare = useCallback(async () => {
    const url = `${window.location.origin}/feed#${post.id}`;
    const shareData = { title: `Publication de ${post.author.full_name}`, text: post.content.slice(0, 120), url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* annulé */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papier');
    }
    onShare();
  }, [post, onShare]);

  const handleToggleComments = useCallback(async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const data = await onGetComments();
        setComments(data);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments((prev) => !prev);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  }, [showComments, onGetComments]);

  const handleAddComment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;
      const { data, error } = await onAddComment(newComment);
      if (!error && data) {
        setComments((prev) => [...prev, { ...data, replies: [] }]);
        setNewComment('');
      }
    },
    [newComment, onAddComment]
  );

  const typeInfo = TYPE_BADGE[post.type] || TYPE_BADGE.general;
  const authorInitials = getInitials(post.author.full_name);
  const timeAgo = formatDistanceToNow(new Date(post.created_at as string), { locale: fr, addSuffix: true });

  return (
    <Card
      id={post.id}
      className="border-border/50 bg-card transition-all duration-200 hover:shadow-lg hover:border-border/80 dark:hover:shadow-primary/5 p-0"
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <Avatar className="size-10 shrink-0 ring-2 ring-border/20">
            {post.author.avatar_url ? (
              <AvatarImage src={post.author.avatar_url} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {authorInitials}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-sm text-foreground">
                {post.author.full_name || 'Utilisateur'}
              </span>
              {post.author.role === 'exposant' && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/20">
                  Exposant
                </span>
              )}
              {post.type !== 'general' && (
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', typeInfo.bg)}>
                  {typeInfo.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
              {post.author.company && <span>{post.author.company}</span>}
              {post.author.company && <span>·</span>}
              <span>{timeAgo}</span>
            </div>
          </div>

          {isOwner && (
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-8 text-muted-foreground"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="size-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-border bg-card shadow-xl">
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-xl"
                  >
                    <Trash2 className="size-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-2">
          <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
            {displayContent}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {expanded ? (
                <><ChevronUp className="size-3" /> Voir moins</>
              ) : (
                <><ChevronDown className="size-3" /> Voir plus</>
              )}
            </button>
          )}
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="mx-4 mb-3 overflow-hidden rounded-xl border border-border/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image_url}
              alt=""
              className="w-full object-cover max-h-[28rem]"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        {/* Stats bar */}
        {(post.likes_count > 0 || post.comments_count > 0 || (post.shares_count ?? 0) > 0 || (post.reposts_count ?? 0) > 0) && (
          <div className="mx-4 mb-1 flex items-center gap-3 text-[11px] text-muted-foreground border-b border-border/40 pb-2">
            {post.likes_count > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="size-3 fill-red-500 text-red-500" />
                {post.likes_count}
              </span>
            )}
            {post.comments_count > 0 && (
              <button onClick={handleToggleComments} className="hover:text-foreground transition-colors">
                {post.comments_count} commentaire{post.comments_count > 1 ? 's' : ''}
              </button>
            )}
            {(post.shares_count ?? 0) > 0 && (
              <span>{post.shares_count} partage{(post.shares_count ?? 0) > 1 ? 's' : ''}</span>
            )}
            {(post.reposts_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Repeat2 className="size-3 text-violet-500" />
                {post.reposts_count}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center px-2 pb-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'flex-1 gap-1.5 text-muted-foreground rounded-xl transition-all',
              post.is_liked && 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/30'
            )}
            onClick={handleLike}
          >
            <Heart
              className={cn(
                'size-4 transition-all duration-300',
                post.is_liked && 'fill-current',
                likeAnim && 'scale-125'
              )}
            />
            <span className="text-xs hidden sm:inline">J&apos;aime</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5 text-muted-foreground rounded-xl hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            onClick={handleToggleComments}
          >
            <MessageSquare className="size-4" />
            <span className="text-xs hidden sm:inline">Commenter</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'flex-1 gap-1.5 text-muted-foreground rounded-xl transition-all',
              post.is_shared && 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
            )}
            onClick={handleNativeShare}
          >
            {post.is_shared ? <Check className="size-4" /> : <Link2 className="size-4" />}
            <span className="text-xs hidden sm:inline">Partager</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'flex-1 gap-1.5 text-muted-foreground rounded-xl transition-all',
              post.is_reposted && 'text-violet-500 bg-violet-50 dark:bg-violet-950/30'
            )}
            onClick={handleRepost}
          >
            <Repeat2 className={cn('size-4 transition-all', repostAnim && 'rotate-180')} />
            <span className="text-xs hidden sm:inline">Republier</span>
          </Button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="border-t border-border/50 bg-muted/20 px-4 pt-3 pb-4 space-y-3 rounded-b-xl">
            {loadingComments ? (
              <p className="text-center text-xs text-muted-foreground py-2">Chargement des commentaires...</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    depth={0}
                    onAddComment={onAddComment}
                  />
                ))}
                {comments.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-1">Soyez le premier à commenter.</p>
                )}
              </div>
            )}

            {/* New root comment */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrire un commentaire..."
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-muted/30"
              />
              <Button
                type="submit"
                size="icon-sm"
                className="size-9 rounded-full shrink-0"
                disabled={!newComment.trim()}
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
