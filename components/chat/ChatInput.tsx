'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Send,
  Paperclip,
  ImagePlus,
  X,
  Reply,
  Tag,
  FileText,
} from 'lucide-react';
import type { EnrichedMessage, ProductAttachment } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface SendOptions {
  content: string;
  file?: File | null;
  replyToId?: string | null;
  productAttachment?: ProductAttachment | null;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (opts: SendOptions) => void;
  onTyping?: (isTyping: boolean) => void;
  sending?: boolean;
  placeholder?: string;
  /** Message auquel on répond */
  replyTo?: EnrichedMessage | null;
  onCancelReply?: () => void;
  /** Produit pré-attaché (depuis vitrine) */
  productContext?: ProductAttachment | null;
  onCancelProduct?: () => void;
}

function fileIsImage(file: File) {
  return file.type.startsWith('image/');
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onTyping,
  sending,
  placeholder: placeholderProp,
  replyTo,
  onCancelReply,
  productContext,
  onCancelProduct,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const placeholder = placeholderProp ?? t('chat.input_placeholder');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Prévisualisation image
  useEffect(() => {
    if (selectedFile && fileIsImage(selectedFile)) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [selectedFile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleSend = () => {
    onSend({
      content: value,
      file: selectedFile,
      replyToId: replyTo?.id ?? null,
      productAttachment: productContext ?? null,
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    onTyping?.(e.target.value.length > 0);
  };

  const canSend = (value.trim().length > 0 || selectedFile !== null || productContext !== null) && !sending;

  return (
    <div className="flex flex-col gap-2">
      {/* ── Bannière "Répondre à" ─────────────────────────────── */}
      {replyTo && (
        <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
          <Reply className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-primary">
              {replyTo.author?.full_name ?? t('chat.user')}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {replyTo.attachment_type === 'image'
                ? '📷 Photo'
                : replyTo.attachment_type === 'document'
                ? '📄 Document'
                : replyTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ── Carte produit attaché ────────────────────────────── */}
      {productContext && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <Tag className="size-4 shrink-0 text-amber-500" />
          {productContext.image_url && (
            <img
              src={productContext.image_url}
              alt={productContext.nom}
              className="size-8 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{productContext.nom}</p>
            <p className="truncate text-[11px] text-muted-foreground">{productContext.exposant_nom}</p>
          </div>
          <button
            onClick={onCancelProduct}
            className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ── Prévisualisation fichier ─────────────────────────── */}
      {selectedFile && (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 p-2">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="preview"
              className="size-14 rounded-lg object-cover ring-1 ring-border/40"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted/80">
              <FileText className="size-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(0)} Ko
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemoveFile}
            className="size-7 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* ── Zone de saisie principale ───────────────────────── */}
      <div
        className={cn(
          'flex items-end gap-2 rounded-2xl border border-border/60 bg-muted/30 px-3 py-2.5',
          'transition-colors focus-within:border-primary/40 focus-within:bg-muted/50'
        )}
      >
        {/* Inputs fichiers cachés */}
        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        <input
          type="file"
          ref={docInputRef}
          className="hidden"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />

        {/* Bouton image */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-primary"
          onClick={() => imageInputRef.current?.click()}
          disabled={sending || !!selectedFile}
          title={t('chat.send_image')}
        >
          <ImagePlus className="size-4" />
        </Button>

        {/* Bouton document */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-primary"
          onClick={() => docInputRef.current?.click()}
          disabled={sending || !!selectedFile}
          title={t('chat.send_document')}
        >
          <Paperclip className="size-4" />
        </Button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none leading-relaxed py-0.5"
        />

        <Button
          type="button"
          size="icon"
          className="size-8 shrink-0 rounded-full transition-all"
          disabled={!canSend}
          onClick={handleSend}
        >
          {sending ? (
            <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
