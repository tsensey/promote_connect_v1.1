import { useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { uploadChatFile } from '@/lib/chat/storage';
import type { Database } from '@/types/database.types';
import type {
  EnrichedConversation,
  EnrichedMessage,
  ChatContact,
  ProductAttachment,
} from '@/types/chat';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export { type ProductAttachment, type EnrichedConversation, type EnrichedMessage, type ChatContact };

export function useContacts() {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const myId = session?.session?.user?.id;
      if (myId) setMyUserId(myId);

      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('id, full_name, company, avatar_url, role')
        .neq('id', myId ?? '')
        .in('role', ['exposant', 'visiteur']);

      if (!profiles) return;

      const { data: exposants } = await supabaseClient
        .from('exposants')
        .select('id, profile_id, nom, logo_url');

      const exposantByProfile = new Map<string, { id: string; nom: string; logo_url: string | null }>();
      for (const exp of exposants ?? []) {
        if (exp.profile_id) {
          exposantByProfile.set(exp.profile_id, { id: exp.id, nom: exp.nom, logo_url: exp.logo_url });
        }
      }

      const result: ChatContact[] = profiles.map((p) => {
        const exp = exposantByProfile.get(p.id);
        return {
          profile_id: p.id,
          display_name: p.full_name ?? 'Utilisateur',
          company: exp ? exp.nom : p.company,
          avatar_url: exp ? exp.logo_url : p.avatar_url,
          role: p.role,
          exposant_id: exp ? exp.id : null,
          exposant_logo: exp ? exp.logo_url : null,
        };
      });

      setContacts(result);
    } finally {
      setLoading(false);
    }
  }, []);

  return { contacts, loading, myUserId, load };
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
          .select('*, participant_a:participant_a(*), participant_b:participant_b(*)')
          .or(`participant_a.eq.${myId},participant_b.eq.${myId}`)
          .order('last_message_at', { ascending: false });

        if (error) throw error;
        if (!mounted) return;

        const convs = (data || []) as (Conversation & {
          participant_a: Profile | null;
          participant_b: Profile | null;
        })[];

        const otherIds = convs.map((c) =>
          c.participant_a?.id === myId ? c.participant_b?.id : c.participant_a?.id
        ).filter(Boolean) as string[];

        const exposantMap = new Map<string, { nom: string; logo_url: string | null }>();
        if (otherIds.length > 0) {
          const { data: exps } = await supabaseClient
            .from('exposants')
            .select('profile_id, nom, logo_url')
            .in('profile_id', otherIds);
          for (const e of exps ?? []) {
            if (e.profile_id) exposantMap.set(e.profile_id, { nom: e.nom, logo_url: e.logo_url });
          }
        }

        const enriched: EnrichedConversation[] = convs.map((conv) => {
          const otherUser = conv.participant_a?.id === myId ? conv.participant_b : conv.participant_a;
          const exp = otherUser?.id ? exposantMap.get(otherUser.id) : undefined;
          return {
            ...conv,
            other_user: otherUser,
            other_exposant_nom: exp?.nom ?? null,
            other_exposant_logo: exp?.logo_url ?? null,
            last_message_content: null,
            unread_count: 0,
          };
        });

        if (enriched.length > 0) {
          const convIds = enriched.map((c) => c.id);

          const [{ data: lastMessages }, { data: unreadCounts }] = await Promise.all([
            supabaseClient
              .from('messages')
              .select('conversation_id, content, created_at, attachment_type, product_attachment')
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
                let preview = msg.content;
                if (!preview && msg.attachment_type === 'image') preview = '📷 Photo';
                else if (!preview && msg.attachment_type === 'document') preview = '📄 Document';
                else if (msg.product_attachment) preview = `🏷️ ${(msg.product_attachment as ProductAttachment).nom}`;
                lastMsgByConv.set(msg.conversation_id, preview || '');
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, () => { fetchConversations(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => { fetchConversations(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => { fetchConversations(); })
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
  const [otherExposant, setOtherExposant] = useState<{ nom: string; logo_url: string | null } | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    let presenceChannel: ReturnType<typeof supabaseClient.channel> | null = null;

    const setup = async () => {
      try {
        const { data: session } = await supabaseClient.auth.getSession();
        if (!mounted) return;
        const myId = session?.session?.user?.id;
        if (myId) setMyUserId(myId);

        let other: Profile | null = null;
        const { data: convData } = await supabaseClient
          .from('conversations')
          .select('*, participant_a:participant_a(*), participant_b:participant_b(*)')
          .eq('id', conversationId)
          .single();

        if (convData && mounted) {
          const conv = convData as Conversation & {
            participant_a: Profile | null;
            participant_b: Profile | null;
          };
          other = conv.participant_a?.id === myId ? conv.participant_b : conv.participant_a;
          setOtherUser(other);

          if (other?.id) {
            const { data: expData } = await supabaseClient
              .from('exposants')
              .select('nom, logo_url')
              .eq('profile_id', other.id)
              .maybeSingle();
            if (expData && mounted) setOtherExposant(expData);
          }
        }

        let fetchedMessages: EnrichedMessage[] = [];
        try {
          const { data: enrichedData, error: enrichedError } = await supabaseClient
            .from('messages')
            .select(`
              *,
              author:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
              reply_to:reply_to_id(
                id, content, attachment_type,
                author:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)
              )
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

          if (enrichedError) throw enrichedError;
          fetchedMessages = (enrichedData || []) as unknown as EnrichedMessage[];
        } catch {
          const { data: basicData, error: basicError } = await supabaseClient
            .from('messages')
            .select('*, author:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

          if (basicError) throw basicError;
          fetchedMessages = ((basicData || []) as unknown as EnrichedMessage[]).map((m) => ({
            ...m,
            reply_to: null,
          }));
        }

        if (mounted) setMessages(fetchedMessages);
        if (!mounted) return;

        channel = supabaseClient
          .channel(`messages-${conversationId}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, async (payload) => {
            const newMsg = payload.new as Message;
            let fullMsg: EnrichedMessage | null = null;
            try {
              const { data: enriched } = await supabaseClient
                .from('messages')
                .select('*, author:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role), reply_to:reply_to_id(id, content, attachment_type, author:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role))')
                .eq('id', newMsg.id)
                .single();
              if (enriched) fullMsg = enriched as unknown as EnrichedMessage;
            } catch {
              const { data: basic } = await supabaseClient
                .from('messages')
                .select('*, author:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)')
                .eq('id', newMsg.id)
                .single();
              if (basic) fullMsg = { ...(basic as unknown as EnrichedMessage), reply_to: null };
            }
            if (fullMsg) setMessages((prev) => [...prev, fullMsg!]);
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id
                  ? { ...(payload.new as Message), author: msg.author, reply_to: msg.reply_to } as EnrichedMessage
                  : msg
              )
            );
          })
          .subscribe();

        presenceChannel = supabaseClient.channel(`presence-${conversationId}`, {
          config: { presence: { key: myId || 'anon' } },
        });

        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel!.presenceState<{ typing: boolean; userId: string }>();
            let isTyping = false;
            for (const key of Object.keys(state)) {
              if (state[key][0]?.typing && state[key][0]?.userId !== myId) {
                isTyping = true;
                break;
              }
            }
            setTypingUser(isTyping ? other?.id || 'typing' : null);
          })
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED' && myId) {
              await presenceChannel!.track({ typing: false, userId: myId });
            }
          });

      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (channel) supabaseClient.removeChannel(channel);
      if (presenceChannel) supabaseClient.removeChannel(presenceChannel);
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
    async (opts: {
      content: string;
      file?: File | null;
      replyToId?: string | null;
      productAttachment?: ProductAttachment | null;
    }) => {
      const { content, file, replyToId, productAttachment } = opts;
      if (!content.trim() && !file && !productAttachment) return;

      const { data: session } = await supabaseClient.auth.getSession();
      if (!session?.session?.user) return;
      const myId = session.session.user.id;

      let attachmentUrl: string | null = null;
      let attachmentType: 'image' | 'document' | 'product' | null = null;

      if (file) {
        const result = await uploadChatFile(conversationId, file);
        if (result) {
          attachmentUrl = result.url;
          attachmentType = result.type;
        }
      } else if (productAttachment) {
        attachmentType = 'product';
      }

      const { error } = await supabaseClient.from('messages').insert({
        conversation_id: conversationId,
        sender_id: myId,
        content: content.trim(),
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        reply_to_id: replyToId ?? null,
        product_attachment: productAttachment ?? null,
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

  const sendTypingEvent = useCallback(
    async (isTyping: boolean) => {
      if (!myUserId) return;
      const ch = supabaseClient.getChannels().find((c) => c.topic === `realtime:presence-${conversationId}`);
      if (ch) {
        await ch.track({ typing: isTyping, userId: myUserId });
      }
    },
    [conversationId, myUserId]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    myUserId,
    otherUser,
    otherExposant,
    typingUser,
    sendTypingEvent,
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
