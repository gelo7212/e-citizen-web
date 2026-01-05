# WebSocket Troubleshooting & Diagnostics

## Issues Fixed

### 1. ✅ Double Connection Issue

**Problem:** Socket was connecting twice due to dependency array including `connect` function.

**Cause:** 
- The `connect` function was recreated on every render
- When `connect` changed, it triggered the useEffect again
- This caused disconnect → reconnect cycle

**Fix:**
- Removed `connect` and `disconnect` from useEffect dependency array
- Only depend on: `[enabled, token, sosId]`
- The `connect` function itself depends on these same values internally

**Result:** Single connection on mount, no reconnects unless props change

---

### 2. ✅ Missing Broadcasts Issue

**Problem:** Event listeners might not be catching broadcasts properly.

**Causes:**
1. Listeners registered after connect (timing issue)
2. Event names not matching between client and server
3. Room joining might fail before listeners were ready

**Fixes Applied:**
1. **All listeners registered BEFORE connect event**
   - Ensures they're ready when data arrives
   - No race condition with incoming messages

2. **Enhanced logging for all events**
   - Now logs: sender, timestamp, sosId
   - Easier to spot missing events

3. **Better socket configuration**
   - Added `websocket` as primary transport (before polling)
   - Proper reconnection settings

---

## Debugging Broadcast Issues

### Check 1: Socket Connected?
```typescript
// In browser console
const socket = document.querySelector('[data-test="sos-map"]').__reactFiber$.return.memoizedProps.socket;
console.log('Connected?', socket?.connected);
console.log('Socket ID:', socket?.id);
```

### Check 2: Room Joined?
```typescript
// Check the console logs for:
// "[useSOSSocket] 🚪 Joining room: sos:..."
// This confirms room join was emitted

// If server supports, check:
// socket.emit('list-rooms', (rooms) => console.log('Rooms:', rooms));
```

### Check 3: Event Listeners Active?
Open DevTools Network → WebSocket tab:

**What to look for:**

1. **Socket.IO Handshake:**
   ```
   {"type":0,"data":{"sid":"...","upgrades":[],"pingInterval":25000,...}}
   ```

2. **Room Join:**
   ```
   {"type":2,"data":["join-room",{"sosId":"sos-123"}]}
   ```

3. **Incoming Broadcast:**
   ```
   {"type":4,"data":["message:broadcast",{"id":"msg-123",...}]}
   ```

### Check 4: Server Sending Broadcasts?

The problem might be **server-side**, not client:

```typescript
// Server should be doing something like:
io.to(`sos:${sosId}`).emit('message:broadcast', messageData);
// OR
socket.to(`sos:${sosId}`).emit('message:broadcast', messageData);
```

**Verify:**
1. Is server sending to the correct room name? (Check it matches `join-room` sosId)
2. Is server sending the exact event name? (Case-sensitive!)
3. Are other clients in the room? (Broadcasting happens to all in room)

### Check 5: Correct Event Names

The client listens for these events (case-sensitive):
- `location:broadcast`
- `message:broadcast`
- `sos:status:broadcast`
- `message:typing:start`
- `message:typing:stop`
- `participant:joined`
- `participant:left`

Verify server is sending exactly these names with no typos.

---

## Advanced Diagnostics

### Enable Socket.IO Debug Logging
```typescript
// At the top of your component
import { io } from 'socket.io-client';

// Enable debug for socket.io
localStorage.debug = 'socket.io-client:*';
```

This will show every message sent/received.

### Intercept All Events
```typescript
// In useSOSSocket, add after socket creation:
newSocket.onAny((eventName, ...args) => {
  console.log('[ALL EVENTS]', eventName, args);
});
```

This catches events even if you didn't register listeners for them.

### Check Payload Structure
```typescript
newSocket.on('message:broadcast', (data) => {
  console.log('[DEBUG] Full payload:', JSON.stringify(data, null, 2));
  console.log('[DEBUG] Event type check:', typeof data);
  console.log('[DEBUG] Keys:', Object.keys(data || {}));
});
```

---

## Network Tab Analysis

### Expected Flow:

```
1. Initial connection (HTTP upgrade to WS)
   → Frame: {"type":0,"data":{...sid...}}
   
2. Your app joins room
   → Frame: {"type":2,"data":["join-room",{"sosId":"sos-123"}]}
   
3. Server acknowledges join
   → Frame: {"type":3,"data":[...]}
   
4. Other client sends message
   → Frame: {"type":4,"data":["message:broadcast",{...message...}]}
   
5. Your listener receives it
   → Log in console: "[useSOSSocket] 💬 Message: ..."
```

### If broadcasts aren't showing:

