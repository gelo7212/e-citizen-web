# SOS Participants Architecture Diagram

## Component Hierarchy

```
app/admin/rescuer/[rescuerId]/page.tsx (Rescuer Page)
    │
    ├─ useSOSSocket Hook (Real-time updates)
    │   ├─ onParticipantJoined
    │   └─ onParticipantLeft
    │
    └─ ParticipantsList Component
        │
        ├─ useSOSParticipants Hook
        │   │
        │   └─ API Calls
        │       ├─ POST /api/sos/:sosId/participants/join
        │       ├─ PATCH /api/sos/:sosId/participants/:userId/leave
        │       ├─ GET /api/sos/:sosId/participants/active
        │       ├─ GET /api/sos/:sosId/participants/history
        │       ├─ GET /api/sos/:sosId/participants/:userId/check
        │       └─ GET /api/sos/:sosId/participants/user/:userId/history
        │
        ├─ State Management
        │   ├─ participants: Participant[]
        │   ├─ loading: boolean
        │   ├─ error: string | null
        │   └─ isJoined: boolean
        │
        └─ UI Elements
            ├─ Header with count badge
            ├─ Error alert box
            ├─ Join/Leave button
            ├─ Participants list
            │   ├─ Role icon & name
            │   ├─ Timestamp
            │   └─ Status indicators
            └─ Live status indicator
```

## Data Flow

```
1. Page Load
   ↓
   Rescuer Page loads with JWT token from URL
   ↓

2. Component Mount
   ↓
   ParticipantsList component mounts with:
   - sosId: from decoded token
   - token: from URL parameters
   - currentUserId: from decoded token
   ↓

3. Initial Fetch
   ↓
   useSOSParticipants.fetchActive()
   ↓
   GET /api/sos/{sosId}/participants/active
   ↓
   Response: List of active participants
   ↓
   Set state: participants[]
   ↓

4. Auto-Refresh Loop (Every 10 seconds)
   ↓
   setInterval(() => fetchActive(), 10000)
   ↓
   Updates participants list
   ↓

5. User Action: Join
   ↓
   User clicks "Join" button
   ↓
   useSOSParticipants.join('rescuer')
   ↓
   POST /api/sos/{sosId}/participants/join
   ↓
   Response: Participant record
   ↓
   Automatically call fetchActive()
   ↓
   List updates with new participant
   ↓

6. User Action: Leave
   ↓
   User clicks "Leave" button
   ↓
   useSOSParticipants.leave(userId)
   ↓
   PATCH /api/sos/{sosId}/participants/{userId}/leave
   ↓
   Response: Success message
   ↓
   Automatically call fetchActive()
   ↓
   List updates, removes user
   ↓

7. Real-time Updates (via WebSocket)
   ↓
   socket.on('participant:joined', data)
   socket.on('participant:left', data)
   ↓
   These events can trigger UI updates
   without waiting for 10-second refresh
   ↓

8. Component Unmount
   ↓
   Cleanup: clearInterval(intervalId)
   ↓
   Prevents memory leaks
```

## State Machine

```
ParticipantsList Component States:

                    ┌─────────────────────────┐
                    │   Component Mount       │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │    Loading State        │
                    │  (Fetching initial list)│
                    └───────────┬──────────────┘
                                │
                    ┌───────────▼──────────────────┐
                    │   Loaded State               │
                    │ (Display participants list)  │
                    └───────────┬──────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
    ┌─────────┐         ┌──────────────┐      ┌────────────┐
    │   Idle  │◄────────┤Auto-Refreshing│     │   Error    │
    │ (Waiting)│        │ (Every 10s)    │     │   (Show    │
    └─────────┘         └──────────────┘     │   alert)   │
         ▲                      ▲              └────────────┘
         │                      │
    ┌────┴──────────────────────┴──────────────────┐
    │                                              │
    │  Click "Join"  or  Click "Leave"           │
    │         │                    │              │
    │    ┌────▼──┐           ┌─────▼─┐           │
    │    │Joining│           │Leaving│           │
    │    └──┬───┘            └────┬──┘            │
    │       │ API Response        │ API Response  │
    │       │ (Success)           │ (Success)     │
    │       └───────┬─────────────┘               │
    │               │                            │
    │        Refresh List                        │
    │               │                            │
    └───────────────┴────────────────────────────┘
```

## Hook API

