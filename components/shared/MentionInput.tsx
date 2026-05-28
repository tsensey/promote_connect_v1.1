'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent } from '@/components/ui/popover';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation();

  useImperativeHandle(ref, () => inputRef.current!);

  const setInputRef = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
    anchorRef.current = el;
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
      const query = textBeforeCursor.slice(atIndex + 1);
      // Only trigger if @ is at start or preceded by space
      if (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ') {
        setSearch(query);
        setOpen(true);
      } else {
        setOpen(false);
      }
    } else {
      setOpen(false);
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
    setOpen(false);
    
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
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-muted/30 transition-all",
          className
        )}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverContent 
          className="p-0 w-[280px] border-border/40" 
          align="start" 
          side="top"
          sideOffset={4}
          anchor={anchorRef}
        >
          <Command className="rounded-xl overflow-hidden">
            <CommandList>
              {loading && <div className="p-2 text-center text-xs text-muted-foreground">{t('common.loading')}</div>}
              {!loading && exhibitors.length === 0 && <CommandEmpty>{t('common.no_results')}</CommandEmpty>}
              <CommandGroup heading={t('chat.exposants')}>
                {exhibitors.map((exposant) => (
                  <CommandItem
                    key={exposant.id}
                    onSelect={() => insertMention(exposant)}
                    className="flex items-center gap-2 p-2 cursor-pointer"
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={exposant.logo_url || undefined} />
                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                        {exposant.nom.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{exposant.nom}</span>
                      {exposant.id === authorExposantId && (
                        <span className="text-[9px] text-primary font-medium">{t('feed.post.author')}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
});

MentionInput.displayName = 'MentionInput';
