# Anonymous Rescuer Implementation Guide

## Overview
The anonymous rescuer page allows emergency responders to track incidents in real-time using a secure, shareable link without requiring user authentication.

## URL Format
```
http://localhost:3000/admin/rescuer/[rescuerId]?token=[jwt_token]
```

### Example
```
http://localhost:3000/admin/rescuer/695ce767e114be3b8b47123d?token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Token Requirements

The JWT token must contain the following claims:

```typescript
{
  userId: "rescuer-123",      // Unique rescuer identifier
  role: "RESCUER",             // Must be 'RESCUER'
  sosId: "sos-incident-id",    // SOS incident ID (optional, falls back to URL rescuerId)
  exp: 1234567890              // Expiration time (standard JWT)
}
```

## Architecture

### 1. Page Layout (`app/admin/rescuer/[rescuerId]/page.tsx`)

**Features:**
- Real-time location tracking via Mapbox
- Live participant list
- Message feed
- Connection status indicator
- Token validation and decoding

**Key Components:**
- **Header**: Shows incident ID, rescuer ID, connection status, and participant count
- **Map**: Displays locations of all participants in real-time
- **Location Panel**: Lists GPS coordinates, accuracy, and timestamps
- **Participant Panel**: Shows connected rescuers, citizens, and admins
- **Message Feed**: Displays real-time messages from participants

### 2. WebSocket Connection

The page uses the existing `useSOSSocket` hook to establish a real-time connection:

```typescript
const { socket, isConnected } = useSOSSocket({
  token,           // JWT token from URL query
  sosId,           // Incident ID to join
  enabled: !!token && !!sosId,
  onLocationUpdate: (data) => { /* ... */ },
  onMessageBroadcast: (data) => { /* ... */ },
  onParticipantJoined: (data) => { /* ... */ },
  // ... other callbacks
});
```

### 3. Event Handling

The page listens to the following WebSocket events:

#### Location Updates
```typescript
socket.on('location:broadcast', (data: LocationBroadcast) => {
  // {
  //   userId: string
  //   sosId: string
  //   latitude: number
  //   longitude: number
  //   accuracy: number (meters)
  //   timestamp: number
  //   deviceId: string
  // }
});
```

#### Messages
```typescript
socket.on('message:broadcast', (data: MessageBroadcast) => {
  // {
  //   id: string
  //   sosId: string
  //   senderType: 'SOS_ADMIN' | 'CITIZEN' | 'RESCUER'
  //   senderId: string | null
  //   senderDisplayName: string
  //   contentType: 'text' | 'system'
  //   content: string
  //   createdAt: string
  //   timestamp: number
  // }
});
```

#### Participant Events
```typescript
socket.on('participant:joined', (data: ParticipantEvent) => {
  // {
  //   userId: string
  //   userRole: 'SOS_ADMIN' | 'CITIZEN' | 'RESCUER'
  //   displayName: string
  //   timestamp: number
  // }
});
```

## Implementation Details

### Step 1: Token Decoding

The page extracts the `sosId` from the JWT token payload:

```typescript
const parts = token.split('.');
const payload = atob(parts[1] + '='.repeat(4 - (parts[1].length % 4)));
const decoded = JSON.parse(payload);

if (decoded.sosId) {
  setSosId(decoded.sosId);  // Use sosId from token
} else {
  setSosId(rescuerId);      // Fall back to URL parameter
}
```

### Step 2: WebSocket Initialization

Once `sosId` is determined, the `useSOSSocket` hook is enabled and connects to the WebSocket server:

```typescript
// In useSOSSocket hook
const newSocket = io(wsUrl, {
  auth: { token },        // Send token in auth
  query: { token },       // Also in query params for compatibility
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
});
```

### Step 3: Join SOS Room

Once connected, the socket joins the SOS room:

```typescript
socket.emit('sos:room:join', { 
  sosId,
  userType: 'RESCUER',
  displayName: 'Anonymous Rescuer'
});
```

### Step 4: Listen for Events

All event listeners are attached to receive real-time updates:

```typescript
socket.on('location:broadcast', onLocationUpdate);
socket.on('message:broadcast', onMessageBroadcast);
socket.on('participant:joined', onParticipantJoined);
socket.on('participant:left', onParticipantLeft);
```

### Step 5: Update UI

As events arrive, the page updates the UI:

```typescript
// Location updates trigger map marker updates
updateMapMarker(userId, latitude, longitude);