- Check step 2 - room join emitted?
- Check step 3 - server acknowledged?
- Check step 4 - server actually sending broadcast?

---

## Console Log Reading

### ✅ Working Example (Look For These):
```
[useSOSSocket] 🔌 Creating new connection to: ws://localhost:3001
[useSOSSocket] ✅ Connected to: ws://localhost:3001
[useSOSSocket] Socket ID: abc123...
[useSOSSocket] 🚪 Joining room: sos:sos-123
[useSOSSocket] 💬 Message: John Doe - "Hello everyone"
[useSOSSocket] 📍 Location: sos-123
```

### ❌ Broken Example (Something's Wrong):
```
[useSOSSocket] 🔌 Creating new connection to: ws://localhost:3001
[useSOSSocket] ✅ Connected to: ws://localhost:3001
[useSOSSocket] Socket ID: abc123...
[useSOSSocket] 🚪 Joining room: sos:sos-123
(... no more messages ...)
(server sends broadcast but nothing appears)
```

**If you see this:** Problem is server-side OR room join failed

---

## Server-Side Checklist

For broadcasts to work, your **backend/server MUST**:

1. ✅ Receive the `join-room` event
2. ✅ Add socket to room: `socket.join('sos:' + sosId)`
3. ✅ When broadcasting, send to the room:
   ```javascript
   io.to('sos:' + sosId).emit('message:broadcast', {
     id: 'msg-123',
     sosId: sosId,
     senderDisplayName: 'Admin',
     content: 'Hello',
     // ... other fields
   });
   ```
4. ✅ Use correct event name exactly: `message:broadcast` (not `messageBroadcast` or `message_broadcast`)

---

## Common Issues & Solutions

### Issue: Connected but no broadcasts

**Check:**
1. Is server receiving the room join?
2. Is server sending broadcasts to correct room?
3. Is event name exactly correct?

**Fix:** Add logging on server to confirm broadcasts are being sent.

---

### Issue: Connecting twice

**Status:** ✅ FIXED (removed `connect` from dependency array)

If still happening:
1. Check for React StrictMode (causes double mount in dev)
2. Check parent component isn't remounting hook

---

### Issue: Connection drops frequently

**Check:**
1. Token expiration? (Server disconnecting old auth)
2. Network issues? (Check Network tab)
3. Server timing out?

**Log to monitor:**
```
[useSOSSocket] ❌ Connection error: ...
[useSOSSocket] 🔌 Disconnected: ...
```

---

### Issue: Room join not working

**Verify:**
```typescript
// Should see in console:
// [useSOSSocket] 🚪 Joining room: sos:sos-123

// In Network tab, should see:
// {"type":2,"data":["join-room",{"sosId":"sos-123"}]}
```

If not appearing:
- Check `sosId` prop is being passed
- Check socket is connected before join
- Check server is calling `socket.join()`

---

## Test Commands

### Test 1: Check Socket State
```typescript
// In browser console, after connection
const socket = window.__DEBUG_SOCKET; // if you expose it

console.log({
  connected: socket?.connected,
  id: socket?.id,
  rooms: socket?.rooms, // rooms this client is in
  listeners: socket?._events, // registered listeners
});
```

### Test 2: Manual Event Emit
```typescript
// Send a test message (if your server supports it)
socket.emit('message:send', {
  sosId: 'sos-123',
  content: 'Test message',
});
```

### Test 3: Broadcast to Self
```typescript
// Register listener
socket.on('test:broadcast', (data) => {
  console.log('Received test:', data);
});

// Emit to room (server echoes it back)
socket.emit('test:broadcast', { message: 'Hello' });
```

---

## Performance Monitoring

### Check Message Rate
```typescript
let messageCount = 0;
const startTime = Date.now();

newSocket.on('message:broadcast', () => {
  messageCount++;
  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`[PERF] ${messageCount} messages in ${elapsed}s`);
});
```

### Check Listener Cleanup
The hook now properly cleans up listeners on disconnect:
```typescript
// When component unmounts or socket disconnects:
// - All listeners are removed
// - Prevents memory leaks
// - No duplicate listeners on reconnect
```

---

## Next Steps

1. **Check Server Logs** - Verify broadcasts are being sent
2. **Monitor Network Tab** - Look for broadcast frames
3. **Review Event Names** - Ensure client names match server exactly
4. **Test with Debug Logs** - Use code above to trace the flow
5. **Check Room Name** - Ensure room format is consistent

---

## Related Files

- [useSOSSocket Hook](../hooks/useSOSSocket.ts) - WebSocket integration
- [WEBSOCKET_INTEGRATION.md](../components/admin/sos/WEBSOCKET_INTEGRATION.md) - WebSocket details
- [WebSocket API Docs](../docs/API.md) - Server endpoint documentation
