# SOS WebSocket Integration Guide

This guide explains how to use real-time messaging and location tracking in the SOS Admin module.

## Overview

The SOS Admin uses WebSocket connections (Socket.IO) to receive real-time updates for:
- **Location broadcasts** - Live responder tracking
- **Message broadcasts** - Real-time SOS conversation messages
- **Status updates** - SOS request status changes
- **Typing indicators** - Shows when participants are typing

For detailed WebSocket configuration, refer to: [`docs/WEBSOCKET_CONFIG_SOS_ADMIN.md`](../../docs/WEBSOCKET_CONFIG_SOS_ADMIN.md)

---

## Using the `useSOSSocket` Hook

### Basic Usage

```typescript
import { useSOSSocket } from '@/hooks/useSOSSocket';

export function MyComponent({ sosId }: { sosId: string }) {
  const { socket, isConnected, error } = useSOSSocket({
    token: jwtToken,
    sosId: sosId,
    enabled: true,
    onLocationUpdate: (data) => {
      console.log('New responder location:', data);
    },
    onMessageBroadcast: (data) => {
      console.log('New message:', data);
    },
  });

  return <div>{isConnected ? '🟢 Connected' : '⚪ Disconnected'}</div>;
}
```

### Complete Example: Real-Time Message Display

```typescript
'use client';

import { useState } from 'react';
import { useSOSSocket, MessageBroadcast } from '@/hooks/useSOSSocket';

export function SOSMessageDisplay({ sosId, jwtToken }: Props) {
  const [messages, setMessages] = useState<MessageBroadcast[]>([]);

  const { isConnected } = useSOSSocket({
    token: jwtToken,
    sosId: sosId,
    onMessageBroadcast: (data: MessageBroadcast) => {
      // Receives message:broadcast events from WebSocket
      setMessages(prev => [...prev, data]);
    },
  });

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={isConnected ? 'text-green-600' : 'text-gray-500'}>
          {isConnected ? '🟢' : '⚪'} 
        </span>
        <span>Live Messages</span>
      </div>
      
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.senderDisplayName}</strong>: {msg.content}
        </div>
      ))}
    </div>
  );
}
```

---

## WebSocket Events Reference

### Location Updates (Real-Time Responder Tracking)

**Event:** `location:broadcast`

Listen for responder location updates:

```typescript
const { socket } = useSOSSocket({
  onLocationUpdate: (data) => {
    console.log({
      userId: data.userId,              // Responder ID
      latitude: data.latitude,          // GPS latitude
      longitude: data.longitude,        // GPS longitude
      accuracy: data.accuracy,          // GPS accuracy in meters
      timestamp: data.timestamp,        // Unix timestamp
    });
  },
});
```

Used in: [`MapLibre.tsx`](./MapLibre.tsx) for real-time responder marker updates.

---

### Message Broadcasts (Real-Time Messaging)

**Event:** `message:broadcast`

Listen for new messages from citizens, admins, or rescuers:

```typescript
const { socket } = useSOSSocket({
  onMessageBroadcast: (data) => {
    console.log({
      id: data.id,                              // Message ID
      sosId: data.sosId,                        // SOS request ID
      senderType: data.senderType,              // 'SOS_ADMIN' | 'CITIZEN' | 'RESCUER'
      senderDisplayName: data.senderDisplayName,// Display name
      content: data.content,                    // Message text
      contentType: data.contentType,            // 'text' | 'system'
      createdAt: data.createdAt,                // Timestamp
    });
  },
});
```

Used in: [`SOSMessageThread.tsx`](./SOSMessageThread.tsx) for real-time message display.

---

### SOS Status Updates

**Event:** `sos:status:broadcast`

Listen for status changes:

```typescript
const { socket } = useSOSSocket({
  onSOSStatusChange: (data) => {
    console.log({
      sosId: data.sosId,
      status: data.status, // 'ACTIVE' | 'ASSIGNED' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED'
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy,
    });
  },
});
```

---

### Typing Indicators

Show when participants are typing:

```typescript
const { socket, emitTypingStart, emitTypingStop } = useSOSSocket({
  onTypingStart: (data) => {
    console.log(`${data.displayName} is typing...`);
  },
  onTypingStop: (data) => {
    console.log(`${data.displayName} stopped typing`);
  },
});

// Emit typing events
emitTypingStart(sosId);
// ... after user stops typing
emitTypingStop(sosId);
```

---

## Next.js Code Standards

All WebSocket integration follows Next.js best practices:

### 1. Use `'use client'` Directive
All components using WebSocket must be client-side:
```typescript
'use client';
```

### 2. Proper Cleanup
The hook automatically cleans up WebSocket connections:
```typescript
useEffect(() => {
  // Connect
  return () => {
    // Cleanup happens automatically in useSOSSocket
  };
}, []);
```

### 3. Dynamic Imports for Client-Only Components
```typescript
const MapComponent = dynamic(() => import('./MapLibre'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});
```

### 4. Environment Variables
WebSocket URL is configured via environment variable:
```env
# .env.local
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

## Component Integration Map

```
SOSAdminDashboard
├── SOSMonitor
│   ├── SOSMap (listens to location:broadcast)
│   │   └── MapLibre (renders responder markers in real-time)
│   └── SOSDetailModal
│       ├── SOSChatManager
│       │   └── SOSChatBox
│       │       └── SOSMessageThread (listens to message:broadcast)
│       │           └── Real-time message display
│       └── SOSMessageThread (direct messaging view)
└── SOSManagement
    ├── Data table with SOS list
    └── Click to open detailed view with messaging
```

---

## Common Patterns

### Pattern 1: Update List on Message

```typescript
const [messages, setMessages] = useState<MessageBroadcast[]>([]);

useSOSSocket({
  onMessageBroadcast: (data) => {
    setMessages(prev => [...prev, data]);
  },
});
```

### Pattern 2: Update Map on Location

```typescript
const [responders, setResponders] = useState(new Map());

useSOSSocket({
  onLocationUpdate: (data) => {
    setResponders(prev => {
      const updated = new Map(prev);
      updated.set(data.userId, data);
      return updated;
    });
  },
});
```

### Pattern 3: Handle Connection Status

```typescript
const { isConnected, error } = useSOSSocket({...});

return (
  <div className="flex items-center gap-2">
    {isConnected && <span className="text-green-600">🟢 Live</span>}
    {error && <span className="text-red-600">⚠️ {error}</span>}
  </div>
);
```

---

## Troubleshooting

### WebSocket Not Connecting
1. Check JWT token is valid
2. Verify `NEXT_PUBLIC_WS_URL` is set correctly
3. Check browser console for error messages
4. Ensure backend WebSocket server is running

### Missing Real-Time Updates
1. Verify socket is connected: check `isConnected` status
2. Confirm socket is in correct SOS room: `sosId` parameter
3. Check network tab in DevTools for WebSocket traffic
4. Review browser console for `onError` callbacks

### Performance Issues
1. Batch updates instead of updating state on every message
2. Use `useCallback` for event handlers to prevent re-renders
3. Implement message pagination for old messages
4. Use React.memo for message list items

---

## References

- [Socket.IO Documentation](https://socket.io/docs/)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [WebSocket Configuration Details](../../docs/WEBSOCKET_CONFIG_SOS_ADMIN.md)
