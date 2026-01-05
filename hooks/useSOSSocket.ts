'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { willTokenExpireSoon, isTokenExpired, getTokenTimeRemaining } from '@/lib/auth/tokenRotation';
import { refreshAccessToken } from '@/lib/services/authService';

/**
 * WebSocket event payload types
 * Refer to: docs/WEBSOCKET_CONFIG_SOS_ADMIN.md for detailed documentation
 */

export interface LocationBroadcast {
  userId: string;
  sosId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  deviceId: string;
}

export interface MessageBroadcast {
  id: string;
  sosId: string;
  senderType: 'SOS_ADMIN' | 'CITIZEN' | 'RESCUER';
  senderId: string | null;
  senderDisplayName: string;
  contentType: 'text' | 'system';
  content: string;
  createdAt: string;
  timestamp: number;
}

export interface SOSStatusBroadcast {
  sosId: string;
  status: 'ACTIVE' | 'ASSIGNED' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';
  updatedAt: string;
  updatedBy: string;
}

export interface TypingIndicator {
  sosId: string;
  displayName: string;
}

export interface ParticipantEvent {
  userId: string;
  userRole: 'SOS_ADMIN' | 'CITIZEN' | 'RESCUER';
  displayName: string;
  timestamp: number;
}

interface UseSOSSocketOptions {
  token?: string;
  sosId?: string;
  enabled?: boolean;
  onLocationUpdate?: (data: LocationBroadcast) => void;
  onMessageBroadcast?: (data: MessageBroadcast) => void;
  onSOSStatusChange?: (data: SOSStatusBroadcast) => void;
  onTypingStart?: (data: TypingIndicator) => void;
  onTypingStop?: (data: TypingIndicator) => void;
  onParticipantJoined?: (data: ParticipantEvent) => void;
  onParticipantLeft?: (data: ParticipantEvent) => void;
  onError?: (error: any) => void;
}

/**
 * Hook for managing SOS WebSocket connections
 *
 * Provides real-time updates for:
 * - Location broadcasts from responders
 * - Message broadcasts in SOS conversations
 * - SOS status changes
 * - Typing indicators
 * - Participant join/leave events
 *
 * @example
 * ```typescript
 * const { socket, isConnected } = useSOSSocket({
 *   token: jwtToken,
 *   sosId: 'sos-123',
 *   onLocationUpdate: (data) => console.log('Location:', data),
 *   onMessageBroadcast: (data) => console.log('New message:', data),
 * });
 * ```
 *
 * @see docs/WEBSOCKET_CONFIG_SOS_ADMIN.md for WebSocket configuration details
 */
