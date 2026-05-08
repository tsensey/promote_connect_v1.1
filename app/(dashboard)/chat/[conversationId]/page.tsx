"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import Link from "next/link";
import { useMessages } from "@/hooks/useChat";
import { MessageBubble, DateSeparator } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MessageSquare,
  BadgeCheck,
} from "lucide-react";

type ConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function shouldShowDateSeparator(
  current: string | null,
  previous: string | null
): boolean {
  if (!current) return false;
  if (!previous) return true;
  const cur = new Date(current);
  const prev = new Date(previous);
  return (
    cur.getDate() !== prev.getDate() ||
    cur.getMonth() !== prev.getMonth() ||
    cur.getFullYear() !== prev.getFullYear()
  );
}

function shouldShowAvatar(
  index: number,
  messages: { sender_id: string; created_at: string | null }[]
): boolean {
  if (index === 0) return true;
  const current = messages[index];
  const previous = messages[index - 1];
  if (current.sender_id !== previous.sender_id) return true;
  const diff =
    new Date(current.created_at || 0).getTime() -
    new Date(previous.created_at || 0).getTime();
  return diff > 120000;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = use(params);
  const {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    myUserId,
    otherUser,
  } = useMessages(conversationId);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    markAsRead();
  }, [conversationId, markAsRead]);

  const scrollToBottom = useCallback(
    (force = false) => {
      if (!force && !autoScroll) return;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    [autoScroll]
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 100;
    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setAutoScroll(isNearBottom);
  }, []);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    await sendMessage(newMessage);
    setNewMessage("");
    setSending(false);
    setAutoScroll(true);
  }, [newMessage, sending, sendMessage]);

  if (loading) {
    return (
      <div className="mx-auto space-y-4">
        <div className="h-14 animate-pulse rounded-xl bg-muted/60" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`h-14 w-3/4 animate-pulse rounded-xl bg-muted/50 ${
                i % 2 === 0 ? "ml-auto" : ""
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto ">
        <Card className="border-border/60">
          <div className="p-6 text-center text-destructive">
            Erreur : {error.message}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col rounded-xl border border-border/60 bg-card overflow-hidden md:-mx-6 md:-my-4 -mx-2 -my-4">
      <header className="flex items-center gap-3 border-b border-border/50 bg-muted/20 px-4 py-3 shrink-0">
        <Link
          href="/chat"
          className="lg:hidden"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Button>
        </Link>

        <Avatar className="size-9 shrink-0 ring-2 ring-border/20">
          {otherUser?.avatar_url ? (
            <AvatarImage src={otherUser.avatar_url} />
          ) : (
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(otherUser?.full_name)}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-sm font-semibold text-foreground">
              {otherUser?.full_name || otherUser?.company || "Conversation"}
            </h1>
            {otherUser?.role === "exposant" && (
              <BadgeCheck className="size-4 shrink-0 text-blue-500" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-1"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted/50">
              <MessageSquare className="size-6 text-muted-foreground/30" />
            </div>
            <p className="mt-3 text-base font-medium text-foreground">
              Aucun message
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Envoyez le premier message pour demarrer la conversation.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div key={msg.id}>
                {shouldShowDateSeparator(
                  msg.created_at,
                  messages[index - 1]?.created_at || null
                ) && <DateSeparator date={msg.created_at || ""} />}

                <MessageBubble
                  message={msg}
                  isMine={msg.sender_id === myUserId}
                  showAvatar={shouldShowAvatar(index, messages)}
                />
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="border-t border-border/50 bg-muted/10 px-4 py-3 shrink-0">
        <ChatInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSend}
          sending={sending}
          placeholder="Ecrivez votre message... (Enter pour envoyer)"
        />
      </footer>
    </div>
  );
}
