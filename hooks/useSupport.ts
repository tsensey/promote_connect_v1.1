import { useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
type SupportMessage = Database['public']['Tables']['support_messages']['Row'];

export function useSupportTickets() {
  const [tickets, setTickets] = useState<(SupportTicket & { message_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchTickets = async () => {
      try {
        const { data: session } = await supabaseClient.auth.getSession();
        const myId = session?.session?.user?.id;
        if (!myId) return;

        const { data, error } = await supabaseClient
          .from('support_tickets')
          .select('*')
          .eq('profile_id', myId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!mounted) return;

        const ticketsWithCount = await Promise.all(
          (data || []).map(async (ticket) => {
            const { count } = await supabaseClient
              .from('support_messages')
              .select('*', { count: 'exact', head: true })
              .eq('ticket_id', ticket.id);
            return { ...ticket, message_count: count || 0 };
          })
        );

        if (mounted) setTickets(ticketsWithCount);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTickets();

    const channel = supabaseClient
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabaseClient.removeChannel(channel);
    };
  }, []);

  const createTicket = useCallback(
    async (subject: string, description: string, priority: string) => {
      const { data: session } = await supabaseClient.auth.getSession();
      const myId = session?.session?.user?.id;
      if (!myId) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('support_tickets')
        .insert({
          profile_id: myId,
          subject,
          description,
          priority,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    []
  );

  return { tickets, loading, error, createTicket };
}

export function useTicketMessages(ticketId: string) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [{ data: ticketData }, { data: messagesData }] = await Promise.all([
          supabaseClient.from('support_tickets').select('*').eq('id', ticketId).single(),
          supabaseClient
            .from('support_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true }),
        ]);

        if (!mounted) return;

        if (ticketData) setTicket(ticketData);
        setMessages(messagesData || []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    const channel = supabaseClient
      .channel(`ticket-messages-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as SupportMessage]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_tickets', filter: `id=eq.${ticketId}` },
        (payload) => {
          setTicket(payload.new as SupportTicket);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabaseClient.removeChannel(channel);
    };
  }, [ticketId]);

  const sendMessage = useCallback(
    async (content: string, isAdmin = false) => {
      if (!content.trim()) return;

      const { data: session } = await supabaseClient.auth.getSession();
      if (!session?.session?.user) return;

      const { data, error } = await supabaseClient
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: session.session.user.id,
          content: content.trim(),
          is_admin: isAdmin,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => [...prev, data as SupportMessage]);
      }

      await supabaseClient
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString(), status: 'open' })
        .eq('id', ticketId);
    },
    [ticketId, setMessages]
  );

  return { messages, ticket, loading, error, sendMessage };
}
