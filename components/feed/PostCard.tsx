import { memo, useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  MessageSquare,
  Send,
  MoreHorizontal,
  Trash2,
  Repeat2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  Link2,
  X,
  Bookmark,
  BookmarkCheck,
  UserPlus,
  UserMinus,
  ThumbsUp,
  HeartHandshake,
  PartyPopper,
  Lightbulb,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn, getValidImageUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import type { useFeed, Comment } from '@/hooks/useFeed';
import { MentionInput } from '@/components/shared/MentionInput';
import { ParsedMentionText } from '@/components/shared/ParsedMentionText';
import { supabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { getDisplayName, getAvatarUrl, getCompanyName, getExposantId } from '@/components/shared/UserIdentity';

type Post = NonNullable<ReturnType<typeof useFeed>['posts']>[number];

interface PostCardProps {
  post: Post;
  isOwner: boolean;
  priority?: boolean;
  onLike: () => void;
  onShare: () => void;
  onRepost: (content: string, originalPostId: string) => Promise<{ error: any }>;
  onSave: () => void;
  onFollow: () => void;
  onReaction: (type: string) => void;
  onEdit: (postId: string, content: string, type: string, category?: string, imageUrl?: string | null) => Promise<{error: any}>;
  createPost: (content: string, type?: string, category?: string, imageUrls?: string[]) => Promise<{error: any}>;
  onDelete: () => void;
  onGetComments: () => Promise<Comment[]>;
  onAddComment: (content: string, parentCommentId?: string) => Promise<{ data: Comment | null; error: unknown }>;
}

const REACTIONS = [
  { type: 'like', icon: ThumbsUp, label: 'J\'aime', color: 'text-blue-500' },
  { type: 'love', icon: Heart, label: 'Adorer', color: 'text-red-500' },
  { type: 'celebrate', icon: PartyPopper, label: 'Célébrer', color: 'text-emerald-500' },
  { type: 'support', icon: HeartHandshake, label: 'Soutenir', color: 'text-amber-500' },
  { type: 'insightful', icon: Lightbulb, label: 'Pertinent', color: 'text-violet-500' },
];

const TYPE_BADGE: Record<string, string> = {
  announcement: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  news:         'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  job:          'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  event:        'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  general:      'bg-muted text-muted-foreground',
};

const TYPE_KEYS: Record<string, string> = {
  announcement: 'feed.type.announcement',
  news: 'feed.type.news',
  job: 'feed.type.job',
  event: 'feed.type.event',
  general: 'feed.type.general',
};

const PREVIEW_CHARS = 180;

function getInitials(name: string | null | undefined) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function CommentItem({
  comment,
  depth = 0,
  onAddComment,
}: {
  comment: Comment;
  depth?: number;
  onAddComment: PostCardProps['onAddComment'];
}) {
  const { t, locale } = useTranslation();
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localReplies, setLocalReplies] = useState<Comment[]>([]);
  const [showReply, setShowReply] = useState(false);
  const [mentionedProfiles, setMentionedProfiles] = useState<string[]>([]);
  const { user } = useAuth();

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    const { data, error } = await onAddComment(replyText, comment.id);
    
    if (!error && data) {
      // 1. Notify the person being replied to (if not self)
      if (comment.author_id !== user?.id) {
        await supabaseClient.from('notifications').insert({
          profile_id: comment.author_id,
          sender_id: user!.id,
          type: 'comment',
          data: { post_id: comment.post_id, comment_id: data.id, content_preview: replyText.slice(0, 50) }
        });
      }

      // 2. Notify all mentioned profiles
      if (mentionedProfiles.length > 0) {
        const uniqueMentions = Array.from(new Set(mentionedProfiles)).filter(id => id !== user?.id);
        if (uniqueMentions.length > 0) {
          await supabaseClient.from('notifications').insert(
              uniqueMentions.map(profile_id => ({
                profile_id,
                sender_id: user!.id,
                type: 'mention_comment',
                data: { post_id: comment.post_id, comment_id: data.id, content_preview: replyText.slice(0, 50) }
              }))
          );
        }
      }

      setLocalReplies((prev) => [...prev, { ...data, replies: [] }]);
      setReplyText('');
      setMentionedProfiles([]);
      setShowReply(false);
    }
    setSubmitting(false);
  };

  const commentAuthorExposants = (comment.author as { exposants?: Array<{ id: string; nom?: string; logo_url?: string }> }).exposants;
  const authorDisplayName = getDisplayName(comment.author, commentAuthorExposants) || t('feed.post.user');
  const authorAvatarUrl = getAvatarUrl(comment.author, commentAuthorExposants);
  const authorExposantId = getExposantId(commentAuthorExposants);
  const authorInitials = getInitials(authorDisplayName);

  return (
    <div className={cn('flex gap-2', depth > 0 && 'ml-8 mt-2')}>
      {depth > 0 && <CornerDownRight className="mt-1.5 size-3.5 shrink-0 text-muted-foreground/40" />}
      <div className="flex-1 min-w-0">
        <div className="flex gap-2.5 items-start">
          <Avatar className="size-7 shrink-0">
            {authorAvatarUrl ? (
              <AvatarImage src={authorAvatarUrl} />
            ) : (
              <AvatarFallback className="bg-muted text-[10px] font-semibold">{authorInitials}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl rounded-tl-sm bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-foreground">
                  <div className="flex items-center gap-1.5">
                    {authorDisplayName}
                    {(comment.author as any).subscription_tier === 'paid' && (
                      <Badge variant="default" className="h-4 text-[9px] px-1 py-0 uppercase bg-amber-500 hover:bg-amber-600 text-white rounded-sm">PRO</Badge>
                    )}
                  </div>
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  {comment.created_at
                    ? formatDistanceToNow(new Date(comment.created_at), { locale: locale === 'en' ? enUS : fr, addSuffix: true })
                    : ''}
                </span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                <ParsedMentionText content={comment.content} />
              </p>
            </div>

            {depth < 2 && (
              <button
                onClick={() => setShowReply((v) => !v)}
                className="mt-1 ml-2 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {t('feed.post.reply')}
              </button>
            )}

            {showReply && (
              <form onSubmit={handleReply} className="mt-2 flex gap-2">
                <MentionInput
                  autoFocus
                  value={replyText}
                  onChange={setReplyText}
                  onMention={(exposant) => setMentionedProfiles(prev => [...prev, exposant.profile_id])}
                  authorExposantId={authorExposantId}
                  placeholder={t('feed.post.reply_placeholder', { name: authorDisplayName })}
                  className="rounded-xl px-3 py-1.5"
                />
                <Button type="submit" size="icon-sm" className="size-8 rounded-full shrink-0" disabled={!replyText.trim() || submitting}>
                  <Send className="size-3.5" />
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

function AuthorLink({ role, exposantId, children }: { role: string | null; exposantId: string | null; children: React.ReactNode }) {
  if (role === 'exposant' && exposantId) {
    return <Link href={`/annuaire/${exposantId}`} className="hover:opacity-80 transition-opacity">{children}</Link>;
  }
  return <>{children}</>;
}

export const PostCard = memo(function PostCard({
  post,
  isOwner,
  priority = false,
  onLike,
  onShare,
  onRepost,
  onSave,
  onFollow,
  onReaction,
  onEdit,
  createPost,
  onDelete,
  onGetComments,
  onAddComment,
}: PostCardProps) {
  const { t, locale } = useTranslation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mentionedProfiles, setMentionedProfiles] = useState<string[]>([]);
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [repostAnim, setRepostAnim] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveAnim, setSaveAnim] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showRepostDialog, setShowRepostDialog] = useState(false);
  const [repostText, setRepostText] = useState('');
  const [repostSubmitting, setRepostSubmitting] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const isRepost = post.type === 'repost' && post.repost_of != null;
  const originalPost = isRepost ? post.repost_of! : null;

  const displayAuthor = isRepost && originalPost ? originalPost.author : post.author;
  const displayContent = isRepost && originalPost ? (originalPost.content || '') : post.content;
  const displayImageUrl = isRepost && originalPost ? originalPost.image_url : post.image_url;
  const displayType = isRepost && originalPost ? (originalPost.type || 'general') : post.type;
  const displayCreatedAt = isRepost && originalPost ? (originalPost.created_at || post.created_at) : post.created_at;

  const isLong = (displayContent?.length ?? 0) > PREVIEW_CHARS;
  const contentPreview = isLong && !expanded ? displayContent.slice(0, PREVIEW_CHARS) + '…' : displayContent;
  const typeBg = TYPE_BADGE[displayType] || TYPE_BADGE.general;
  const timeAgo = formatDistanceToNow(new Date(displayCreatedAt as string), { locale: locale === 'en' ? enUS : fr, addSuffix: true });
  const postAuthorExposants = (displayAuthor as { exposants?: Array<{ id: string; nom?: string; logo_url?: string }> }).exposants;
  const authorDisplayName = getDisplayName(displayAuthor, postAuthorExposants) || t('feed.post.user');
  const authorAvatarUrl = getAvatarUrl(displayAuthor, postAuthorExposants);
  const authorCompanyName = getCompanyName(displayAuthor, postAuthorExposants);
  const exposantId = getExposantId(postAuthorExposants);
  const authorInitials = getInitials(authorDisplayName);

  const reposterExposants = post.author.exposants;
  const reposterName = getDisplayName(post.author, reposterExposants) || t('feed.post.user');

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

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;
    const { error } = await onEdit(post.id, editContent, post.type, post.category ?? undefined, post.image_url);
    if (!error) {
      setIsEditing(false);
      toast.success(t('feed.post.edited'));
    } else {
      toast.error(t('feed.post.edit_error'));
    }
  };

  const handleRepost = useCallback(() => {
    setRepostText('');
    setShowRepostDialog(true);
  }, []);

  const submitRepost = async () => {
    setRepostSubmitting(true);
    const { error } = await onRepost(repostText, post.id);
    if (!error) {
      setShowRepostDialog(false);
      setRepostText('');
      if (repostText.trim()) {
        toast.success(t('feed.post.reposted_with_note'));
      } else {
        toast.success(t('feed.post.reposted'));
      }
    } else {
      toast.error(t('feed.post.repost_error'));
    }
    setRepostSubmitting(false);
  };

  const handleNativeShare = useCallback(async () => {
    const url = `${window.location.origin}/feed#${post.id}`;
    const shareData = { title: t('feed.post.share_title', { name: authorDisplayName }), text: displayContent.slice(0, 120), url };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        onShare();
      } catch { /* annulé */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('feed.post.copied'));
      onShare();
    }
  }, [post, onShare]);

  const handleSaveToggle = useCallback(() => {
    setSaveAnim(true);
    onSave();
    setTimeout(() => setSaveAnim(false), 400);
  }, [onSave]);

  const handleReactionSelect = useCallback((type: string) => {
    setShowReactions(false);
    if (type === 'like' && !post.is_liked) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 400);
    }
    onReaction(type);
  }, [onReaction, post.is_liked]);

  const handleToggleComments = useCallback(async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const data = await onGetComments();
        setComments(data);
      } catch {
        toast.error(t('feed.post.load_error'));
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments((prev) => !prev);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  }, [showComments, onGetComments, t]);

  const handleAddComment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;
      setSubmitting(true);
      const { data, error } = await onAddComment(newComment);
      
      if (!error && data) {
        // 1. Notify the post author (if not self)
        if (post.author_id !== user?.id) {
          await supabaseClient.from('notifications').insert({
            profile_id: post.author_id,
            sender_id: user!.id,
            type: 'comment',
            data: { post_id: post.id, comment_id: data.id, content_preview: newComment.slice(0, 50) }
          });
        }

        // 2. Notify all mentioned profiles
        if (mentionedProfiles.length > 0) {
          const uniqueMentions = Array.from(new Set(mentionedProfiles)).filter(id => id !== user?.id);
          if (uniqueMentions.length > 0) {
            await supabaseClient.from('notifications').insert(
            uniqueMentions.map(profile_id => ({
              profile_id,
              sender_id: user!.id,
              type: 'mention_comment',
              data: { post_id: post.id, comment_id: data.id, content_preview: newComment.slice(0, 50) }
            }))
            );
          }
        }

        setComments((prev) => [...prev, { ...data, replies: [] }]);
        setNewComment('');
        setMentionedProfiles([]);
      }
      setSubmitting(false);
    },
    [newComment, onAddComment, post.author_id, post.id, user, mentionedProfiles]
  );

  return (
    <Card
      id={post.id}
      className="border-border/50 bg-card transition-all duration-200   p-0"
    >
      <CardContent className="p-0">
        {/* Repost banner */}
        {isRepost && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-0 text-xs text-muted-foreground">
            <Repeat2 className="size-3.5 text-violet-500 shrink-0" />
            <span>{t('feed.post.repost_notice', { name: reposterName })}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <AuthorLink role={displayAuthor.role} exposantId={exposantId ?? null}>
            <Avatar className="size-10 shrink-0 ring-2 ring-border/20">
              {authorAvatarUrl ? (
                <AvatarImage src={authorAvatarUrl} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {authorInitials}
                </AvatarFallback>
              )}
            </Avatar>
          </AuthorLink>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <AuthorLink role={displayAuthor.role} exposantId={exposantId ?? null}>
                <span className="font-semibold text-sm text-foreground hover:underline">
                  <div className="flex items-center gap-1.5">
                    {authorDisplayName}
                    {(displayAuthor as Record<string, unknown>).subscription_tier === 'paid' && (
                      <Badge variant="default" className="h-4 text-[9px] px-1 py-0 uppercase bg-amber-500 hover:bg-amber-600 text-white rounded-sm">PRO</Badge>
                    )}
                  </div>
                </span>
              </AuthorLink>
              {(displayAuthor as Record<string, unknown>).subscription_tier === 'paid' && Boolean((postAuthorExposants?.[0] as Record<string, unknown> | undefined)?.is_featured) && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/20">
                  {t('feed.sponsored')}
                </span>
              )}
              {displayAuthor.role === 'exposant' && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/20">
                  {t('feed.post.exposant')}
                </span>
              )}
              {displayType !== 'general' && (
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', typeBg)}>
                  {t(TYPE_KEYS[displayType] || 'feed.type.general')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
              {authorCompanyName && <span>{authorCompanyName}</span>}
              {authorCompanyName && <span>·</span>}
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Follow button */}
          {!isOwner && (
            <button
              onClick={onFollow}
              className={cn(
                'shrink-0 rounded-full p-1.5 transition-all',
                post.author.is_following
                  ? 'text-primary bg-primary/10 hover:bg-primary/20'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              )}
              title={post.author.is_following ? t('feed.post.unfollow') : t('feed.post.follow')}
            >
              {post.author.is_following ? (
                <UserMinus className="size-3.5" />
              ) : (
                <UserPlus className="size-3.5" />
              )}
            </button>
          )}

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
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-border bg-card">
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 rounded-xl"
                  >
                    <MoreHorizontal className="size-4" />
                    {t('feed.post.edit')}
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-xl"
                  >
                    <Trash2 className="size-4" />
                    {t('common.delete')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-2">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full resize-none rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>{t('common.cancel')}</Button>
                <Button size="sm" onClick={handleEditSubmit}>{t('common.save')}</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
                {contentPreview}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {expanded ? (
                    <><ChevronUp className="size-3" /> {t('feed.post.see_less')}</>
                  ) : (
                    <><ChevronDown className="size-3" /> {t('feed.post.see_more')}</>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Image */}
        {displayImageUrl && (
          <div className="mx-1 mb-3">
            {(() => {
              const images = displayImageUrl.split(',');
              const count = images.length;
              
              if (count === 1) {
                return (
                  <div className="overflow-hidden rounded-xl border border-border/60">
                    <Image
                      src={getValidImageUrl(images[0])}
                      alt=""
                      width={0}
                      height={0}
                      sizes="100vw"
                      priority={priority}
                      unoptimized={images[0].toLowerCase().endsWith('.gif')}
                      className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                      style={{ width: '100%', height: 'auto' }}
                      onClick={() => {
                        setSelectedImageIdx(0);
                        setIsImageModalOpen(true);
                        if (comments.length === 0) {
                          setLoadingComments(true);
                          onGetComments().then(data => { setComments(data); setLoadingComments(false); });
                        }
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                );
              }
              
              if (count === 2) {
                return (
                  <div className="grid grid-cols-2 gap-0.5">
                    {images.map((url, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border/60">
                        <Image
                          src={getValidImageUrl(url)}
                          alt=""
                          fill
                          priority={priority}
                          unoptimized={url.toLowerCase().endsWith('.gif')}
                          className="object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => {
                            setSelectedImageIdx(i);
                            setIsImageModalOpen(true);
                            if (comments.length === 0) {
                              setLoadingComments(true);
                              onGetComments().then(data => { setComments(data); setLoadingComments(false); });
                            }
                          }}
                          sizes="(max-width: 768px) 50vw, 25vw"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    ))}
                  </div>
                );
              }
              
              return (
                <div className="flex flex-col gap-0.5">
                  <div className="overflow-hidden rounded-xl border border-border/60">
                    <Image
                      src={getValidImageUrl(images[0])}
                      alt=""
                      width={0}
                      height={0}
                      sizes="100vw"
                      priority={priority}
                      unoptimized={images[0].toLowerCase().endsWith('.gif')}
                      className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                      style={{ width: '100%', height: 'auto' }}
                      onClick={() => {
                        setSelectedImageIdx(0);
                        setIsImageModalOpen(true);
                        if (comments.length === 0) {
                          setLoadingComments(true);
                          onGetComments().then(data => { setComments(data); setLoadingComments(false); });
                        }
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className={cn("grid gap-0.5", count === 3 ? "grid-cols-2" : "grid-cols-3")}>
                    {images.slice(1).map((url, i) => (
                      <div key={i + 1} className="relative aspect-square overflow-hidden rounded-xl border border-border/60">
                        <Image
                          src={getValidImageUrl(url)}
                          alt=""
                          fill
                          priority={priority}
                          unoptimized={url.toLowerCase().endsWith('.gif')}
                          className="object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => {
                            setSelectedImageIdx(i + 1);
                            setIsImageModalOpen(true);
                            if (comments.length === 0) {
                              setLoadingComments(true);
                              onGetComments().then(data => { setComments(data); setLoadingComments(false); });
                            }
                          }}
                          sizes="(max-width: 768px) 50vw, 33vw"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Stats bar */}
        {((post.likes_count ?? 0) > 0 || (post.comments_count ?? 0) > 0 || (post.shares_count ?? 0) > 0 || (post.reposts_count ?? 0) > 0) && (
          <div className="mx-4 mb-1 flex items-center gap-3 text-[11px] text-muted-foreground border-b border-border/40 pb-2">
            {(post.likes_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="size-3 fill-red-500 text-red-500" />
                {post.likes_count}
              </span>
            )}
            {(post.comments_count ?? 0) > 0 && (
              <button onClick={handleToggleComments} className="hover:text-foreground transition-colors">
                {t('feed.post.comments_count', { count: post.comments_count ?? 0 })}
              </button>
            )}
            {(post.shares_count ?? 0) > 0 && (
              <span>{t('feed.post.shares_count', { count: post.shares_count ?? 0 })}</span>
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
          {/* Like / Reaction button */}
          <div className="relative flex-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full gap-1.5 text-muted-foreground rounded-xl transition-all',
                post.is_liked && (post.reaction_type === 'like' ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/30' :
                  post.reaction_type === 'love' ? 'text-red-500 bg-red-50 dark:bg-red-950/30' :
                  post.reaction_type === 'celebrate' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' :
                  post.reaction_type === 'support' ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' :
                  'text-violet-500 bg-violet-50 dark:bg-violet-950/30')
              )}
              onClick={() => {
                if (post.is_liked && post.reaction_type === 'like') {
                  onLike();
                } else if (post.is_liked) {
                  onReaction(post.reaction_type!);
                } else {
                  setShowReactions(!showReactions);
                }
              }}
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                setShowReactions(true);
              }}
              onMouseLeave={() => {
                hoverTimeoutRef.current = setTimeout(() => setShowReactions(false), 200);
              }}
            >
              {post.reaction_type === 'love' ? (
                <Heart className={cn('size-4 fill-current', likeAnim && 'scale-125')} />
              ) : post.reaction_type === 'celebrate' ? (
                <PartyPopper className="size-4" />
              ) : post.reaction_type === 'support' ? (
                <HeartHandshake className="size-4" />
              ) : post.reaction_type === 'insightful' ? (
                <Lightbulb className="size-4" />
              ) : (
                <Heart className={cn('size-4 transition-all duration-300', post.is_liked && 'fill-current', likeAnim && 'scale-125')} />
              )}
              <span className="text-xs hidden sm:inline">{t('feed.post.like')}</span>
            </Button>

            {/* Reaction picker */}
            {showReactions && (
              <div
                className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-full border border-border bg-card px-2 py-1.5 z-30"
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                  setShowReactions(true);
                }}
                onMouseLeave={() => setShowReactions(false)}
              >
                {REACTIONS.map(({ type, icon: Icon, color }) => (
                  <button
                    key={type}
                    onClick={() => handleReactionSelect(type)}
                    className={cn(
                      'rounded-full p-1.5 transition-all hover:scale-125 hover:-translate-y-1',
                      post.reaction_type === type && 'bg-muted ring-1 ring-border',
                      color
                    )}
                    title={type}
                  >
                    <Icon className="size-5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5 text-muted-foreground rounded-xl hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            onClick={handleToggleComments}
          >
            <MessageSquare className="size-4" />
            <span className="text-xs hidden sm:inline">{t('feed.post.comment')}</span>
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
            <Link2 className="size-4" />
            <span className="text-xs hidden sm:inline">{t('feed.post.share')}</span>
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
            <span className="text-xs hidden sm:inline">{t('feed.post.repost_btn')}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'flex-1 gap-1.5 text-muted-foreground rounded-xl transition-all',
              post.is_saved && 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
            )}
            onClick={handleSaveToggle}
          >
            {post.is_saved ? (
              <BookmarkCheck className={cn('size-4', saveAnim && 'scale-125')} />
            ) : (
              <Bookmark className="size-4" />
            )}
            <span className="text-xs hidden sm:inline">
              {post.is_saved ? t('feed.post.saved') : t('feed.post.save')}
            </span>
          </Button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="border-t border-border/50 bg-muted/20 px-4 pt-3 pb-4 space-y-3 rounded-b-xl">
            {loadingComments ? (
              <p className="text-center text-xs text-muted-foreground py-2">{t('feed.post.loading_comments')}</p>
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
                  <p className="text-center text-xs text-muted-foreground py-1">{t('feed.post.no_comments')}</p>
                )}
              </div>
            )}

            {/* New root comment */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
              <MentionInput
                ref={commentInputRef as unknown as React.RefObject<HTMLInputElement | null>}
                value={newComment}
                onChange={setNewComment}
                onMention={(exposant) => setMentionedProfiles(prev => [...prev, exposant.profile_id])}
                authorExposantId={exposantId}
                placeholder={t('feed.post.comment_placeholder')}
                className="rounded-full bg-background focus:bg-muted/30"
              />
              <Button
                type="submit"
                size="icon-sm"
                className="size-9 rounded-full shrink-0"
                disabled={!newComment.trim() || submitting}
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        )}
      </CardContent>

      {/* Full Screen Image/Post Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="!max-w-[1200px] sm:!max-w-[1200px] w-[95vw] h-[90vh] p-0 !flex flex-col md:flex-row overflow-hidden border-border/40 gap-0" showCloseButton={false}>
          {/* Left Side: Images */}
          <div className="flex-1 bg-black/95 relative flex items-center justify-center min-h-[40vh] md:min-h-0 overflow-hidden">
             {/* Blurred background image */}
             {displayImageUrl && (
               <Image 
                 src={getValidImageUrl(displayImageUrl.split(',')[selectedImageIdx])} 
                 alt=""
                 fill
                 sizes="(max-width: 1200px) 95vw, 1200px"
                 className="object-cover absolute inset-0"
                 style={{ filter: 'blur(40px) brightness(0.5)', zIndex: 0 }}
               />
             )}
             <button onClick={() => setIsImageModalOpen(false)} className="absolute top-4 left-4 z-50 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-sm transition-all">
               <X className="size-5" />
             </button>
               {displayImageUrl && (
                  <Image 
                    src={getValidImageUrl(displayImageUrl.split(',')[selectedImageIdx])} 
                    alt={t('common.preview')}
                    fill
                    sizes="(max-width: 1200px) 95vw, 1200px"
                    className="object-contain relative"
                    style={{ zIndex: 10 }}
                  />
               )}
             {/* Next/Prev controls */}
             {displayImageUrl?.includes(',') && (
               <>
                 <button 
                   onClick={(e) => { e.stopPropagation(); setSelectedImageIdx(prev => Math.max(0, prev - 1)); }}
                   disabled={selectedImageIdx === 0}
                   className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 disabled:opacity-30 transition-all z-50"
                 >
                   <ChevronLeft className="size-6" />
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); setSelectedImageIdx(prev => Math.min(displayImageUrl!.split(',').length - 1, prev + 1)); }}
                   disabled={selectedImageIdx === (displayImageUrl?.split(',').length ?? 1) - 1}
                   className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 disabled:opacity-30 transition-all z-50"
                 >
                   <ChevronRight className="size-6" />
                 </button>
               </>
             )}
          </div>
          
          {/* Right Side: Post Details */}
          <div className="w-full md:w-[400px] flex flex-col bg-background h-full overflow-hidden shrink-0 border-l border-border/40">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-3">
                 <AuthorLink role={displayAuthor.role} exposantId={exposantId ?? null}>
                    <Avatar className="size-10 ring-2 ring-border/20">
                      {authorAvatarUrl ? <AvatarImage src={authorAvatarUrl} /> : <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{authorInitials}</AvatarFallback>}
                   </Avatar>
                 </AuthorLink>
                 <div>
                    <AuthorLink role={displayAuthor.role} exposantId={exposantId ?? null}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm block hover:underline">{authorDisplayName}</span>
                        {(displayAuthor as Record<string, unknown>).subscription_tier === 'paid' && (
                          <Badge variant="default" className="h-4 text-[9px] px-1 py-0 uppercase bg-amber-500 hover:bg-amber-600 text-white rounded-sm">PRO</Badge>
                        )}
                      </div>
                    </AuthorLink>
                    <span className="text-xs text-muted-foreground">{authorCompanyName} • {timeAgo}</span>
                 </div>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               <p className="whitespace-pre-wrap text-sm text-foreground/90">{displayContent}</p>
               
               {/* Stats */}
               <div className="flex items-center gap-3 text-[11px] text-muted-foreground border-y border-border/40 py-3 mt-4">
                   <span className="flex items-center gap-1"><Heart className="size-3.5 fill-red-500 text-red-500" /> {post.likes_count}</span>
                   <span>{t('feed.post.comments_count', { count: post.comments_count ?? 0 })}</span>
               </div>
               
               {/* Actions */}
               <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <button onClick={onLike} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted", "text-muted-foreground")}><Heart className="size-4" /> {t('feed.post.like')}</button>
                  <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"><MessageSquare className="size-4" /> {t('feed.post.comment')}</button>
                  <button onClick={() => { setIsImageModalOpen(false); setShowRepostDialog(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"><Repeat2 className="size-4" /> {t('feed.post.repost_btn')}</button>
               </div>
               
               {/* Comments section */}
               <div className="space-y-4 pt-2">
                 {loadingComments ? (
                   <div className="text-center py-4 text-xs text-muted-foreground">{t('common.loading')}</div>
                 ) : comments.length === 0 ? (
                   <div className="text-center py-4 text-xs text-muted-foreground">{t('feed.post.no_comments')}</div>
                 ) : (
                    comments.map(c => {
                      const cExposants = (c.author as { exposants?: Array<{ id: string; nom?: string; logo_url?: string }> }).exposants;
                      const cName = getDisplayName(c.author, cExposants) || t('feed.post.user');
                      const cAvatar = getAvatarUrl(c.author, cExposants);
                      return (
                      <div key={c.id} className="flex gap-2">
                        <Avatar className="size-8">
                          {cAvatar ? <AvatarImage src={cAvatar} /> : <AvatarFallback>{getInitials(cName)}</AvatarFallback>}
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted/40 rounded-2xl px-3 py-2">
                            <p className="text-[13px] font-semibold">{cName}</p>
                            <p className="text-[13px] text-foreground/90">{c.content}</p>
                          </div>
                         <div className="flex gap-3 px-2 mt-1 text-[11px] text-muted-foreground font-medium">
                            <span>{formatDistanceToNow(new Date(c.created_at as string), { locale: locale === 'en' ? enUS : fr })}</span>
                         </div>
                       </div>
                     </div>
                     )})
                  )}
               </div>
            </div>
            
            {/* Input */}
            <div className="p-3 border-t border-border/40 bg-background shrink-0 flex gap-2">
               <form className="flex-1 flex gap-2" onSubmit={async (e) => {
                 e.preventDefault();
                 if(!newComment.trim()) return;
                 const res = await onAddComment(newComment);
                  if(!res.error) {
                    setNewComment('');
                    setLoadingComments(true);
                    onGetComments().then(data => { setComments(data); setLoadingComments(false); }).catch(() => { setLoadingComments(false); });
                  }
               }}>
                 <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t('feed.post.comment_placeholder')} className="flex-1 bg-muted/50 rounded-full px-4 text-sm outline-none focus:ring-1 focus:ring-primary/40 border border-transparent focus:border-primary/30" />
                 <button type="submit" disabled={!newComment.trim()} className="shrink-0 p-2 text-primary hover:bg-primary/10 rounded-full disabled:opacity-50"><Send className="size-4" /></button>
               </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Repost Dialog */}
      <Dialog open={showRepostDialog} onOpenChange={setShowRepostDialog}>
        <DialogContent className="!max-w-lg p-0 overflow-hidden rounded-2xl border-border/40 gap-0">
          <div className="p-5">
            <h3 className="font-heading font-semibold text-lg text-foreground mb-1">{t('feed.post.repost_title')}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t('feed.post.repost_subtitle')}</p>

            <textarea
              value={repostText}
              onChange={(e) => setRepostText(e.target.value)}
              placeholder={t('feed.post.repost_placeholder')}
              className="w-full resize-none rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50 focus:bg-muted/30 leading-relaxed transition-all"
              rows={3}
              autoFocus
            />

            {/* Compact original post preview */}
            <div className="mt-3 rounded-xl border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="size-8 shrink-0 ring-2 ring-border/20">
                  {authorAvatarUrl ? (
                    <AvatarImage src={authorAvatarUrl} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {authorInitials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {authorDisplayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {authorCompanyName} · {timeAgo}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-foreground/80 leading-relaxed line-clamp-2 whitespace-pre-wrap">
                {displayContent}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRepostDialog(false)}
                className="rounded-full text-muted-foreground"
              >
                {t('common.cancel')}
              </Button>
              <div className="flex gap-2">
                {!repostText.trim() && (
                  <Button
                    size="sm"
                    onClick={submitRepost}
                    disabled={repostSubmitting}
                    className="rounded-full gap-1.5"
                  >
                    <Repeat2 className="size-3.5" />
                    {t('feed.post.repost_now')}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={submitRepost}
                  disabled={repostSubmitting || (!repostText.trim())}
                  className="rounded-full gap-1.5"
                >
                  {repostSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Repeat2 className="size-3.5" />
                  )}
                  {repostText.trim() ? t('feed.post.repost_with_note_btn') : t('feed.post.repost_btn')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
});