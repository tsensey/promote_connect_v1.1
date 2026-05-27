'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MessageSquare, Search, ArrowLeft, Plus, Loader2, X, Building2, User, MoreVertical, Ban, ShieldAlert, ShieldBan,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatInput, type SendOptions } from '@/components/chat/ChatInput';
import { MessageBubble, DateSeparator } from '@/components/chat/MessageBubble';
import {
  useConversations, useMessages, useContacts, createConversation,
  type EnrichedMessage, type ProductAttachment,
} from '@/hooks/useChat';
import { useNotificationState } from '@/lib/notification-context';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { getInitials, formatRelativeTime, isSameDay } from '@/lib/chat/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { usePermissions } from '@/hooks/usePermissions';
import { Crown } from 'lucide-react';

// ─── Panneau liste des conversations ──────────────────────────────────────────
function ConversationList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t, locale } = useTranslation();
  const { conversations, loading } = useConversations();
  const { contacts, loading: loadingContacts, load: loadContacts } = useContacts();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [creating, setCreating] = useState<string | null>(null);
  const [contactTab, setContactTab] = useState<'exposant' | 'visiteur'>('exposant');

  // Charger les contacts quand on ouvre le panneau
  useEffect(() => {
    if (showNew && contacts.length === 0) loadContacts();
  }, [showNew, contacts.length, loadContacts]);

  const handleStartConversation = async (profileId: string) => {
    setCreating(profileId);
    const { data } = await createConversation(profileId);
    setCreating(null);
    if (data) {
      setShowNew(false);
      setContactSearch('');
      onSelect(data.id);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchTab = c.role === contactTab;
    const q = contactSearch.toLowerCase();
    const matchSearch =
      c.display_name.toLowerCase().includes(q) ||
      (c.company?.toLowerCase().includes(q) ?? false);
    return matchTab && matchSearch;
  });

  const filtered = conversations.filter((conv) => {
    const name = conv.other_user?.full_name?.toLowerCase() ?? '';
    const company = (conv.other_exposant_nom ?? conv.other_user?.company ?? '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || company.includes(q);
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-base font-semibold text-foreground">{t('chat.title')}</h1>
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-lg px-2.5 text-xs"
            onClick={() => setShowNew((v) => !v)}
          >
            {showNew ? <X className="mr-1 size-3.5" /> : <Plus className="mr-1 size-3.5" />}
            {showNew ? t('chat.close') : t('chat.new_chat')}
          </Button>
        </div>

        {/* Panneau Nouveau chat */}
        {showNew && (
          <div className="mb-3 rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
            {/* Onglets Exposant / Visiteur */}
            <div className="flex gap-1 rounded-lg bg-muted/50 p-0.5">
              <button
                onClick={() => setContactTab('exposant')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  contactTab === 'exposant'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Building2 className="size-3.5" />
                {t('chat.exposants_tab')}
              </button>
              <button
                onClick={() => setContactTab('visiteur')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  contactTab === 'visiteur'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <User className="size-3.5" />
                {t('chat.visitors_tab')}
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('chat.search_contacts', { tab: contactTab })}
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {loadingContacts ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  {t('chat.no_contacts', { tab: contactTab })}
                </p>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.profile_id}
                    disabled={creating === contact.profile_id}
                    onClick={() => handleStartConversation(contact.profile_id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/70 disabled:opacity-50"
                  >
                    <Avatar className="size-8 shrink-0">
                      {contact.avatar_url ? (
                        <AvatarImage src={contact.avatar_url} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                          {getInitials(contact.display_name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">{contact.display_name}</p>
                      {contact.company && (
                        <p className="truncate text-[11px] text-muted-foreground">{contact.company}</p>
                      )}
                    </div>
                    {creating === contact.profile_id && (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Recherche conversations */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('chat.search_conversation')}
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse gap-3">
                <div className="size-10 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-2.5 w-48 rounded bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <MessageSquare className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? t('chat.no_conversation_found') : t('chat.no_conversation_yet')}
            </p>
            {!search && (
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setShowNew(true)}>
                <Plus className="mr-1 size-3.5" />
                {t('chat.start_chat')}
              </Button>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const other = conv.other_user;
            const isSelected = conv.id === selectedId;
            const isUnread = conv.unread_count > 0;
            const displayName = conv.other_exposant_nom ?? other?.full_name ?? t('chat.default_user_name');
            const subName = conv.other_exposant_nom ? other?.full_name : (other?.company ?? null);
            const avatarUrl = conv.other_exposant_logo ?? other?.avatar_url;

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50',
                  isSelected && 'bg-primary/8 border-r-2 border-r-primary'
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="size-10">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {isUnread && (
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn('truncate text-sm', isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
                      {displayName}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground/60">
                      {formatRelativeTime(conv.last_message_at, t, locale)}
                    </span>
                  </div>
                  {subName && (
                    <p className="truncate text-[11px] text-muted-foreground/70">{subName}</p>
                  )}
                  {conv.last_message_content && (
                    <p className={cn('truncate text-xs', isUnread ? 'font-medium text-foreground/70' : 'text-muted-foreground/60')}>
                      {conv.last_message_content}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Thread (fil de messages) ─────────────────────────────────────────────────
function MessageThread({
  conversationId,
  onBack,
  initialProduct,
}: {
  conversationId: string;
  onBack: () => void;
  initialProduct?: ProductAttachment | null;
}) {
  const { t } = useTranslation();
  const {
    messages, loading, sendMessage, markAsRead, myUserId,
    otherUser, otherExposant, typingUser, sendTypingEvent,
  } = useMessages(conversationId);
  const { refreshUnreadCount } = useNotificationState();
  const { blockUser, unblockUser, isBlocked, loadBlockedUsers } = useBlockedUsers();
  const perms = usePermissions();

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<EnrichedMessage | null>(null);
  const [productContext, setProductContext] = useState<ProductAttachment | null>(initialProduct ?? null);
  const [blocking, setBlocking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const otherUserId = otherUser?.id;
  const isCurrentlyBlocked = otherUserId ? isBlocked(otherUserId) : false;

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  useEffect(() => {
    // Scroll vers le message cible si un hash est présent
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-primary', 'rounded-xl');
            setTimeout(() => element.classList.remove('ring-2', 'ring-primary', 'rounded-xl'), 3000);
          }
        }, 100);
      } else {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  useEffect(() => {
    (async () => {
      await markAsRead();
      await refreshUnreadCount();
    })();
  }, [markAsRead, refreshUnreadCount, conversationId]);

  const handleBlock = async () => {
    if (!otherUserId) return;
    setBlocking(true);
    const { error } = await blockUser(otherUserId, 'harassment');
    if (!error) toast.success(t('chat.block_success'));
    setBlocking(false);
  };

  const handleUnblock = async () => {
    if (!otherUserId) return;
    setBlocking(true);
    const { error } = await unblockUser(otherUserId);
    if (!error) toast.success(t('chat.unblock_success'));
    setBlocking(false);
  };

  const handleSend = useCallback(
    async (opts: SendOptions) => {
      if (!opts.content.trim() && !opts.file && !opts.productAttachment) return;
      setSending(true);
      setInputValue('');
      setReplyTo(null);
      setProductContext(null);
      await sendMessage(opts);
      setSending(false);
      void sendTypingEvent(false);
    },
    [sendMessage, sendTypingEvent]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      void sendTypingEvent(isTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => sendTypingEvent(false), 3000);
      }
    },
    [sendTypingEvent]
  );

  const displayName = otherExposant?.nom ?? otherUser?.full_name ?? t('chat.default_conversation_name');
  const subName = otherExposant ? otherUser?.full_name : otherUser?.company;
  const avatarUrl = otherExposant?.logo_url ?? otherUser?.avatar_url;

  return (
    <div className="flex h-full flex-col">
      {/* En-tête du fil */}
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3.5">
        <button
          onClick={onBack}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:hidden"
        >
          <ArrowLeft className="size-4" />
        </button>
        <Avatar className="size-9 shrink-0">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} />
          ) : (
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          {subName && <p className="truncate text-xs text-muted-foreground">{subName}</p>}
        </div>
        {otherExposant && (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {t('chat.exposant_badge')}
          </Badge>
        )}
        {otherUserId && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <MoreVertical className="size-4" />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
              {isCurrentlyBlocked ? (
                <DropdownMenuItem
                  onClick={handleUnblock}
                  disabled={blocking || !perms.canBlockUsers}
                  className="rounded-lg text-destructive focus:text-destructive"
                >
                  <Ban className="mr-2 size-4" />
                  {t('chat.unblock_user')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={handleBlock}
                  disabled={blocking || !perms.canBlockUsers}
                  className="rounded-lg text-destructive focus:text-destructive"
                >
                  <ShieldAlert className="mr-2 size-4" />
                  {t('chat.block_user')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isCurrentlyBlocked ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
              <ShieldBan className="size-8 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('chat.user_blocked', { name: displayName })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('chat.user_blocked_desc')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnblock}
              disabled={blocking}
              className="rounded-xl"
            >
              <Ban className="mr-1.5 size-3.5" />
              {t('chat.unblock_user')}
            </Button>
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <MessageSquare className="size-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t('chat.start_conversation')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const showDateSeparator = !prev || !isSameDay(prev.created_at ?? '', msg.created_at ?? '');
              const showAvatar = !prev || prev.sender_id !== msg.sender_id || showDateSeparator;

              return (
                <div key={msg.id} id={msg.id}>
                  {showDateSeparator && msg.created_at && (
                    <DateSeparator date={msg.created_at} />
                  )}
                  <MessageBubble
                    message={msg}
                    isMine={msg.sender_id === myUserId}
                    showAvatar={showAvatar}
                    onReply={setReplyTo}
                  />
                </div>
              );
            })}

            {/* Indicateur de saisie */}
            {typingUser && (
              <div className="flex items-center gap-2 py-1 pl-9">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground/60">{t('chat.typing')}</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {!isCurrentlyBlocked && (
        <div className="border-t border-border/50 p-3">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            onTyping={handleTyping}
            sending={sending}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            productContext={productContext}
            onCancelProduct={() => setProductContext(null)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <MessageSquare className="size-8 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{t('chat.select_conversation')}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('chat.select_conversation_hint')}
        </p>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setActiveConversationId } = useNotificationState();
  const initialConv = searchParams.get('conv');
  const perms = usePermissions();

  // Produit pré-attaché depuis la vitrine (?product=<base64json>)
  const productParam = searchParams.get('product');
  const initialProduct: ProductAttachment | null = (() => {
    if (!productParam) return null;
    try {
      return JSON.parse(atob(productParam)) as ProductAttachment;
    } catch {
      return null;
    }
  })();

  const [selectedId, setSelectedId] = useState<string | null>(initialConv);
  const [mobileShowThread, setMobileShowThread] = useState(!!initialConv);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileShowThread(true);
    router.replace(`/chat?conv=${id}`, { scroll: false });
  };

  const handleBack = () => {
    setMobileShowThread(false);
    setActiveConversationId(null);
  };

  useEffect(() => {
    setActiveConversationId(selectedId);
  }, [selectedId, setActiveConversationId]);

  if (!perms.canUseChat) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-amber-500/10">
            <Crown className="size-10 text-amber-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Accès Premium requis</h2>
          <p className="mb-6 text-muted-foreground">
            La messagerie est réservée aux visiteurs Premium et aux exposants.
            Passez à l&apos;offre Premium pour contacter les exposants et échanger avec eux.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="-mx-4 -mt-6 flex overflow-hidden rounded-none border-0 sm:-mx-6 xl:-mx-8"
      style={{ height: 'calc(100dvh - 64px)' }}
    >
      {/* Liste des conversations */}
      <div
        className={cn(
          'w-full shrink-0 border-r border-border/50 xl:w-80',
          mobileShowThread && 'hidden xl:flex xl:flex-col',
          !mobileShowThread && 'flex flex-col'
        )}
      >
        <ConversationList selectedId={selectedId} onSelect={handleSelect} />
      </div>

      {/* Fil de messages */}
      <div
        className={cn(
          'flex-1',
          mobileShowThread ? 'flex flex-col' : 'hidden xl:flex xl:flex-col'
        )}
      >
        {selectedId ? (
          <MessageThread
            key={selectedId}
            conversationId={selectedId}
            onBack={handleBack}
            initialProduct={initialProduct}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
