# Rescuer Exit Button - Implementation

## Overview

An "Exit SOS" button has been added to the rescuer page header. This button allows rescuers to leave the SOS incident and exit the dashboard.

## Features

### Exit Button
- **Location**: Top right of the header, next to participant count
- **Visibility**: Only shows when rescuer is already a participant
- **Label**: "🚪 Exit SOS"
- **Color**: Red (danger action)
- **Loading State**: Shows "⏳ Exiting..." while processing
- **Disabled State**: Disabled while exit request is in progress

## How It Works

### 1. Precondition
```typescript
if (isAlreadyParticipant === true) {
  // Show exit button
}
```

### 2. User Action
```
User clicks "Exit SOS" button
        ↓
Button disabled (shows "Exiting...")
        ↓
Leave Participant API called
        ↓
```

### 3. API Call
```
PATCH /api/sos/{sosId}/participants/{userId}/leave
Authorization: Bearer <token>
```

### 4. Success Path
```
API returns success
        ↓
Console logs: "Successfully left SOS"
        ↓
Update state: isAlreadyParticipant = false
        ↓
Wait 1.5 seconds
        ↓
Redirect to /citizen/home
```

### 5. Error Path
```
API returns error
        ↓
Error message displayed
        ↓
Button enabled again
        ↓
User can retry or navigate away manually
```

## State Variables

### New States Added
```typescript
isExiting: boolean              // API loading state
exitError: string | null        // Error message
```

### Dependency on Existing State
```typescript
isAlreadyParticipant: boolean | null  // Shows button only if true
```

## Implementation Details

### Handler Function
```typescript
const handleExitParticipation = async () => {
  // 1. Check prerequisites
  // 2. Set loading state
  // 3. Call leave API
  // 4. Handle success/error
  // 5. Redirect on success
}
```

### UI Component
```tsx
{isAlreadyParticipant && (
  <button
    onClick={handleExitParticipation}
    disabled={isExiting}
    className="..."
  >
    {isExiting ? '⏳ Exiting...' : '🚪 Exit SOS'}
  </button>
)}
```

### Error Display
```tsx
{exitError && (
  <div className="...">
    ⚠️ {exitError}
  </div>
)}
```

## Visual Design

### Button States

**Normal State:**
```
┌──────────────┐
│ 🚪 Exit SOS  │ (Red button)
└──────────────┘
```

**Loading State:**
```
┌──────────────────┐
│ ⏳ Exiting...     │ (Red button, disabled)
└──────────────────┘
```

**Error State:**
```
┌──────────────┐        ┌─────────────────────┐
│ 🚪 Exit SOS  │        │ ⚠️ Error message    │
└──────────────┘        └─────────────────────┘
```

**Hidden State:**
```
(Button not visible when not a participant)
```

## User Flow

### Scenario 1: Successful Exit
1. Rescuer views dashboard (already joined)
2. Exit button visible in header
3. Clicks "Exit SOS"
4. Button shows loading state
5. API call made
6. Success response received
7. Button re-enabled
8. After 1.5 seconds, redirected to home
9. Successfully exited

### Scenario 2: Exit with Error
1. Rescuer clicks "Exit SOS"
2. Button shows loading state
3. API call made
4. Error response received
5. Error message displayed
6. Button re-enabled
7. User can:
   - Retry by clicking again
   - Navigate manually using browser
   - Refresh page

### Scenario 3: Button Hidden
1. Rescuer first joins (shows dialog)
2. Accepts participation
3. Dashboard loads
4. Exit button appears
5. ...later, if rescuer leaves via sidebar
6. Exit button automatically hides

## Technical Details

### API Endpoint Used
```
PATCH /api/sos/:sosId/participants/:userId/leave
```

**Parameters:**
- `sosId`: From decoded token or rescuerId
- `userId`: From decoded token

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:** Empty object `{}`

### Response Handling

**Success (200):**
```json
{
  "success": true,
  "message": "Participant left SOS",
  "timestamp": "2026-01-07T10:35:00Z"
}
```

**Error (400, 500):**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Error Handling

| Error Type | Handling |
|-----------|----------|
| Network error | Show error message, enable retry |
| API 400 error | Show specific error, enable retry |
| API 500 error | Show error, enable retry |
| Invalid token | May redirect (handled elsewhere) |

## Browser Console Logs

**Success:**
```
✅ Successfully left SOS
```

**Error:**
```
❌ Error exiting SOS: [error message]
```

## Mobile Responsiveness

- ✅ Button visible on mobile
- ✅ Responsive text size
- ✅ Touch-friendly button size
- ✅ Loading state visible
- ✅ Error message wraps properly

## Accessibility

- ✅ Clear button label
- ✅ Icon + text combination
- ✅ Proper disabled state
- ✅ Title attribute with tooltip
- ✅ Error messages announced
- ✅ Keyboard navigable

## Code Location

**File**: `app/admin/rescuer/[rescuerId]/page.tsx`

**Lines with exit code:**
- State declarations: ~75-76
- Handler function: ~425-465
- Button in header: ~700-730
- Error display: ~735-745

## Integration with Existing Features

### With ParticipantsList Component
- Independent implementation
- Both have exit/leave capability
- Either button can be used

### With Acceptance Dialog
- Dialog hidden when already joined
- Exit button shown instead
- Both manage `isAlreadyParticipant` state

### With WebSocket
- Exit updates propagate via socket events
- Real-time updates to other participants
- Dashboard reflects changes

## Testing Checklist

### Happy Path
- [ ] Button shows when joined
- [ ] Click "Exit SOS"
- [ ] Loading state displays
- [ ] API called successfully
- [ ] State updates
- [ ] Redirected to home

### Error Cases
- [ ] Network error → Error message shown
- [ ] API fails → Can retry
- [ ] Can dismiss error
- [ ] Button re-enabled

### Visibility
- [ ] Hidden before joining
- [ ] Shows after accepting
- [ ] Shows after returning to page
- [ ] Hidden after exiting

### Mobile
- [ ] Button visible on mobile
- [ ] Touch works properly
- [ ] Loading state visible
- [ ] Error message readable
- [ ] Text not truncated

## Future Enhancements

1. **Confirmation Dialog**: "Are you sure?" before exit
2. **Toast Notification**: Show success message
3. **Graceful Disconnect**: Clean up connections
4. **Analytics**: Track exit events
5. **Debounce**: Prevent double-clicks
6. **Keyboard Shortcut**: Quick exit option

## Related Documentation

- RESCUER_ACCEPTANCE_FLOW.md - Acceptance feature
- RESCUER_ACCEPTANCE_QUICK_REFERENCE.md - Quick reference
- PARTICIPANTS_IMPLEMENTATION.md - Participants feature
- SOS_PARTICIPANTS_API_BFF_ADMIN.md - API documentation

## Summary

**What:** Exit button to leave SOS incident
**Why:** Allow rescuers to exit incident and return home
**How:** Click button → API call → Redirect home
**Status:** ✅ Ready for testing

---

**Implementation Date**: January 7, 2026
**Status**: ✅ Complete
