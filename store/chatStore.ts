import { create } from 'zustand';
import type { EnrichedConversation } from '@/hooks/useChat';

interface ChatState {
  conversations: EnrichedConversation[];
  activeConversationId: string | null;
  unreadCount: number;
  setConversations: (conversations: EnrichedConversation[]) => void;
  setActiveConversationId: (id: string | null) => void;
  setUnreadCount: (count: number) => void;
  clearUnreadForConversation: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  unreadCount: 0,
  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  clearUnreadForConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    })),
}));
