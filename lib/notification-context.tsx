'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

export interface Notification {
  id: string;
  profile_id: string;
  sender_id: string;
  type: string;
  data: any;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string;
  };
}

interface NotificationContextValue {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  unreadMessages: number;
  notifications: Notification[];
  unreadNotificationsCount: number;
  refreshUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const notificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationStateProvider({ children }: { children: React.ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

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

  const fetchNotifications = async () => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    const { data, error } = await supabaseClient
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey(full_name, avatar_url)
      `)
      .eq('profile_id', myId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data as Notification[]);
      setUnreadNotificationsCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabaseClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { data: session } = await supabaseClient.auth.getSession();
    const myId = session?.session?.user?.id;
    if (!myId) return;

    const { error } = await supabaseClient
      .from('notifications')
      .update({ is_read: true })
      .eq('profile_id', myId)
      .eq('is_read', false);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotificationsCount(0);
    }
  };

  useEffect(() => {
    let mounted = true;
    const safeFetch = async () => { 
      if (mounted) {
        await Promise.all([fetchUnreadCount(), fetchNotifications()]);
      }
    };

    safeFetch();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <notificationContext.Provider value={{ 
      activeConversationId, 
      setActiveConversationId, 
      unreadMessages, 
      notifications,
      unreadNotificationsCount,
      refreshUnreadCount: fetchUnreadCount,
      refreshNotifications: fetchNotifications,
      markAsRead,
      markAllAsRead
    }}>
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
