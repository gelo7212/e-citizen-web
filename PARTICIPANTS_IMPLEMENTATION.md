# SOS Participants Implementation for Rescuer

This document describes the implementation of the SOS Participants API in the Rescuer section.

## Overview

The participants feature allows rescuers to manage their enrollment in active SOS incidents. The implementation includes:

1. **Hook (`useSOSParticipants`)** - React hook for API interactions
2. **Component (`ParticipantsList`)** - UI component for displaying and managing participants
3. **Integration** - Integrated into the rescuer page

## Files Created/Modified

### New Files

#### 1. `hooks/useSOSParticipants.ts`
A custom React hook that wraps the SOS Participants API endpoints.

**Features:**
- Fetch active participants
- Fetch participant history
- Join a SOS
- Leave a SOS
- Check active participation
- Get user's participation history

**Usage:**
```typescript
const {
  participants,
  loading,
  error,
  fetchActive,
  fetchHistory,
  join,
  leave,
  checkActive,
  getUserHistory,
} = useSOSParticipants({
  sosId: 'sos-id-123',
  token: 'jwt-token',
  enabled: true,
});
```

#### 2. `components/admin/rescuer/ParticipantsList.tsx`
A React component that displays the list of active participants and allows rescuers to join/leave.

**Features:**
- Display active participants with role badges
- Join/Leave buttons
- Real-time updates (auto-refresh every 10 seconds)
- Error handling
- Loading states
- User identification (shows "You" for current user)
- Role-specific colors and icons
- Anonymous participant indication

**Props:**
```typescript
interface ParticipantsListProps {
  sosId: string;           // SOS request ID
  token: string;           // JWT authentication token
  currentUserId: string;   // Current user's ID
  onError?: (error: string) => void;  // Error callback
  className?: string;      // Additional CSS classes
}
```

### Modified Files

#### `app/admin/rescuer/[rescuerId]/page.tsx`
Updated to integrate the new `ParticipantsList` component.

**Changes:**
- Added import for `ParticipantsList`
- Replaced the old participants section with the new component
- Component receives sosId, token, and currentUserId from page state

## API Endpoints Used

The hook communicates with the following endpoints:

### 1. Join a SOS Participant
```
POST /api/sos/:sosId/participants/join
Authorization: Bearer <jwt_token>
Body: { userType: "rescuer" }
```

### 2. Leave a SOS
```
PATCH /api/sos/:sosId/participants/:userId/leave
Authorization: Bearer <jwt_token>
```

### 3. Get Active Participants
```
GET /api/sos/:sosId/participants/active
Authorization: Bearer <jwt_token>
```

### 4. Get Participant History
```
GET /api/sos/:sosId/participants/history
Authorization: Bearer <jwt_token>
```

### 5. Check Active Participation
```
GET /api/sos/:sosId/participants/:userId/check
Authorization: Bearer <jwt_token>
```

### 6. Get User's Participation History
```
GET /api/sos/:sosId/participants/user/:userId/history
Authorization: Bearer <jwt_token>
```

## Component Features

### Join/Leave Functionality
- **Join Button**: Appears when user is not a participant
  - Clicking joins the rescuer to the SOS
  - Shows loading state during request
  - Automatically refreshes participant list

- **Leave Button**: Appears when user is already a participant
  - Clicking removes the rescuer from the SOS
  - Shows loading state during request
  - Automatically refreshes participant list

### Display Features
- **Participant Count**: Shows number of active participants
- **Role Badges**: Visual indicators for admin/rescuer/citizen
- **Role Icons**: Emoji icons for quick identification (👨‍💼 admin, 🚨 rescuer, 👤 citizen)
- **Current User Indicator**: Shows "(You)" for current user with yellow ring
- **Timestamp**: Displays when each participant joined
- **Anonymous Indicator**: Shows "Anonymous" badge for anonymous participants
- **Live Status**: Shows connection status and last update time

