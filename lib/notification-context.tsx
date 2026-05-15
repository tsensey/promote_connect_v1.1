'use client';

import { createContext, useContext, useState } from 'react';

interface NotificationContextValue {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

const notificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationStateProvider({ children }: { children: React.ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  return (
    <notificationContext.Provider value={{ activeConversationId, setActiveConversationId }}>
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
