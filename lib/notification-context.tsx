'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

interface NotificationContextValue {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  unreadMessages: number;
  refreshUnreadCount: () => Promise<void>;
}

const notificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationStateProvider({ children }: { children: React.ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchUnreadCount = async () => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    const { data: convs } = await supabaseClient
      .from('conversations')
      .select('id')
      .or(`participant_a.eq.${myId},participant_b.eq.${myId}`);

    if (!convs || convs.length === 0) {
      setUnreadMessages(0);
      return;
    }

    const convIds = convs.map(c => c.id);
    const { count } = await supabaseClient
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('is_read', false)
      .neq('sender_id', myId);

    setUnreadMessages(count ?? 0);
  };

  useEffect(() => {
    let mounted = true;
    const safeFetch = async () => { if (mounted) await fetchUnreadCount(); };

    safeFetch();

    const channel = supabaseClient
      .channel('unread-counts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => safeFetch()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: 'is_read=eq.true' },
        () => safeFetch()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabaseClient.removeChannel(channel);
    };
  }, []);

  return (
    <notificationContext.Provider value={{ activeConversationId, setActiveConversationId, unreadMessages, refreshUnreadCount: fetchUnreadCount }}>
      {children}
    </notificationContext.Provider>
  );
}

export function useNotificationState() {
  const context = useContext(notificationContext);
  if (!context) {
    throw new Error('useNotificationState must be used within NotificationStateProvider');
  }
  return context;
}
