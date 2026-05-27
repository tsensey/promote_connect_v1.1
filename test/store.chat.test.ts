import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '@/store/chatStore';
import type { EnrichedConversation } from '@/types/chat';

function createMockConversation(id: string, unread: number): EnrichedConversation {
  return {
    id,
    unread_count: unread,
    participant_a: null,
    participant_b: null,
    last_message_at: null,
    created_at: new Date().toISOString(),
    other_user: null,
    other_exposant_nom: null,
    other_exposant_logo: null,
    last_message_content: null,
    initiated_by: null,
    initiated_by_tier: null,
  };
}

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: [],
      activeConversationId: null,
      unreadCount: 0,
    });
  });

  it('sets conversations', () => {
    const convs = [createMockConversation('1', 0)];
    useChatStore.getState().setConversations(convs);
    expect(useChatStore.getState().conversations).toEqual(convs);
  });

  it('sets active conversation id', () => {
    useChatStore.getState().setActiveConversationId('abc');
    expect(useChatStore.getState().activeConversationId).toBe('abc');
  });

  it('clears unread count for a conversation', () => {
    useChatStore.getState().setConversations([
      createMockConversation('1', 5),
      createMockConversation('2', 3),
    ]);
    useChatStore.getState().clearUnreadForConversation('1');
    const conv = useChatStore.getState().conversations.find((c) => c.id === '1');
    expect(conv?.unread_count).toBe(0);
  });
});
