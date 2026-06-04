'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface Exhibitor {
  id: string;
  nom: string;
  logo_url: string | null;
  profile_id: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onMention?: (exposant: Exhibitor) => void;
  placeholder?: string;
  className?: string;
  authorExposantId?: string; // To prioritize author
  autoFocus?: boolean;
}

export const MentionInput = forwardRef<HTMLInputElement, MentionInputProps>(({
  value,
  onChange,
  onKeyDown,
  onMention,
  placeholder,
  className,
  authorExposantId,
  autoFocus
}, ref) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useImperativeHandle(ref, () => inputRef.current!);

  const setInputRef = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
  }, []);

  // Search exhibitors when search string changes
  useEffect(() => {
    if (!open) return;

    const fetchExhibitors = async () => {
      setLoading(true);
      try {
        let query = supabaseClient
          .from('exposants')
          .select('id, nom, logo_url, profile_id')
          .limit(20);

        if (search) {
          query = query.ilike('nom', `%${search}%`);
        }

        const { data, error } = await query;
        if (!error && data) {
          let results = data as Exhibitor[];

          // Prioritize author if in results
          if (authorExposantId) {
            results = [...results].sort((a, b) => {
              if (a.id === authorExposantId) return -1;
              if (b.id === authorExposantId) return 1;
              return 0;
            });
          }

          setExhibitors(results);
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchExhibitors, 200);
    return () => clearTimeout(timer);
  }, [search, open, authorExposantId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);

    // Detect @ and open popover
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newVal.slice(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(atIndex + 1);

      // If there's a space after @, it's not a mention anymore
      if (textAfterAt.includes(' ')) {
        setOpen(false);
        return;
      }

      const query = textAfterAt;
      // Only trigger if @ is at start or preceded by space
      if (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ') {
        setSearch(query);
        setOpen(true);
        setSelectedIndex(0);
      } else {
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || exhibitors.length === 0) {
      onKeyDown?.(e);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, exhibitors.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (selectedIndex >= 0 && selectedIndex < exhibitors.length) {
        e.preventDefault();
        insertMention(exhibitors[selectedIndex]);
      }
    } else {
      onKeyDown?.(e);
    }
  };

  const insertMention = (exposant: Exhibitor) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);

    const atIndex = textBeforeCursor.lastIndexOf('@');
    const startOfMention = textBeforeCursor.slice(0, atIndex);

    const newValue = `${startOfMention}@${exposant.nom} ${textAfterCursor}`;
    onChange(newValue);
    if (onMention) onMention(exposant);

    // Reset search state completely
    setOpen(false);
    setSearch('');
    setExhibitors([]);

    // Focus back and set cursor
    setTimeout(() => {
      inputRef.current?.focus();
      const newPos = startOfMention.length + exposant.nom.length + 2;
      inputRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="relative flex-1">
      <input
        ref={setInputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-muted/30 transition-all",
          className
        )}
      />
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 z-50">
          <div className="w-full max-h-[200px] overflow-y-auto rounded-xl border border-border/40 bg-popover shadow-md p-1 space-y-0.5">
            {loading && <div className="p-2 text-center text-xs text-muted-foreground">{t('common.loading')}</div>}
            {!loading && exhibitors.length === 0 && (
              <div className="p-2 text-center text-xs text-muted-foreground">{t('common.no_results')}</div>
            )}
            {!loading && exhibitors.length > 0 && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-1">
                {t('chat.exposants')}
              </div>
            )}
            {exhibitors.map((exposant, index) => (
              <button
                key={exposant.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(exposant);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition-colors",
                  index === selectedIndex ? "bg-accent" : "hover:bg-accent"
                )}
              >
                <Avatar className="size-6 shrink-0">
                  <AvatarImage src={exposant.logo_url || undefined} />
                  <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                    {exposant.nom.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate">{exposant.nom}</span>
                  {exposant.id === authorExposantId && (
                    <span className="text-[9px] text-primary font-medium">{t('feed.post.author')}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

MentionInput.displayName = 'MentionInput';
