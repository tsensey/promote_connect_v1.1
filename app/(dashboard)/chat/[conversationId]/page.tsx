"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMessages } from "@/hooks/useChat";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

type ConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export default function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = use(params);
  const { messages, loading, error, sendMessage, markAsRead, myUserId } =
    useMessages(conversationId);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    markAsRead();
  }, [conversationId, markAsRead]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    await sendMessage(newMessage);
    setNewMessage("");
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Card className="p-4 rounded-lg">
          <div className="h-8 w-1/3 animate-pulse rounded-md bg-muted" />
        </Card>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`h-12 w-3/4 animate-pulse rounded-lg bg-muted ${i % 2 === 0 ? "ml-auto" : ""}`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto">
        <Card className="p-4 rounded-lg bg-red-50 text-red-700">
          Erreur : {error.message}
        </Card>
      </div>
    );
  }

  return (
    <Card className="flex h-[calc(100vh-8rem)] flex-col bg-muted p-0">
      <header className="border-b border-border bg-white py-3 px-2">
        <div className="mx-auto flex items-center gap-3">
          <Link href="/chat">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Conversation
            </h1>
            <p className="text-sm text-muted-foreground">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-3">
          {messages.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">
                Aucun message. Envoyez le premier message !
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.sender_id === myUserId}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="border-t border-border bg-white px-4 py-3 sm:px-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl flex gap-3">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ecrivez votre message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border-border bg-background focus:border-blue-500 focus:ring-blue-500"
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-full"
            disabled={!newMessage.trim() || sending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </Card>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: {
    id: string;
    sender_id: string;
    content: string;
    created_at: string | null;
    is_read: boolean;
  };
  isMine: boolean;
}) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-3 ${
          isMine
            ? "bg-slate-900 text-white"
            : "bg-white text-slate-900 shadow-sm"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <p
          className={`mt-1 text-xs ${isMine ? "text-slate-400" : "text-muted-foreground"}`}
        >
          {message.created_at
            ? new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </p>
      </div>
    </div>
  );
}
