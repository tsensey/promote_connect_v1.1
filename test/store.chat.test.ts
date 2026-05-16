import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '@/store/chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: [],
      activeConversationId: null,
      unreadCount: 0,
    });
  });

  it('sets conversations', () => {
    const convs: Parameters<ReturnType<typeof useChatStore.getState>['setConversations']>[0] = [{ id: '1', unread_count: 0 }];
    useChatStore.getState().setConversations(convs);
    expect(useChatStore.getState().conversations).toEqual(convs);
  });

  it('sets active conversation id', () => {
    useChatStore.getState().setActiveConversationId('abc');
    expect(useChatStore.getState().activeConversationId).toBe('abc');
  });

  it('clears unread count for a conversation', () => {
    useChatStore.getState().setConversations([
      { id: '1', unread_count: 5 },
      { id: '2', unread_count: 3 },
    ]);
    useChatStore.getState().clearUnreadForConversation('1');
    const conv = useChatStore.getState().conversations.find((c) => c.id === '1');
    expect(conv?.unread_count).toBe(0);
  });
});