export function useSOSSocket(options: UseSOSSocketOptions) {
  const {
    token,
    sosId,
    enabled = true,
    onLocationUpdate,
    onMessageBroadcast,
    onSOSStatusChange,
    onTypingStart,
    onTypingStop,
    onParticipantJoined,
    onParticipantLeft,
    onError,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectingRef = useRef(false);
  const callbacksRef = useRef({ onLocationUpdate, onMessageBroadcast, onSOSStatusChange, onTypingStart, onTypingStop, onParticipantJoined, onParticipantLeft, onError });

  // Keep callbacks ref in sync
  useEffect(() => {
    callbacksRef.current = {
      onLocationUpdate,
      onMessageBroadcast,
      onSOSStatusChange,
      onTypingStart,
      onTypingStop,
      onParticipantJoined,
      onParticipantLeft,
      onError,
    };
  }, [onLocationUpdate, onMessageBroadcast, onSOSStatusChange, onTypingStart, onTypingStop, onParticipantJoined, onParticipantLeft, onError]);

  const connect = useCallback(async () => {
    // Prevent multiple simultaneous connection attempts
    if (socketRef.current?.connected) {
      console.log('[useSOSSocket] Already connected, skipping reconnect');
      return;
    }

    if (connectingRef.current) {
      console.log('[useSOSSocket] Already connecting, skipping duplicate attempt');
      return;
    }

    if (!enabled) {
      console.warn('[useSOSSocket] WebSocket is disabled');
      return;
    }

    if (!token) {
      console.error('[useSOSSocket] ❌ MISSING TOKEN - User not authenticated or token not loaded');
      setError('AUTHENTICATION_ERROR: Missing token');
      return;
    }

    // Check token expiration before connecting
    if (isTokenExpired(token)) {
      console.warn('[useSOSSocket] ⚠️ Token is expired, attempting refresh...');
      const refreshResult = await refreshAccessToken();
      if (!refreshResult.success || !refreshResult.token) {
        console.error('[useSOSSocket] ❌ Token refresh failed:', refreshResult.error);
        setError('AUTHENTICATION_ERROR: Token refresh failed');
        return;
      }
      console.log('[useSOSSocket] ✅ Token refreshed, will reconnect with new token');
      return;
    }

    // Warn if token will expire soon
    if (willTokenExpireSoon(token)) {
      const timeRemaining = getTokenTimeRemaining(token);
      console.warn(
        `[useSOSSocket] ⚠️ Token will expire in ${timeRemaining ? Math.round(timeRemaining / 1000) : 'unknown'}s`
      );
    }

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      console.log('[useSOSSocket] 🔌 Creating new connection to:', wsUrl);
      
      connectingRef.current = true;
      const newSocket = io(wsUrl, {
        auth: { token },
        query: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
      });

      socketRef.current = newSocket;

      // Setup all event listeners BEFORE connect to ensure they're ready
      // See: docs/WEBSOCKET_CONFIG_SOS_ADMIN.md for event details

      newSocket.on('connect', () => {
        connectingRef.current = false;
        console.log('[useSOSSocket] ✅ Connected to:', wsUrl);
        console.log('[useSOSSocket] Socket ID:', newSocket.id);
        setIsConnected(true);
        setError(null);
        
        // Join SOS room if sosId is provided
        if (sosId) {
          console.log('[useSOSSocket] 🚪 Joining room: sos:' + sosId);
          newSocket.emit('sos:room:join', { 
            sosId, 
            userType: 'SOS_ADMIN',
            displayName: 'SOS Admin'
          });
        }
      });

      newSocket.on('location:broadcast', (data: LocationBroadcast) => {
        console.log('[useSOSSocket] 📍 Location broadcast:', data.sosId);
        callbacksRef.current.onLocationUpdate?.(data);
      });

      newSocket.on('message:broadcast', (data: MessageBroadcast) => {
        console.log('[useSOSSocket] 💬 Message:', data.senderDisplayName, '-', data.content?.substring(0, 30));
        callbacksRef.current.onMessageBroadcast?.(data);
      });

      // Debug: Log ALL events from server to see what's actually being sent
      newSocket.onAny((eventName, ...args) => {
        console.log('[useSOSSocket] 📡 EVENT:', eventName, args);
      });

      newSocket.on('sos:status:broadcast', (data: SOSStatusBroadcast) => {
        console.log('[useSOSSocket] 📊 Status:', data.sosId, '→', data.status);
        callbacksRef.current.onSOSStatusChange?.(data);
      });

      newSocket.on('message:typing:start', (data: TypingIndicator) => {
        console.log('[useSOSSocket] ⌨️ Typing started:', data.displayName);
        callbacksRef.current.onTypingStart?.(data);
      });

      newSocket.on('message:typing:stop', (data: TypingIndicator) => {
        console.log('[useSOSSocket] ⌨️ Typing stopped:', data.displayName);
        callbacksRef.current.onTypingStop?.(data);
      });

      newSocket.on('participant:joined', (data: ParticipantEvent) => {
        console.log('[useSOSSocket] 👤 Joined:', data.displayName);
        callbacksRef.current.onParticipantJoined?.(data);
      });

      newSocket.on('participant:left', (data: ParticipantEvent) => {
        console.log('[useSOSSocket] 👤 Left:', data.displayName);
        callbacksRef.current.onParticipantLeft?.(data);
      });

      newSocket.on('error', (error: any) => {
        console.error('[useSOSSocket] ❌ Error:', error);
        const errorMessage = error.code || error.message || 'WebSocket error';
        setError(errorMessage);
        callbacksRef.current.onError?.(error);
      });

      newSocket.on('disconnect', (reason: string) => {
        connectingRef.current = false;
        console.log('[useSOSSocket] 🔌 Disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error: any) => {
        console.error('[useSOSSocket] ❌ Connection error:', error.message);
        setError(error.message || 'Connection failed');
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      console.error('[useSOSSocket] Exception:', message);
      setError(message);
      callbacksRef.current.onError?.(err);
    }
  }, [enabled, token, sosId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  const joinRoom = useCallback((roomSosId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('sos:room:join', { 
        sosId: roomSosId,
        userType: 'SOS_ADMIN',
        displayName: 'SOS Admin'
      });
    }
  }, []);

  const leaveRoom = useCallback((roomSosId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-room', { sosId: roomSosId });
    }
  }, []);

  const emitTypingStart = useCallback((roomSosId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:typing:start', { sosId: roomSosId });
    }
  }, []);

  const emitTypingStop = useCallback((roomSosId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:typing:stop', { sosId: roomSosId });
    }
  }, []);

  useEffect(() => {
    // Only connect if enabled and we have a token
    if (!enabled || !token) {
      if (socketRef.current?.connected) {
        console.log('[useSOSSocket] Cleaning up - disabled or no token');
        socketRef.current.disconnect();
      }
      return;
    }

    console.log('[useSOSSocket] Initiating connection');
    connect();

    // Cleanup on unmount or when dependencies change
    return () => {
      if (socketRef.current?.connected) {
        console.log('[useSOSSocket] Cleaning up connection');
        socketRef.current.disconnect();
        setIsConnected(false);
      }
    };
  }, [enabled, token, sosId]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    joinRoom,
    leaveRoom,
    emitTypingStart,
    emitTypingStop,
  };
}