### Auto-Refresh
- Component automatically refreshes participants every 10 seconds
- Maintains real-time accuracy without manual refresh

### Error Handling
- Displays error messages in a red alert box
- Calls optional `onError` callback
- Gracefully handles network failures
- Logs errors to console for debugging

## Integration Flow

1. **Page Load**: Rescuer page loads with JWT token from URL
2. **Token Validation**: Token is decoded and validated
3. **Component Mount**: `ParticipantsList` is mounted with sosId, token, and userId
4. **Initial Fetch**: Component fetches active participants on mount
5. **Auto-Refresh**: Component refreshes every 10 seconds
6. **User Action**: User can click Join or Leave
7. **API Call**: Hook makes POST/PATCH request to API
8. **List Update**: List automatically refreshes after action

## WebSocket Integration

While the component uses REST API for participant management, the rescuer page also receives real-time updates via WebSocket:

- `socket.on('participant:joined', ...)` - Broadcasts when someone joins
- `socket.on('participant:left', ...)` - Broadcasts when someone leaves

This allows real-time UI updates without waiting for the 10-second refresh interval.

## Error States

The component handles the following error scenarios:

1. **Network Errors**: Displays error message
2. **Auth Errors**: Shows auth-related messages
3. **API Errors**: Displays specific API error responses
4. **Missing Parameters**: Validates sosId and token before requests

## Styling

The component uses Tailwind CSS with:
- Blue color scheme for primary actions
- Red for destructive actions (leave)
- Green for constructive actions (join)
- Role-specific colors (red for admin, blue for rescuer, green for citizen)
- Responsive design with max height scrolling
- Animation for loading states

## Performance Considerations

1. **Memoization**: Uses useCallback for function memoization
2. **Interval Cleanup**: Properly cleans up interval on unmount
3. **Debouncing**: Could be added if needed for frequent updates
4. **Lazy Loading**: Only fetches when component is mounted and enabled

## Future Enhancements

Potential improvements:

1. **Socket Integration**: Subscribe to real-time participant events
2. **Pagination**: Support for large participant lists
3. **Filtering**: Filter by role or status
4. **Search**: Search participants by name or ID
5. **Admin Controls**: Remove/manage participants (if admin)
6. **Statistics**: Show participant duration, activity metrics
7. **Notifications**: Toast notifications for join/leave events
8. **Offline Support**: Cache participant data locally

## Usage Example

```tsx
// In rescuer page
<ParticipantsList
  sosId={sosId}
  token={token}
  currentUserId={decodedToken?.identity?.userId || decodedToken?.userId || rescuerId}
  onError={(error) => {
    console.error('Participants error:', error);
    // Could show toast notification here
  }}
  className="flex-1"
/>
```

## Testing

To test the implementation:

1. **Join a SOS**
   - Click "Join" button
   - Should see participant added to list
   - Shows "(You)" indicator

2. **Leave a SOS**
   - Click "Leave" button
   - Should be removed from list
   - "(You)" indicator disappears

3. **Auto-Refresh**
   - Wait 10 seconds
   - List should automatically refresh
   - Other participants' changes should appear

4. **Error Handling**
   - Invalid token: Shows error message
   - Network down: Shows error message
   - Invalid sosId: Shows error message

5. **Real-time Updates**
   - Have two rescuers join same SOS
   - Both should see each other in real-time (via socket or refresh)
   - Timestamps should match

## Troubleshooting

**Issue: "Unauthorized" error**
- Solution: Ensure JWT token is valid and not expired
- Check token payload contains required fields

**Issue: Participants not updating**
- Solution: Check browser console for errors
- Verify API endpoint is accessible
- Check CORS headers

**Issue: Join/Leave buttons not working**
- Solution: Verify network connection
- Check token permissions
- Look at API response in network tab

## Configuration

The API base URL is configured via environment variable:
```
NEXT_PUBLIC_API_BASE=http://bff-admin:3000 (or your API URL)
```

If not set, defaults to `http://admin.localhost`
