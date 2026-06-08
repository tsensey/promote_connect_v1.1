'use client';

import Image from 'next/image';
import { memo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, Reply, FileText, ExternalLink, X, Loader2, Trash2, Ban } from 'lucide-react';
import type { EnrichedMessage, ProductAttachment } from '@/hooks/useChat';
import { cn, getValidImageUrl } from '@/lib/utils';
import { sanitizeHTML, sanitizeText } from '@/lib/sanitize';
import { useTranslation } from '@/lib/i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MessageBubbleProps {
  message: EnrichedMessage;
  isMine: boolean;
  showAvatar: boolean;
  onReply: (message: EnrichedMessage) => void;
  onDelete?: (messageId: string) => void;
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
        {sanitizeText(text)}
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
        <Image
          src={getValidImageUrl(product.image_url)}
          alt={product.nom}
          width={48}
          height={48}
          className="shrink-0 rounded-lg object-cover"
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
      <div className="relative mt-1 h-48 w-48 sm:h-60 sm:w-60">
        <Image
          src={getValidImageUrl(url)}
          alt="Photo"
          onClick={() => setOpen(true)}
          fill
          sizes="(max-width: 640px) 192px, 240px"
          className="cursor-pointer rounded-xl object-cover ring-1 ring-white/10 transition-opacity hover:opacity-90"
        />
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <X className="size-6" />
          </button>
          <div className="relative h-[90vh] w-[90vw]">
            <Image
              src={getValidImageUrl(url)}
              alt="Photo agrandie"
              fill
              sizes="90vw"
              className="rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────
export const MessageBubble = memo(function MessageBubble({ message, isMine, showAvatar, onReply, onDelete }: MessageBubbleProps) {
  const { t, locale } = useTranslation();

  if (message.is_deleted) {
    return (
      <div className={cn('flex gap-2 items-end mb-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
        <div className="size-7 shrink-0" />
        <div className={cn('rounded-2xl px-4 py-2.5 text-sm italic bg-muted/50 text-muted-foreground flex items-center gap-2', isMine ? 'rounded-br-md' : 'rounded-bl-md ring-1 ring-border/30')}>
          <Ban className="size-4 opacity-50" />
          {t('chat.message_deleted') || 'Ce message a été supprimé'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('group flex gap-2 items-end', isMine ? 'flex-row-reverse' : 'flex-row')}
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

      {/* Boutons d'action (hover) */}
      <div
        className={cn(
          'flex items-center gap-1 transition-all',
          'opacity-100 lg:opacity-0 lg:group-hover:opacity-100',
          isMine ? 'order-first flex-row-reverse' : 'order-last flex-row'
        )}
      >
        <button
          onClick={() => onReply(message)}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          title={t('chat.reply') || 'Répondre'}
        >
          <Reply className="size-3.5" />
        </button>
        {isMine && onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                title={t('chat.delete_confirm_action') || 'Supprimer'}
              >
                <Trash2 className="size-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('chat.delete_confirm_title') || 'Supprimer le message ?'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('chat.delete_confirm_desc') || 'Cette action est irréversible. Le message sera effacé de la conversation.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel') || 'Annuler'}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(message.id)}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {t('chat.delete_confirm_action') || 'Supprimer'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

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
            <ProductCard product={message.product_attachment as unknown as ProductAttachment} isMine={isMine} />
          )}

          {/* Texte */}
          {message.content && <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(message.content) }} />}
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
              {(() => {
                const status = (message as any).status;
                if (status === 'read') return <CheckCheck className="size-3 text-blue-500" />;
                if (status === 'delivered') return <CheckCheck className="size-3 text-muted-foreground/60" />;
                if (status === 'sending') return <span className="size-3 text-muted-foreground/30"><Loader2 className="size-3 animate-spin" /></span>;
                return <Check className="size-3 text-muted-foreground/60" />; // 'sent' ou fallback
              })()}
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
