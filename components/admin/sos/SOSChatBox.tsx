'use client';

import { useState, useEffect } from 'react';
import { useSOS } from '@/hooks/useSOS';
import SOSMessageThread from './SOSMessageThread';

interface SOSChatBoxProps {
  sosId: string;
  citizenName?: string;
  isOpen?: boolean;
  isMinimized?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  position?: number;
}

/**
 * Floating Chat Box Component
 * 
 * Facebook-like chat widget that can be minimized/expanded at the bottom right.
 * Supports multiple instances with real-time messaging via WebSocket.
 *
 * Features:
 * - Real-time message updates via `message:broadcast` WebSocket event
 * - Minimizable/maximizable interface
 * - Message history display
 * - Live connection indicator
 *
 * @see {@link docs/WEBSOCKET_CONFIG_SOS_ADMIN.md} for WebSocket configuration details
 */
export default function SOSChatBox({
  sosId,
  citizenName = 'SOS Conversation',
  isOpen = true,
  isMinimized = false,
  onClose,
  onMinimize,
  position = 0,
}: SOSChatBoxProps) {
  const { messages } = useSOS();
  const [localIsOpen, setLocalIsOpen] = useState(isOpen);
  const [localIsMinimized, setLocalIsMinimized] = useState(isMinimized);

  const unreadCount = messages?.length || 0;

  const handleClose = () => {
    setLocalIsOpen(false);
    onClose?.();
  };

  const handleMinimize = () => {
    const newMinimized = !localIsMinimized;
    setLocalIsMinimized(newMinimized);
    onMinimize?.();
  };

  const handleExpand = () => {
    setLocalIsOpen(true);
    setLocalIsMinimized(false);
  };

  // For standalone use (when not managed by SOSChatManager)
  if (!onClose && !onMinimize) {
    return (
      <div className="fixed bottom-4 right-4 z-40 flex flex-col">
        {/* Minimized State */}
        {localIsMinimized && (
          <button
            onClick={handleExpand}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 mb-3"
          >
            <div className="relative">
              <span className="text-2xl">💬</span>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </button>
        )}

        {/* Expanded State */}
        {!localIsMinimized && localIsOpen && (
          <div className="w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200 overflow-hidden mb-3">
            {/* Header */}
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <div>
                  <h3 className="font-semibold text-sm">{citizenName}</h3>
                  <p className="text-xs text-blue-100">{unreadCount} message{unreadCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleMinimize}
                  className="hover:bg-blue-700 p-1 rounded transition"
                  title="Minimize"
                >
                  <span className="text-lg">−</span>
                </button>
                <button
                  onClick={handleClose}
                  className="hover:bg-blue-700 p-1 rounded transition"
                  title="Close"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-hidden">
              <SOSMessageThread sosId={sosId} />
            </div>
          </div>
        )}

        {/* Closed State - Show notification icon */}
        {!localIsOpen && !localIsMinimized && (
          <button
            onClick={handleExpand}
            className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
            title="Open chat"
          >
            <div className="relative">
              <span className="text-2xl">✉️</span>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </button>
        )}
      </div>
    );
  }

  // For managed use (when used with SOSChatManager)
  return (
    <div className="flex flex-col">
      {/* Minimized State */}
      {localIsMinimized && (
        <button
          onClick={handleExpand}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 mb-2"
          title={citizenName}
        >
          <div className="relative">
            <span className="text-xl">💬</span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center text-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Expanded State */}
      {!localIsMinimized && (
        <div className="w-80 h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex-1">
              <h3 className="font-semibold text-sm truncate">{citizenName}</h3>
              <p className="text-xs text-blue-100">{unreadCount} msg</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleMinimize}
                className="hover:bg-blue-700 p-1 rounded transition"
                title="Minimize"
              >
                <span className="text-sm">−</span>
              </button>
              <button
                onClick={handleClose}
                className="hover:bg-blue-700 p-1 rounded transition"
                title="Close"
              >
                <span className="text-sm">×</span>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-hidden">
            <SOSMessageThread sosId={sosId} />
          </div>
        </div>
      )}
    </div>
  );
}
