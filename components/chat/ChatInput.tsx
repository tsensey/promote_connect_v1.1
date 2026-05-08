import { useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  sending,
  placeholder = 'Ecrivez votre message...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 transition-colors focus-within:border-primary/40 focus-within:bg-muted/50">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none leading-relaxed"
      />
      <Button
        type="button"
        size="icon-sm"
        className="size-9 shrink-0 rounded-full transition-all"
        disabled={!value.trim() || sending}
        onClick={onSend}
      >
        <Send className="size-4" />
      </Button>
    </div>
  );
}
