import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { EnrichedMessage } from '@/hooks/useChat';

interface MessageBubbleProps {
  message: EnrichedMessage;
  isMine: boolean;
  showAvatar: boolean;
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string | null | undefined) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function MessageBubble({ message, isMine, showAvatar }: MessageBubbleProps) {
  return (
    <div
      className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end animate-in fade-in slide-in-from-bottom-2 duration-200`}
    >
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

      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isMine
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted/80 text-foreground rounded-bl-md ring-1 ring-border/30'
          }`}
        >
          {message.content}
        </div>

        <div className={`flex items-center gap-1.5 mt-0.5 ${isMine ? 'flex-row-reverse' : 'flex-row'} px-1`}>
          <span className="text-[10px] text-muted-foreground/60">
            {formatTime(message.created_at)}
          </span>
          {isMine && (
            <span className="text-[10px]">
              {message.is_read ? (
                <span className="text-blue-500">Lu</span>
              ) : (
                <span className="text-muted-foreground/40">Envoye</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString()) {
    label = "Aujourd'hui";
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = 'Hier';
  } else {
    label = d.toLocaleDateString('fr-FR', {
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