// Participant events update the participant list
setParticipants(prev => new Map(prev).set(userId, participant));

// Message events add to the message feed
setMessages(prev => [...prev, message]);
```

## Layout Hierarchy

```
app/
  admin/
    layout.tsx (requires authentication)
    rescuer/
      layout.tsx (NO authentication - skips parent layout)
      [rescuerId]/
        page.tsx (anonymous rescuer page)
```

### Why Separate Layout?

The rescuer layout does NOT inherit authentication from the parent `/admin` layout. This allows:
- Anonymous access via shareable token
- No user authentication needed
- Instant access for responders
- Works with temporary/disposable tokens

## Configuration

### Required Environment Variables

```env
NEXT_PUBLIC_MAPBOX_TOKEN=<your_mapbox_token>
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Mapbox Setup

The page automatically:
1. Loads Mapbox with your public token
2. Creates a map centered at (14.5995, 120.9842) - Manila, Philippines
3. Updates markers as location events arrive
4. Uses `mapboxgl.flyTo()` to center on new locations

## Features

### Real-Time Location Tracking
- Displays live GPS coordinates with accuracy
- Updates markers as participants move
- Shows timestamp of last update
- Provides Haversine distance calculations (if needed)

### Participant Management
- Shows connected rescuers, citizens, and admins
- Displays join time for each participant
- Color-coded by role (red for citizens, blue for rescuers, purple for admins)
- Real-time join/leave notifications

### Message Feed
- Displays up to 10 most recent messages
- Shows sender name and timestamp
- Color-coded by message type
- Auto-scrolls to latest message

### Connection Status
- Live indicator (green = connected, red = disconnected)
- Animated pulse for connection state
- Shows participant count
- Error messages for connection failures

## Security Considerations

1. **Token Validation**: Tokens should be short-lived (expires in minutes, not hours)
2. **WebSocket Auth**: Token is sent in both `auth` and `query` for robust authentication
3. **Room-Based Access**: Users can only see events from their specific SOS room
4. **No Persistence**: Page loads fresh on each visit (no stored tokens)

## Error Handling

The page handles:
- Missing token: Shows error message
- Invalid token: Falls back to using URL rescuerId
- Map loading failures: Displays error banner
- WebSocket disconnections: Shows status and auto-reconnects
- API errors: Catches and displays in error banner

## Debugging

Enable console logging to see:
- Token decoding: `🔐 Token decoded`
- Map initialization: `✅ Map loaded successfully`
- WebSocket events: `📍 Location update`, `💬 Message received`, etc.
- Connection status: `🔌 Connected to`, `🔌 Disconnected`
- Errors: `❌` prefix for all errors

## Testing

### Manual Testing Steps

1. Generate a rescuer link from SOS Monitor:
   - Go to `/admin/sos/monitor`
   - Click "Share" button on an incident
   - Copy the generated link

2. Open the link in a new window/device:
   - `http://localhost:3000/admin/rescuer/[sosId]?token=[token]`

3. Verify functionality:
   - ✅ Map loads and centers on incident
   - ✅ Connection indicator shows "Live Connected"
   - ✅ Participant list updates when rescuers join
   - ✅ Location markers appear and update
   - ✅ Messages display in feed
   - ✅ Timestamps are accurate

### Expected WebSocket Events

After loading, you should see in browser console:
```
🔐 Token decoded: {userId, role, sosId}
✅ Map loaded successfully
🔌 Connected to: ws://localhost:3001
🚪 Joining room: sos:incident-123
📍 Location broadcast: incident-123
👤 Joined: Citizen Name
💬 Message: SOS Admin - New message received
```

## Next Steps

After implementation:
1. Test with real incident data
2. Verify WebSocket connection stability
3. Monitor performance on slow connections
4. Test on mobile devices (small screens)
5. Verify map interactions work on touch devices
