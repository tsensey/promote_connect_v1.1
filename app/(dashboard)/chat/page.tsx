"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useConversations, createConversation } from "@/hooks/useChat";
import { supabaseClient } from "@/lib/supabase/client";
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ExposantSearch {
  id: string;
  nom: string;
  profile_id: string | null;
  logo_url?: string | null;
}

function formatLastSeen(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (diff < 60000) return "A l'instant";
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
  if (days < 2) return "Hier";
  return format(d, "dd MMM", { locale: fr });
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "..." : text;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const activeConvId = params?.conversationId as string | undefined;
  const { conversations, loading } = useConversations();
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [exposants, setExposants] = useState<ExposantSearch[]>([]);
  const [searchingExposants, setSearchingExposants] = useState(false);

  useEffect(() => {
    const fetchExposants = async () => {
      setSearchingExposants(true);
      const { data } = await supabaseClient
        .from("exposants")
        .select("id, nom, profile_id, logo_url");
      if (data) setExposants(data);
      setSearchingExposants(false);
    };
    fetchExposants();
  }, []);

  const handleNewChat = async (profileId: string) => {
    const { data } = await createConversation(profileId);
    if (data) {
      setShowNewChat(false);
      router.push(`/chat/${data.id}`);
    }
  };

  const filteredExposants = exposants.filter((exp) =>
    exp.nom.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="mx-auto">
      <div className="lg:grid lg:gap-0 lg:grid-cols-[360px_1fr] lg:rounded-xl lg:border lg:border-border/60 lg:overflow-hidden">
        <div className="border-border/60 lg:border-r">
          <div className="flex items-center justify-between gap-2 p-4 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              Conversations ({conversations.length})
            </h2>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowNewChat(!showNewChat)}
              className="rounded-lg"
            >
              <Plus className="mr-1 size-3.5" />
              Nouveau
            </Button>
          </div>

          {showNewChat && (
            <div className="mx-3 mb-3 rounded-xl border border-border/60 bg-muted/30 p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher un exposant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 rounded-lg border-border/60 bg-background pl-9 text-sm"
                />
              </div>
              <div className="max-h-48 space-y-0.5 overflow-y-auto">
                {searchingExposants ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredExposants.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Aucun exposant trouve
                  </p>
                ) : (
                  filteredExposants.map((exp) => (
                    <button
                      key={exp.profile_id || exp.id}
                      onClick={() =>
                        exp.profile_id && handleNewChat(exp.profile_id)
                      }
                      disabled={!exp.profile_id}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted/70 disabled:opacity-40"
                    >
                      <Avatar className="size-7 shrink-0">
                        {exp.logo_url ? (
                          <AvatarImage src={exp.logo_url} />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                            {exp.nom.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="font-medium truncate">{exp.nom}</span>
                      {!exp.profile_id && (
                        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                          Non inscrit
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div
            className="overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 20rem)" }}
          >
            {loading ? (
              <div className="space-y-1 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center px-6">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Send className="size-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Aucune conversation pour le moment.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewChat(true)}
                  className="rounded-lg"
                >
                  <Plus className="mr-1 size-3.5" />
                  Demarrer un chat
                </Button>
              </div>
            ) : (
              <div className="space-y-0.5 p-2">
                {conversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  return (
                    <Link
                      key={conv.id}
                      href={`/chat/${conv.id}`}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl p-3 transition-all",
                        isActive
                          ? "bg-primary/10 ring-1 ring-primary/20"
                          : "hover:bg-muted/60",
                      )}
                    >
                      <Avatar className="size-10 shrink-0 ring-2 ring-border/30">
                        {conv.other_user?.avatar_url ? (
                          <AvatarImage src={conv.other_user.avatar_url} />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {getInitials(conv.other_user?.full_name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {conv.other_user?.full_name ||
                              conv.other_user?.company ||
                              "Conversation"}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {conv.last_message_at && (
                              <span className="text-[10px] text-muted-foreground/50">
                                {formatLastSeen(conv.last_message_at)}
                              </span>
                            )}
                            <ChevronRight className="size-3 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors" />
                          </div>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="truncate text-xs text-muted-foreground/70 flex-1">
                            {conv.last_message_content ? (
                              truncate(conv.last_message_content, 60)
                            ) : (
                              <span className="italic opacity-50">
                                Nouvelle conversation
                              </span>
                            )}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge className="shrink-0 rounded-full bg-primary px-1.5 py-0 text-[10px] text-primary-foreground font-semibold min-w-[18px] flex items-center justify-center">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-center justify-center py-16 text-center px-8">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/5">
            <MessageSquare className="size-8 text-primary/30" />
          </div>
          <p className="mt-4 text-lg font-heading font-semibold text-foreground">
            Selectionnez une conversation
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Choisissez une conversation dans la liste de gauche pour afficher
            l&apos;historique et envoyer un nouveau message.
          </p>
        </div>
      </div>
    </div>
  );
}
