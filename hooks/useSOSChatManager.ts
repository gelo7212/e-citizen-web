import { useState, useCallback } from 'react';

export interface ChatState {
  sosId: string;
  citizenName?: string;
  isOpen: boolean;
  isMinimized: boolean;
}

/**
 * Hook to manage multiple open SOS chat boxes
 * Similar to Facebook Messenger with multiple conversations
 */
export function useSOSChatManager() {
  const [chats, setChats] = useState<Map<string, ChatState>>(new Map());

  const openChat = useCallback((sosId: string, citizenName?: string) => {
    setChats((prev) => {
      const newChats = new Map(prev);
      if (!newChats.has(sosId)) {
        newChats.set(sosId, {
          sosId,
          citizenName,
          isOpen: true,
          isMinimized: false,
        });
      } else {
        const chat = newChats.get(sosId)!;
        newChats.set(sosId, {
          ...chat,
          isOpen: true,
          isMinimized: false,
        });
      }
      return newChats;
    });
  }, []);

  const closeChat = useCallback((sosId: string) => {
    setChats((prev) => {
      const newChats = new Map(prev);
      newChats.delete(sosId);
      return newChats;
    });
  }, []);

  const toggleMinimize = useCallback((sosId: string) => {
    setChats((prev) => {
      const newChats = new Map(prev);
      const chat = newChats.get(sosId);
      if (chat) {
        newChats.set(sosId, {
          ...chat,
          isMinimized: !chat.isMinimized,
        });
      }
      return newChats;
    });
  }, []);

  const minimizeChat = useCallback((sosId: string) => {
    setChats((prev) => {
      const newChats = new Map(prev);
      const chat = newChats.get(sosId);
      if (chat) {
        newChats.set(sosId, {
          ...chat,
          isMinimized: true,
        });
      }
      return newChats;
    });
  }, []);

  const maximizeChat = useCallback((sosId: string) => {
    setChats((prev) => {
      const newChats = new Map(prev);
      const chat = newChats.get(sosId);
      if (chat) {
        newChats.set(sosId, {
          ...chat,
          isMinimized: false,
        });
      }
      return newChats;
    });
  }, []);

  return {
    chats: Array.from(chats.values()),
    openChat,
    closeChat,
    toggleMinimize,
    minimizeChat,
    maximizeChat,
  };
}
