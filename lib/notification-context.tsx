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
    company: string | null;
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
  dismissNotification: (notificationId: string) => void;
  clearNotifications: () => void;
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
        sender:profiles!notifications_sender_id_fkey(full_name, avatar_url, company)
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
      setNotifications([]);
      setUnreadNotificationsCount(0);
    }
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => {
      const removed = prev.find(n => n.id === notificationId);
      if (removed && !removed.is_read) {
        setUnreadNotificationsCount(c => Math.max(0, c - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadNotificationsCount(0);
  };

  useEffect(() => {
    let mounted = true;
    const safeFetch = async () => { 
      if (mounted) {
        await Promise.all([fetchUnreadCount(), fetchNotifications()]);
      }
    };

    safeFetch();

    const channel = supabaseClient
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (!mounted) return;
          const newNotif = payload.new as Notification;
          supabaseClient.auth.getSession().then(({ data: session }) => {
            const myId = session?.session?.user?.id;
            if (!myId || newNotif.profile_id !== myId) return;

            if (newNotif.sender_id) {
              supabaseClient
                .from('profiles')
                .select('full_name, avatar_url, company')
                .eq('id', newNotif.sender_id)
                .single()
                .then(({ data: sender }) => {
                  if (!mounted) return;
                  setNotifications(prev =>
                    prev.some(n => n.id === newNotif.id)
                      ? prev
                      : [{ ...newNotif, sender: sender ?? undefined } as Notification, ...prev]
                  );
                  if (!newNotif.is_read) {
                    setUnreadNotificationsCount(prev => prev + 1);
                  }
                });
            } else {
              setNotifications(prev =>
                prev.some(n => n.id === newNotif.id)
                  ? prev
                  : [newNotif as Notification, ...prev]
              );
              if (!newNotif.is_read) {
                setUnreadNotificationsCount(prev => prev + 1);
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabaseClient.removeChannel(channel);
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
      markAllAsRead,
      dismissNotification,
      clearNotifications
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
