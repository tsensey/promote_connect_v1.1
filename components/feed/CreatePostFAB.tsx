'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Image, Send, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { useFeed } from '@/hooks/useFeed';

interface CreatePostFABProps {
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

export function CreatePostFAB({ onSubmit, onUpload }: CreatePostFABProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          const urls = await onUpload([imageFile]);
          imageUrl = urls[0] ?? null;
          setUploading(false);
        }

        const result = await onSubmit(
          content,
          postType,
          postType !== 'general' ? POST_TYPES.find((t) => t.value === postType)?.label : undefined,
          imageUrl ? [imageUrl] : undefined
        );

        if (result && !result.error) {
          setContent('');
          setImageFile(null);
          setImagePreview(null);
          setOpen(false);
        }
      } catch {
        setError("Erreur lors de la publication");
      } finally {
        setSubmitting(false);
      }
    },
    [content, postType, imageFile, submitting, onSubmit, onUpload]
  );

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      setError(null);
      setOpen(false);
    } else {
      setOpen(true);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : '?';

  const modalContent = (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1 sm:px-2">
      <div className="flex gap-3 pb-4 border-b">
        <Avatar className="h-10 w-10 shrink-0">
          {profile?.avatar_url ? (
            <AvatarImage src={profile.avatar_url} />
          ) : (
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{profile?.full_name || 'Utilisateur'}</p>
          {profile?.company && (
            <p className="text-xs text-muted-foreground">{profile.company}</p>
          )}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={profile?.role === 'exposant' && isMobile ? "Partager avec nous..." : "De quoi voulez-vous parler ?"}
        className="min-h-[120px] w-full resize-none rounded-lg border border-border bg-transparent p-3 text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
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

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={postType}
          onChange={(e) => setPostType(e.target.value)}
          className={cn(
            'rounded-lg border border-border px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-primary',
            TYPE_COLORS[postType],
            'bg-muted/50'
          )}
        >
          {POST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={!content.trim() || submitting}
            className="flex-1 sm:flex-none"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Publier
          </Button>
        </div>
      </div>
    </form>
  );

  return (
    <>
      {/* FAB Button */}
      <Button
        onClick={() => handleOpenChange(true)}
        size="lg"
        className={cn(
          "fixed bottom-6 right-6 z-40 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 h-14 w-14 sm:h-auto sm:w-auto sm:px-4",
          visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-90 pointer-events-none"
        )}
      >
        <Send className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
        <span className="hidden sm:inline">Partager</span>
      </Button>

      {/* Modal - Sheet on mobile, Dialog on desktop */}
      {isMobile ? (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl px-6 pb-6">
            <SheetHeader className="mb-4">
              <SheetTitle>Créer une publication</SheetTitle>
            </SheetHeader>
            <div>
              {modalContent}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>Créer une publication</DialogTitle>
            </DialogHeader>
            {modalContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
