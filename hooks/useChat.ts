import { useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface EnrichedConversation extends Conversation {
  other_user: Profile | null;
  last_message_content: string | null;
  unread_count: number;
}

export interface EnrichedMessage extends Message {
  author: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'> | null;
}

export function useConversations() {
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchConversations = async () => {
      try {
        const { data: session } = await supabaseClient.auth.getSession();
        const myId = session?.session?.user?.id;
        if (!myId) return;
        if (mounted) setMyUserId(myId);

        const { data, error } = await supabaseClient
          .from('conversations')
          .select(`
            *,
            participant_a:participant_a(*),
            participant_b:participant_b(*)
          `)
          .or(`participant_a.eq.${myId},participant_b.eq.${myId}`)
          .order('last_message_at', { ascending: false });

        if (error) throw error;
        if (!mounted) return;

        const convs = (data || []) as (Conversation & {
          participant_a: Profile | null;
          participant_b: Profile | null;
        })[];

        const enriched: EnrichedConversation[] = convs.map((conv) => ({
          ...conv,
          other_user: conv.participant_a?.id === myId ? conv.participant_b : conv.participant_a,
          last_message_content: null,
          unread_count: 0,
        }));

        if (enriched.length > 0) {
          const convIds = enriched.map((c) => c.id);

          const [{ data: lastMessages }, { data: unreadCounts }] = await Promise.all([
            supabaseClient
              .from('messages')
              .select('conversation_id, content, sender_id, created_at')
              .in('conversation_id', convIds)
              .order('created_at', { ascending: false }),

            supabaseClient
              .from('messages')
              .select('conversation_id')
              .in('conversation_id', convIds)
              .eq('is_read', false)
              .neq('sender_id', myId),
          ]);

          if (!mounted) return;

          const lastMsgByConv = new Map<string, string>();
          if (lastMessages) {
            for (const msg of lastMessages) {
              if (!lastMsgByConv.has(msg.conversation_id)) {
                lastMsgByConv.set(msg.conversation_id, msg.content);
              }
            }
          }

          const unreadByConv = new Map<string, number>();
          if (unreadCounts) {
            for (const row of unreadCounts) {
              unreadByConv.set(row.conversation_id, (unreadByConv.get(row.conversation_id) || 0) + 1);
            }
          }

          enriched.forEach((conv) => {
            conv.last_message_content = lastMsgByConv.get(conv.id) || null;
            conv.unread_count = unreadByConv.get(conv.id) || 0;
          });
        }

        setConversations(enriched);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchConversations();

    const channel = supabaseClient
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        () => { fetchConversations(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => { fetchConversations(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { fetchConversations(); }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabaseClient.removeChannel(channel);
    };
  }, []);

  return { conversations, loading, error, myUserId };
}

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMessages = async () => {
      try {
        const { data: session } = await supabaseClient.auth.getSession();
        if (!mounted) return;
        const myId = session?.session?.user?.id;
        if (myId) setMyUserId(myId);

        const { data: convData } = await supabaseClient
          .from('conversations')
          .select(`
            *,
            participant_a:participant_a(*),
            participant_b:participant_b(*)
          `)
          .eq('id', conversationId)
          .single();

        if (convData && mounted) {
          const conv = convData as Conversation & {
            participant_a: Profile | null;
            participant_b: Profile | null;
          };
          const other = conv.participant_a?.id === myId ? conv.participant_b : conv.participant_a;
          setOtherUser(other);
        }

        const { data, error } = await supabaseClient
          .from('messages')
          .select(`
            *,
            author:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (mounted) setMessages((data || []) as EnrichedMessage[]);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMessages();

    const channel = supabaseClient
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const { data: author } = await supabaseClient
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .eq('id', newMsg.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, author } as EnrichedMessage,
          ]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id
                ? { ...(payload.new as Message), author: msg.author }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabaseClient.removeChannel(channel);
    };
  }, [conversationId]);

  const markAsRead = useCallback(async () => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    await supabaseClient
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', myId)
      .eq('is_read', false);
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const { data: session } = await supabaseClient.auth.getSession();
      if (!session?.session?.user) return;

      const { error } = await supabaseClient.from('messages').insert({
        conversation_id: conversationId,
        sender_id: session.session.user.id,
        content: content.trim(),
        is_read: false,
      });

      if (error) return;

      await supabaseClient
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    },
    [conversationId]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    myUserId,
    otherUser,
  };
}

export async function createConversation(otherUserId: string) {
  const { data: session } = await supabaseClient.auth.getSession();
  if (!session?.session?.user) return { error: new Error('Not authenticated') };

  const myId = session.session.user.id;
  const [a, b] = [myId, otherUserId].sort();

  const { data, error } = await supabaseClient
    .from('conversations')
    .upsert({ participant_a: a, participant_b: b }, { onConflict: 'participant_a,participant_b' })
    .select()
    .single();

  return { data, error };
}
