'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type WebSocketCallback = (data: any) => void;
type WebSocketErrorCallback = (error: Event) => void;

interface UseWebSocketOptions {
  url: string;
  onMessage?: WebSocketCallback;
  onError?: WebSocketErrorCallback;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(options.url);

      ws.current.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        options.onOpen?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          options.onMessage?.(data);
        } catch (error) {
          options.onMessage?.(event.data);
        }
      };

      ws.current.onerror = (error) => {
        setIsConnected(false);
        options.onError?.(error);
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        options.onClose?.();

        // Attempt reconnection
        if (
          reconnectAttempts.current <
          (options.maxReconnectAttempts || 5)
        ) {
          reconnectAttempts.current++;
          reconnectTimeout.current = setTimeout(
            () => connect(),
            options.reconnectInterval || 3000
          );
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [options]);

  const send = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (ws.current) {
      ws.current.close();
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    send,
    disconnect,
  };
}
