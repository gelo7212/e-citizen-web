'use client';

import { useSOSChatManager, ChatState } from '@/hooks/useSOSChatManager';
import SOSChatBox from './SOSChatBox';

/**
 * SOS Chat Manager Component
 * Manages multiple floating chat boxes similar to Facebook Messenger
 * Can be placed in layout or specific pages
 */
export default function SOSChatManager() {
  const { chats, closeChat, toggleMinimize } = useSOSChatManager();

  if (chats.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex gap-3 flex-wrap justify-end items-end">
      {chats.map((chat, index) => (
        <SOSChatBox
          key={chat.sosId}
          sosId={chat.sosId}
          citizenName={chat.citizenName}
          isOpen={chat.isOpen}
          isMinimized={chat.isMinimized}
          onClose={() => closeChat(chat.sosId)}
          onMinimize={() => toggleMinimize(chat.sosId)}
          position={index}
        />
      ))}
    </div>
  );
}
