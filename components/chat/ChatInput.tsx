import { useRef, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, X } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach?: (file: File) => void;
  sending?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onAttach,
  sending,
  placeholder = 'Ecrivez votre message...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSend = () => {
    if (selectedFile && onAttach) {
      onAttach(selectedFile);
      setSelectedFile(null);
    } else {
      onSend();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {selectedFile && (
        <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-2 text-sm w-max border border-border/60">
          <Paperclip className="size-4 text-muted-foreground" />
          <span className="max-w-[200px] truncate text-foreground">{selectedFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedFile(null)}
            className="size-6 text-muted-foreground hover:text-destructive"
          >
            <X className="size-3" />
          </Button>
        </div>
      )}
      <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 transition-colors focus-within:border-primary/40 focus-within:bg-muted/50">
        {onAttach && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="size-4" />
            </Button>
          </>
        )}
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
        disabled={(!value.trim() && !selectedFile) || sending}
        onClick={handleSend}
      >
        <Send className="size-4" />
      </Button>
    </div>
    </div>
  );
}
