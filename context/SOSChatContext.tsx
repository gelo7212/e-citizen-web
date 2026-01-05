'use client';

import { createContext, useContext } from 'react';
import { useSOSChatManager } from '@/hooks/useSOSChatManager';

interface SOSChatContextType {
  openChat: (sosId: string, citizenName?: string) => void;
  closeChat: (sosId: string) => void;
  toggleMinimize: (sosId: string) => void;
}

const SOSChatContext = createContext<SOSChatContextType | undefined>(undefined);

/**
 * Provider component for managing SOS chats globally
 * Wrap your app layout with this to enable chat functionality everywhere
 */
export function SOSChatProvider({ children }: { children: React.ReactNode }) {
  const { openChat, closeChat, toggleMinimize } = useSOSChatManager();

  return (
    <SOSChatContext.Provider value={{ openChat, closeChat, toggleMinimize }}>
      {children}
    </SOSChatContext.Provider>
  );
}

/**
 * Hook to access chat manager from anywhere in the app
 */
export function useSOSChat() {
  const context = useContext(SOSChatContext);
  if (!context) {
    throw new Error('useSOSChat must be used within SOSChatProvider');
  }
  return context;
}
