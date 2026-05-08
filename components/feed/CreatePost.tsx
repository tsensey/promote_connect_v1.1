import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image, Send, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { useFeed } from '@/hooks/useFeed';

interface CreatePostProps {
  onSubmit: ReturnType<typeof useFeed>['createPost'];
  onUpload: ReturnType<typeof useFeed>['uploadImage'];
}

const POST_TYPES = [
  { value: 'general', label: 'Generale' },
  { value: 'annonce', label: 'Annonce' },
  { value: 'actualite', label: 'Actualite' },
  { value: 'offre', label: 'Offre d emploi' },
  { value: 'evenement', label: 'Evenement' },
];

const TYPE_COLORS: Record<string, string> = {
  general: 'bg-muted-foreground/20 text-muted-foreground',
  annonce: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  actualite: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  offre: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  evenement: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

export function CreatePost({ onSubmit, onUpload }: CreatePostProps) {
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File | null) => {
    setError(null);
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop volumineuse (max 5 Mo)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format non supporte (JPEG, PNG, WebP, GIF)');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim() || submitting) return;

      setSubmitting(true);
      setError(null);

      try {
        let imageUrl: string | null = null;

        if (imageFile) {
          setUploading(true);
          imageUrl = await onUpload(imageFile);
          setUploading(false);
        }

        const result = await onSubmit(
          content,
          postType,
          postType !== 'general' ? POST_TYPES.find((t) => t.value === postType)?.label : undefined,
          imageUrl ?? undefined
        );

        if (result && !result.error) {
          setContent('');
          setImageFile(null);
          setImagePreview(null);
          setIsExpanded(false);
        }
      } catch {
        setError("Erreur lors de la publication");
      } finally {
        setSubmitting(false);
      }
    },
    [content, postType, imageFile, submitting, onSubmit, onUpload]
  );

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleCancel = () => {
    setContent('');
    setImageFile(null);
    setImagePreview(null);
    setIsExpanded(false);
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 space-y-3">
              {!isExpanded ? (
                <button
                  type="button"
                  onClick={handleExpand}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:bg-muted/80 hover:border-primary/30"
                >
                  Partagez une actualite, une annonce ou une opportunite...
                </button>
              ) : (
                <>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="De quoi voulez-vous parler ?"
                    className="min-h-[120px] w-full resize-none rounded-lg border-0 bg-transparent p-0 text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
                    style={{ letterSpacing: 'var(--tracking-normal)' }}
                  />

                  {imagePreview && (
                    <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 w-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-xs"
                        className="absolute right-2 top-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-colors',
                      dragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    )}
                  >
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {imageFile ? imageFile.name : 'Ajouter une image (glisser-deposer ou cliquer)'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={postType}
                        onChange={(e) => setPostType(e.target.value)}
                        className={cn(
                          'rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium outline-none transition-colors focus:border-primary',
                          TYPE_COLORS[postType],
                          'bg-muted/50'
                        )}
                      >
                        {POST_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
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
                        {submitting ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {uploading ? 'Upload...' : 'Publier'}
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
