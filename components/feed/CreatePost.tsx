import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Image, Send, X } from 'lucide-react';
import type { useFeed } from '@/hooks/useFeed';

interface CreatePostProps {
  onSubmit: ReturnType<typeof useFeed>['createPost'];
}

const POST_TYPES = [
  { value: 'general', label: 'Generale' },
  { value: 'annonce', label: 'Annonce' },
  { value: 'actualite', label: 'Actualite' },
  { value: 'offre', label: 'Offre d emploi' },
  { value: 'evenement', label: 'Evenement' },
];

export function CreatePost({ onSubmit }: CreatePostProps) {
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim() || submitting) return;

      setSubmitting(true);
      const result = await onSubmit(
        content,
        postType,
        postType !== 'general' ? POST_TYPES.find((t) => t.value === postType)?.label : undefined,
        imageUrl || undefined
      );

      if (result && !result.error) {
        setContent('');
        setImageUrl('');
        setShowImageInput(false);
        setIsExpanded(false);
      }
      setSubmitting(false);
    },
    [content, postType, imageUrl, submitting, onSubmit]
  );

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleCancel = () => {
    setContent('');
    setImageUrl('');
    setShowImageInput(false);
    setIsExpanded(false);
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              {!isExpanded ? (
                <button
                  type="button"
                  onClick={handleExpand}
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/80"
                >
                  Partagez une actualite, une annonce ou une opportunite...
                </button>
              ) : (
                <>
                  <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="De quoi voulez-vous parler ?"
                    className="min-h-[120px] resize-none border-none bg-transparent p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0"
                  />

                  {showImageInput && (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="URL de l'image..."
                        className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setShowImageInput(false);
                          setImageUrl('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {imageUrl && (
                    <div className="relative overflow-hidden rounded-lg border border-border">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="h-48 w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground"
                        onClick={() => setShowImageInput(!showImageInput)}
                      >
                        <Image className="h-4 w-4" />
                        <span className="text-xs">Image</span>
                      </Button>
                      <select
                        value={postType}
                        onChange={(e) => setPostType(e.target.value)}
                        className="rounded-lg border border-border bg-muted px-2 py-1.5 text-xs text-muted-foreground outline-none focus:border-primary"
                      >
                        {POST_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!content.trim() || submitting}
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Publier
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
