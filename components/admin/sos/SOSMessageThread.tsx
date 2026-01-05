'use client';

import { useState, useEffect, useRef } from 'react';
import { useSOS } from '@/hooks/useSOS';
import { useAuth } from '@/hooks/useAuth';
import { useSOSSocket, MessageBroadcast } from '@/hooks/useSOSSocket';

interface SOSMessageProps {
  sosId: string;
}

/**
 * SOS Message Thread Component
 *
 * Displays conversation thread and allows admins to message citizens/rescuers.
 * Uses WebSocket for real-time message broadcasts from other participants.
 *
 * WebSocket Events:
 * - `message:broadcast` - Receives new messages from other participants
 * - `message:typing:start` - Indicates when someone is typing
 * - `message:typing:stop` - Indicates when someone stopped typing
 *
 * @see {@link docs/WEBSOCKET_CONFIG_SOS_ADMIN.md} for WebSocket configuration details
 */
export default function SOSMessageThread({ sosId }: SOSMessageProps) {
  const { user, token } = useAuth();
  const { messages, sendMessage, fetchMessages, isLoading, error } = useSOS();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [rtMessages, setRtMessages] = useState<MessageBroadcast[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // WebSocket connection for real-time updates
  // See: docs/WEBSOCKET_CONFIG_SOS_ADMIN.md for event documentation
  const { isConnected: wsConnected } = useSOSSocket({
    token: token || undefined,
    sosId,
    enabled: !!token, // Only enable when token is available
    onMessageBroadcast: (data: MessageBroadcast) => {
      console.log('[SOSMessageThread] 💬 Received message broadcast:', {
        id: data.id,
        sender: data.senderDisplayName,
        content: data.content,
      });
      // Avoid duplicate messages - check if already in messages or rtMessages
      const isDuplicate = 
        messages?.some((msg) => msg.id === data.id) ||
        rtMessages.some((msg) => msg.id === data.id);
      
      if (!isDuplicate) {
        setRtMessages((prev) => [...prev, data]);
      } else {
        console.log('[SOSMessageThread] ⚠️ Duplicate message received, skipping:', data.id);
      }
    },
    onError: (error) => {
      console.error('[SOSMessageThread] WebSocket error:', error);
    },
  });

  // Log when component mounts and connection status changes
  useEffect(() => {
    console.log('[SOSMessageThread] Chat opened:', { sosId, wsConnected, token: !!token });
  }, [sosId, wsConnected, token]);

  // Load messages on component mount
  useEffect(() => {
    fetchMessages(sosId);
  }, [sosId, fetchMessages]);

  // Auto-scroll to bottom on mount and when messages change
  useEffect(() => {
    // Scroll to bottom immediately for initial load
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };
    
    // Use requestAnimationFrame to ensure DOM is ready
    const timer = setTimeout(scrollToBottom, 0);
    return () => clearTimeout(timer);
  }, [messages]);

  // Smooth scroll for new real-time messages
  useEffect(() => {
    if (rtMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [rtMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user) return;

    setIsSending(true);
    try {
      const result = await sendMessage(sosId, {
        senderType: 'SOS_ADMIN',
        senderId: user.id,
        senderDisplayName: `Admin (${user.role})`,
        contentType: 'text',
        content: messageText,
        cityId: user.cityCode,
      });

      if (result) {
        setMessageText('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType?.toLowerCase()) {
      case 'citizen':
        return { bg: 'bg-blue-500', text: 'text-white' };
      case 'sos_admin':
      case 'admin':
        return { bg: 'bg-green-600', text: 'text-white' };
      case 'rescuer':
        return { bg: 'bg-orange-500', text: 'text-white' };
      default:
        return { bg: 'bg-gray-600', text: 'text-white' };
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType?.toLowerCase()) {
      case 'citizen':
        return '👤';
      case 'sos_admin':
      case 'admin':
        return '👨‍💼';
      case 'rescuer':
        return '🚑';
      default:
        return '💬';
    }
  };

  // Sort messages by timestamp (oldest first, newest last)
  const sortedMessages = messages ? [...messages].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }) : [];

  const sortedRtMessages = [...rtMessages].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Messages Header */}
      <div className="px-2 py-2 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {(sortedMessages.length || 0) + sortedRtMessages.length > 0 
            ? `${(sortedMessages.length || 0) + sortedRtMessages.length} message${(sortedMessages.length || 0) + sortedRtMessages.length !== 1 ? 's' : ''}`
            : 'No messages yet'}
        </p>
        {wsConnected && <span className="text-xs text-green-600 flex items-center gap-1">🟢 Live</span>}
      </div>

      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {isLoading && (!messages || messages.length === 0) && rtMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : (sortedMessages.length === 0) && sortedRtMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-lg">💭</p>
              <p className="text-gray-500 mt-2">No messages yet.</p>
              <p className="text-sm text-gray-400">Start the conversation using the input below.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Historical messages - sorted oldest to newest */}
            {sortedMessages.map((msg) => {
              const isAdmin = msg.senderType?.toLowerCase() === 'sos_admin' || msg.senderType?.toLowerCase() === 'admin';
              const colors = getSenderColor(msg.senderType);
              
              return (
                <div
                  key={`hist-${msg.id}`}
                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} gap-2 items-end`}
                >
                  <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div
                      className={`max-w-sm px-3 py-2 rounded-md ${colors.bg} text-sm`}
                    >
                      <p className="text-white break-words">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Real-time messages from WebSocket - sorted oldest to newest */}
            {sortedRtMessages.map((msg) => {
              const isAdmin = msg.senderType?.toLowerCase() === 'sos_admin' || msg.senderType?.toLowerCase() === 'admin';
              const colors = getSenderColor(msg.senderType);
              
              return (
                <div
                  key={`rt-${msg.id}`}
                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} gap-2 items-end animate-fade-in`}
                >
                  <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div
                      className={`max-w-sm px-3 py-2 rounded-md ${colors.bg} text-sm`}
                    >
                      <p className="text-white break-words">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-2 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your reply..."
            disabled={isSending}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 text-sm"
          />
          <button
            type="submit"
            disabled={isSending || !messageText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition text-sm whitespace-nowrap"
          >
            {isSending ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Sending...
              </>
            ) : (
              '✉️ Send'
            )}
          </button>
        </div>
        {messageText.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">{messageText.length} characters</p>
        )}
      </form>
    </div>
  );
}
