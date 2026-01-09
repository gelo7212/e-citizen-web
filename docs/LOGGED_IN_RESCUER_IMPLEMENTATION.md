# Logged-In Rescuer Implementation

## Overview
Implemented a comprehensive rescuer portal that mirrors the anonymous rescuer functionality but for authenticated users. This includes real-time incident tracking, location sharing, and multi-party communication.

## Key Features Implemented

### 1. **Rescuer Authentication & Routing**
- **File**: [app/login/page.tsx](app/login/page.tsx)
- Added RESCUER role detection and automatic redirect to `/rescuer/dashboard`
- Preserves existing admin and temporary access routing

### 2. **Rescuer Dashboard**
- **File**: [app/rescuer/dashboard/page.tsx](app/rescuer/dashboard/page.tsx)
- Displays all assigned SOS incidents in card format
- Shows incident status (pending, arrived, assisting, completed)
- Shows priority levels (critical, high, normal)
- Clickable cards redirect to incident detail page
- Auto-refreshes every 3 seconds
- Empty state messaging when no incidents assigned

### 3. **Rescuer Incident Page**
- **File**: [app/rescuer/incident/[sosId]/page.tsx](app/rescuer/incident/[sosId]/page.tsx)
- Full real-time incident tracking interface
- Same layout and features as anonymous rescuer

#### Features:
- **Acceptance Dialog**: Users must accept participation before joining incident
- **Real-Time Location**: Automatic GPS tracking and broadcast
  - Uses browser geolocation API
  - Sends location every update via WebSocket
  - Shows accuracy and timestamp
- **Interactive Map**: Mapbox integration showing all rescuer locations
- **Participant List**: Shows all connected rescuers, citizens, and admins
- **Message Feed**: Real-time messaging system
  - Send messages to other rescuers and admins
  - Color-coded by sender type
  - Auto-scrolls to latest messages
  - Shows sender name and timestamp
- **Connection Status**: Indicator showing WebSocket connection state
- **Exit Button**: Graceful exit from incident with API call

### 4. **Rescuer Layout**
- **File**: [app/rescuer/layout.tsx](app/rescuer/layout.tsx)
- Shared layout for all rescuer pages
- Navigation menu: Dashboard, Live Map, History
- User role display
- Logout functionality
- Token rotation enabled (60-second refresh threshold)
- Auto-redirect to login on token expiration

### 5. **Rescuer Map & History Pages**
- **Files**: 
  - [app/rescuer/map/page.tsx](app/rescuer/map/page.tsx)
  - [app/rescuer/history/page.tsx](app/rescuer/history/page.tsx)
- WebSocket-connected live map
- Historical SOS records placeholder
- Consistent styling with other rescuer pages

## Technical Implementation

### WebSocket Events Handled
- `location:broadcast` - Real-time location updates
- `message:broadcast` - Incoming messages
- `participant:joined` - New participant joined
- `participant:left` - Participant left incident
- Connection/disconnection events
- Error events

### API Endpoints Used
```
GET  /api/sos/{sosId}/participants/{userId}/check      - Check participation status
POST /api/sos/{sosId}/participants/join                - Join incident
POST /api/sos/{sosId}/participants/{userId}/exit       - Exit incident
POST /api/sos/{sosId}/messages                         - Send message
GET  /api/sos/{sosId}/participants                     - Get participants
```

### Hooks Used
- `useRequireAuth()` - Authentication guard
- `useTokenRotation()` - Token refresh management
- `useSOSSocket()` - WebSocket connection
- `useSOSParticipants()` - Participant list management

### State Management
- Real-time location tracking with `setRescuerLocation`
- Participant maps with real-time sync
- Message feed with 50-message history
- Connection status with error handling

## User Flow

1. **Login**: Rescuer logs in via `/login`
2. **Dashboard**: Redirect to `/rescuer/dashboard` showing assigned incidents
3. **Incident Selection**: Click incident card → navigate to `/rescuer/incident/[sosId]`
4. **Acceptance**: Accept participation in incident dialog
5. **Active Incident**: 
   - Location automatically shared
   - Can send messages
   - See other participants
   - View real-time map
6. **Exit**: Click exit button to return to dashboard

## Security Considerations

- Requires authentication via `useRequireAuth()`
- Token validation on every page
- Automatic token refresh via `useTokenRotation()`
- WebSocket authentication with token
- API calls include authorization headers
- Participation check before incident access

## Consistency with Anonymous Rescuer

- Uses same `useSOSSocket` hook
- Uses same `RescuerMap` component
- Uses same `ParticipantsList` component
- Same message format and styling
- Same location tracking mechanism
- Same UI/UX patterns

## Files Created/Modified

### Created:
- `app/rescuer/dashboard/page.tsx`
- `app/rescuer/incident/[sosId]/page.tsx`
- `app/rescuer/incident/layout.tsx`
- `app/rescuer/layout.tsx`
- `app/rescuer/map/page.tsx`
- `app/rescuer/history/page.tsx`

### Modified:
- `app/login/page.tsx` - Added RESCUER role routing

## Testing Checklist

- [ ] Login as RESCUER role
- [ ] Redirects to `/rescuer/dashboard`
- [ ] Dashboard displays assigned incidents
- [ ] Click incident shows acceptance dialog
- [ ] Accept dialog shows participation details
- [ ] Accept participation succeeds
- [ ] Map displays current and other rescuer locations
- [ ] Location updates broadcast via WebSocket
- [ ] Can send messages to other participants
- [ ] Participant list updates in real-time
- [ ] Connection status shows active/disconnected
- [ ] Exit button returns to dashboard
- [ ] Token rotation works (watch console logs)
- [ ] Auto-refresh every 3 seconds on dashboard
