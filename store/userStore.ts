import { create } from 'zustand';

interface UserPreferences {
  language: 'fr' | 'en';
  notify_messages: boolean;
  notify_rdv: boolean;
  notify_newsletter: boolean;
  notify_feed: boolean;
  notify_sound: boolean;
}

interface UserState {
  preferences: UserPreferences | null;
  sidebarCollapsed: boolean;
  setPreferences: (prefs: UserPreferences) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  preferences: null,
  sidebarCollapsed: false,
  setPreferences: (preferences) => set({ preferences }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  reset: () => set({ preferences: null, sidebarCollapsed: false }),
}));
