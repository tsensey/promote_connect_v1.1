'use client';

import { memo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, Reply, FileText, ExternalLink } from 'lucide-react';
import type { EnrichedMessage, ProductAttachment } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface MessageBubbleProps {
  message: EnrichedMessage;
  isMine: boolean;
  showAvatar: boolean;
  onReply: (message: EnrichedMessage) => void;
}

function formatTime(dateStr: string | null, locale: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString(locale === 'en' ? 'en-US' : 'fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string | null | undefined) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Bloc citation (reply) ────────────────────────────────────────────────────
function ReplyQuote({ replyTo, isMine }: { replyTo: EnrichedMessage['reply_to']; isMine: boolean }) {
  const { t } = useTranslation();
  if (!replyTo) return null;
  const text =
    replyTo.attachment_type === 'image'
      ? t('chat.photo')
      : replyTo.attachment_type === 'document'
      ? t('chat.document')
      : replyTo.content ?? '';

  return (
    <div
      className={cn(
        'mb-1.5 rounded-lg border-l-[3px] px-2.5 py-1.5 text-xs',
        isMine
          ? 'border-primary-foreground/50 bg-white/10'
          : 'border-primary/50 bg-muted/60'
      )}
    >
      <p className={cn('font-semibold truncate', isMine ? 'text-primary-foreground/80' : 'text-primary')}>
        {replyTo.author?.full_name ?? t('chat.user')}
      </p>
      <p className={cn('truncate opacity-80', isMine ? 'text-primary-foreground' : 'text-foreground/70')}>
        {text}
      </p>
    </div>
  );
}

// ─── Carte produit inline ─────────────────────────────────────────────────────
function ProductCard({
  product,
  isMine,
}: {
  product: ProductAttachment;
  isMine: boolean;
}) {
  return (
    <a
      href={`/annuaire/${product.exposant_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'mt-1.5 flex items-center gap-2.5 rounded-xl border p-2 transition-colors hover:opacity-80',
        isMine
          ? 'border-white/20 bg-white/10'
          : 'border-amber-500/30 bg-amber-500/5'
      )}
    >
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.nom}
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted/80">
          <FileText className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-xs font-semibold', isMine ? 'text-primary-foreground' : 'text-foreground')}>
          {product.nom}
        </p>
        <p className={cn('truncate text-[11px]', isMine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {product.exposant_nom}
        </p>
        {product.prix_indicatif && (
          <p className={cn('text-[11px] font-medium', isMine ? 'text-primary-foreground/80' : 'text-amber-600 dark:text-amber-400')}>
            {product.prix_indicatif}
          </p>
        )}
      </div>
      <ExternalLink className={cn('size-3.5 shrink-0', isMine ? 'text-primary-foreground/50' : 'text-muted-foreground')} />
    </a>
  );
}

// ─── Pièce jointe document ────────────────────────────────────────────────────
function DocumentAttachment({ url, isMine }: { url: string; isMine: boolean }) {
  const filename = url.split('/').pop() ?? 'document';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'mt-1.5 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors hover:opacity-80',
        isMine
          ? 'border-white/20 bg-white/10 text-primary-foreground'
          : 'border-border/50 bg-muted/60 text-foreground'
      )}
    >
      <FileText className="size-4 shrink-0" />
      <span className="truncate flex-1">{filename}</span>
      <ExternalLink className="size-3 shrink-0 opacity-60" />
    </a>
  );
}

// ─── Image en lightbox simple ─────────────────────────────────────────────────
function ImageAttachment({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Photo"
        onClick={() => setOpen(true)}
        className="mt-1 max-h-60 w-auto max-w-[240px] cursor-pointer rounded-xl object-cover ring-1 ring-white/10 transition-opacity hover:opacity-90"
      />
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Photo agrandie"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────
export const MessageBubble = memo(function MessageBubble({ message, isMine, showAvatar, onReply }: MessageBubbleProps) {
  const { t, locale } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn('group flex gap-2 items-end', isMine ? 'flex-row-reverse' : 'flex-row')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      {showAvatar && !isMine ? (
        <Avatar className="size-7 shrink-0 mb-1">
          {message.author?.avatar_url ? (
            <AvatarImage src={message.author.avatar_url} />
          ) : (
            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
              {getInitials(message.author?.full_name)}
            </AvatarFallback>
          )}
        </Avatar>
      ) : (
        <div className="size-7 shrink-0" />
      )}

      {/* Bouton Répondre (hover) */}
      <button
        onClick={() => onReply(message)}
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all',
          'hover:bg-muted hover:text-foreground',
          hovered ? 'opacity-100' : 'opacity-0',
          isMine ? 'order-first' : 'order-last'
        )}
        title={t('chat.reply')}
      >
        <Reply className="size-3.5" />
      </button>

      {/* Bulle */}
      <div
        className={cn(
          'flex flex-col max-w-[72%] animate-in fade-in slide-in-from-bottom-2 duration-200',
          isMine ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
            isMine
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted/80 text-foreground rounded-bl-md ring-1 ring-border/30'
          )}
        >
          {/* Citation */}
          {message.reply_to && (
            <ReplyQuote replyTo={message.reply_to} isMine={isMine} />
          )}

          {/* Image */}
          {message.attachment_type === 'image' && message.attachment_url && (
            <ImageAttachment url={message.attachment_url} />
          )}

          {/* Document */}
          {message.attachment_type === 'document' && message.attachment_url && (
            <DocumentAttachment url={message.attachment_url} isMine={isMine} />
          )}

          {/* Produit */}
          {message.product_attachment && (
            <ProductCard product={message.product_attachment as ProductAttachment} isMine={isMine} />
          )}

          {/* Texte */}
          {message.content && <span>{message.content}</span>}
        </div>

        {/* Heure + statut lecture */}
        <div
          className={cn(
            'flex items-center gap-1.5 mt-0.5 px-1',
            isMine ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="text-[10px] text-muted-foreground/60">
            {formatTime(message.created_at, locale)}
          </span>
          {isMine && (
            <span className="text-[10px]">
              {message.is_read ? (
                <CheckCheck className="size-3 text-blue-500" />
              ) : (
                <Check className="size-3 text-muted-foreground/60" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── DateSeparator ────────────────────────────────────────────────────────────
export function DateSeparator({ date }: { date: string }) {
  const { t, locale } = useTranslation();
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString()) {
    label = t('chat.today');
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = t('chat.yesterday');
  } else {
    label = d.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-border/50" />
      <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}
