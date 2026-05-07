'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useConversations, createConversation } from '@/hooks/useChat';
import { supabaseClient } from '@/lib/supabase/client';
import { MessageSquare, Plus, Search, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ExposantSearch {
  id: string;
  nom: string;
  profile_id: string | null;
}

export default function ChatPage() {
  const router = useRouter();
  const { conversations, loading, error } = useConversations();
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exposants, setExposants] = useState<ExposantSearch[]>([]);

  useEffect(() => {
    const fetchExposants = async () => {
      const { data } = await supabaseClient
        .from('exposants')
        .select('id, nom, profile_id');
      if (data) setExposants(data);
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
    exp.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Chat prive</h1>
              <p className="mt-1 text-sm text-muted-foreground">Discutez en direct avec vos contacts PROMOTE de maniere securisee et confidentielle.</p>
            </div>
            <Button
              onClick={() => setShowNewChat(!showNewChat)}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Nouveau chat
            </Button>
          </div>

          {showNewChat && (
            <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher un exposant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {filteredExposants.map((exp) => (
                  <Button
                    key={exp.profile_id || exp.id}
                    variant="secondary"
                    size="sm"
                    onClick={() => exp.profile_id && handleNewChat(exp.profile_id)}
                    disabled={!exp.profile_id}
                    className="w-full justify-start text-left"
                  >
                    {exp.nom}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardContent className="pt-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Conversations ({conversations.length})
            </h2>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">Erreur: {error instanceof Error ? error.message : String(error)}</p>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune conversation pour le moment.</p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    className="group flex items-start gap-2.5 rounded-md p-2 text-left transition hover:bg-muted"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-muted text-xs font-medium">
                        {conv.other_user?.full_name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {conv.other_user?.full_name || conv.other_user?.company || 'Conversation'}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge className="flex-shrink-0 h-5 min-w-5 rounded-full bg-primary p-0 text-xs text-primary-foreground">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                        {conv.last_message_content && (
                          <span className="truncate">{conv.last_message_content}</span>
                        )}
                        {!conv.last_message_content && conv.last_message_at && (
                          <>
                            <Clock className="h-3 w-3" />
                            {new Date(conv.last_message_at).toLocaleDateString('fr-FR')}
                          </>
                        )}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 pt-5 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Selectionnez une conversation pour afficher l'historique et envoyer un nouveau message.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
