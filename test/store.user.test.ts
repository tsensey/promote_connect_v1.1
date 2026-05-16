import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from '@/store/userStore';

describe('userStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      preferences: null,
      sidebarCollapsed: false,
    });
  });

  it('sets preferences', () => {
    const prefs = {
      language: 'en' as const,
      notify_messages: false,
      notify_rdv: true,
      notify_newsletter: false,
      notify_feed: true,
      notify_sound: false,
    };
    useUserStore.getState().setPreferences(prefs);
    expect(useUserStore.getState().preferences).toEqual(prefs);
  });

  it('toggles sidebar', () => {
    useUserStore.getState().setSidebarCollapsed(true);
    expect(useUserStore.getState().sidebarCollapsed).toBe(true);
  });

  it('resets state', () => {
    useUserStore.getState().setPreferences({ language: 'en', notify_messages: false, notify_rdv: true, notify_newsletter: true, notify_feed: true, notify_sound: true });
    useUserStore.getState().setSidebarCollapsed(true);
    useUserStore.getState().reset();
    expect(useUserStore.getState().preferences).toBeNull();
    expect(useUserStore.getState().sidebarCollapsed).toBe(false);
  });
});