```
useSOSParticipants({
  sosId: string,
  token: string,
  enabled?: boolean
})

Returns: {
  // State
  participants: Participant[],
  loading: boolean,
  error: string | null,

  // Methods
  fetchActive: () => Promise<void>,
  fetchHistory: () => Promise<Participant[]>,
  join: (userType?: string) => Promise<Participant | null>,
  leave: (userId: string) => Promise<boolean>,
  checkActive: (userId: string) => Promise<boolean>,
  getUserHistory: (userId: string) => Promise<Participant[]>
}
```

## Type Definitions

```typescript
interface Participant {
  id: string;                    // Unique participant record ID
  sosId: string;                 // SOS incident ID
  userId: string;                // User or device ID
  userType: 'admin'|'rescuer'|'citizen'; // User role
  status: 'ACTIVE' | 'INACTIVE'; // Current status
  joinedAt: string;              // ISO8601 timestamp
  leftAt: string | null;         // ISO8601 or null if active
  actorType: 'USER' | 'ANON';    // User or anonymous
}

interface ParticipantsListProps {
  sosId: string;                 // SOS ID
  token: string;                 // JWT token
  currentUserId: string;         // For highlighting current user
  onError?: (error: string) => void;  // Error callback
  className?: string;            // Tailwind classes
}

interface UseSOSParticipantsOptions {
  sosId: string;
  token: string;
  enabled?: boolean;
}
```

## API Endpoint Mapping

```
Hook Method          │ HTTP Method │ Endpoint
─────────────────────┼─────────────┼─────────────────────────────────
fetchActive()        │ GET         │ /api/sos/:sosId/participants/active
fetchHistory()       │ GET         │ /api/sos/:sosId/participants/history
join(userType)       │ POST        │ /api/sos/:sosId/participants/join
leave(userId)        │ PATCH       │ /api/sos/:sosId/participants/:userId/leave
checkActive(userId)  │ GET         │ /api/sos/:sosId/participants/:userId/check
getUserHistory(uid)  │ GET         │ /api/sos/:sosId/participants/user/:userId/history
```

## Error Handling Flow

```
API Request
    │
    ├─ Success (2xx)
    │   ├─ Parse JSON
    │   ├─ Check success flag
    │   ├─ Update state
    │   └─ Return data
    │
    ├─ Redirect (3xx)
    │   └─ Treat as network error
    │
    ├─ Client Error (4xx)
    │   ├─ Log error with prefix
    │   ├─ Set error state
    │   ├─ Display in component
    │   └─ Call onError callback
    │
    ├─ Server Error (5xx)
    │   ├─ Log error with prefix
    │   ├─ Set error state
    │   ├─ Display in component
    │   └─ Call onError callback
    │
    └─ Network Error
        ├─ Try/catch exception
        ├─ Log error with prefix
        ├─ Set error state
        ├─ Display in component
        └─ Call onError callback
```

## UI Component Layout

```
┌─────────────────────────────────────────────────────┐
│ Active Participants  [5]              [Join]          │ Header
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ⚠️ Error message (if any)                        │ │ Error Alert
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────┐                             │
│ │ ⏳ Loading...      │  (if fetching)              │ Loading State
│ └────────────────────┘                             │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 👨‍💼 Admin              10:30 AM     (You)        │ │
│ │ Admin User ID: 507f...                          │ │
│ │                                                 │ │ Participant
│ │ Ring: Yellow (Current User)                     │ │ Item
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🚨 Rescuer             10:35 AM                 │ │
│ │ Rescuer User ID: 507f...                        │ │
│ │                                                 │ │ Participant
│ │ (Anonymous)                                      │ │ Item
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 👤 Citizen             10:32 AM                 │ │
│ │ Citizen User ID: 507f...                        │ │
│ └─────────────────────────────────────────────────┘ │ Participant
│                                                     │ Item
│ ┌─────────────────────────────────────────────────┐ │
│ │ 👤 Citizen             10:28 AM                 │ │
│ │ Citizen User ID: 507f...                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
├─────────────────────────────────────────────────────┤
│ ● Live    Last updated: 10:45 AM                    │ Footer
└─────────────────────────────────────────────────────┘
```

## Color Coding

```
Role    │ Background    │ Text Color │ Border Color │ Icon
────────┼───────────────┼────────────┼──────────────┼─────────
Admin   │ bg-red-100    │ text-red-800   │ border-red-300   │ 👨‍💼
Rescuer │ bg-blue-100   │ text-blue-800  │ border-blue-300  │ 🚨
Citizen │ bg-green-100  │ text-green-800 │ border-green-300 │ 👤
```

---

This diagram provides a comprehensive view of the SOS Participants implementation architecture and data flow.
