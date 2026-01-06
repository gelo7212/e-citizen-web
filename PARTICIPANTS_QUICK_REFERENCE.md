# SOS Participants Implementation - Quick Reference

## What Was Implemented

A complete participants management system for rescuers in the SOS feature, integrating with the BFF Admin API.

## Files Created

1. **`hooks/useSOSParticipants.ts`** (296 lines)
   - React hook for participant API interactions
   - Exports: useSOSParticipants

2. **`components/admin/rescuer/ParticipantsList.tsx`** (213 lines)
   - React component for displaying participants
   - Exports: ParticipantsList

3. **`PARTICIPANTS_IMPLEMENTATION.md`** (Documentation)
   - Comprehensive guide and troubleshooting

## Files Modified

1. **`app/admin/rescuer/[rescuerId]/page.tsx`**
   - Added import for ParticipantsList
   - Replaced old participants section with new component

## Key Features

### Hook (useSOSParticipants)
- ✅ Fetch active participants
- ✅ Fetch participant history
- ✅ Join a SOS
- ✅ Leave a SOS
- ✅ Check active participation
- ✅ Get user's participation history
- ✅ Error handling & loading states

### Component (ParticipantsList)
- ✅ Display active participants
- ✅ Join/Leave buttons with loading states
- ✅ Auto-refresh every 10 seconds
- ✅ Role-specific colors & icons
- ✅ Current user highlighting
- ✅ Anonymous participant indication
- ✅ Real-time status indicator
- ✅ Error handling with user feedback

## Integration Points

The component is integrated in:
- `app/admin/rescuer/[rescuerId]/page.tsx` - Rescuer dashboard

## API Endpoints Used

All endpoints require JWT authentication via Authorization header:

```
POST   /api/sos/:sosId/participants/join
PATCH  /api/sos/:sosId/participants/:userId/leave
GET    /api/sos/:sosId/participants/active
GET    /api/sos/:sosId/participants/history
GET    /api/sos/:sosId/participants/:userId/check
GET    /api/sos/:sosId/participants/user/:userId/history
```

## Usage Example

```tsx
<ParticipantsList
  sosId="507f1f77bcf86cd799439011"
  token={jwtToken}
  currentUserId="507f1f77bcf86cd799439012"
  onError={(error) => console.error(error)}
  className="flex-1"
/>
```

## Environment Variables Required

```
NEXT_PUBLIC_API_BASE=http://bff-admin:3000
```

(Defaults to `http://admin.localhost` if not set)

## UI Components

### Join Flow
1. User not in participants list
2. User clicks "Join" button
3. Shows "⏳ Joining..." during request
4. User added to list
5. Button changes to "Leave"

### Leave Flow
1. User in participants list
2. User clicks "Leave" button
3. Shows "⏳ Leaving..." during request
4. User removed from list
5. Button changes to "Join"

### Display Elements
- **Count Badge**: Shows number of active participants
- **Role Icons**: 👨‍💼 Admin, 🚨 Rescuer, 👤 Citizen
- **Color Coding**: Red (admin), Blue (rescuer), Green (citizen)
- **Timestamps**: When each participant joined
- **Live Status**: Shows "Live" or "Updating..." with indicator dot

## Error Handling

All errors are:
- Logged to console with prefix (❌)
- Displayed in red alert box in component
- Passed to onError callback (if provided)

## Real-Time Updates

Two methods for real-time updates:

1. **Auto-Refresh**: Every 10 seconds via REST API
2. **WebSocket**: Via useSOSSocket hook for instant updates (if configured)

## Testing Checklist

- [ ] Can join a SOS
- [ ] Can leave a SOS
- [ ] List shows all active participants
- [ ] Current user marked with "(You)"
- [ ] Roles show correct icons and colors
- [ ] Join/Leave buttons disable during request
- [ ] Error messages display correctly
- [ ] Auto-refresh works every 10 seconds
- [ ] Anonymous participants show badge
- [ ] Timestamps are accurate

## Browser Compatibility

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers
- ✅ Requires JWT support
- ✅ Requires Fetch API

## Performance Notes

- Component cleanly unmounts interval on destroy
- Uses useCallback for optimized function memoization
- Participants list limited to max-height with scrolling
- Loading states prevent duplicate requests

## Future Enhancements

See [PARTICIPANTS_IMPLEMENTATION.md](PARTICIPANTS_IMPLEMENTATION.md) for:
- Socket integration
- Pagination support
- Search/filtering
- Admin controls
- Analytics
- Offline support
