# Rescuer Acceptance Flow - Quick Reference

## What Changed

Added an **Accept Participation** dialog that appears when a rescuer first enters the incident dashboard.

## Flow

```
Rescuer opens link
        ↓
Check: Are they already a participant?
        ↓
    ┌───┴────┐
    ↓        ↓
   Yes       No
    ↓        ↓
 Skip     Show Accept
Dialog    Dialog
    ↓        ↓
Load    [Accept] [Decline]
Dashboard    ↓       ↓
          Join   Go Home
          API
            ↓
        Load Dashboard
```

## Implementation Details

### Files Modified
- `app/admin/rescuer/[rescuerId]/page.tsx` - Added acceptance logic

### New State Variables (5)
```typescript
checkingParticipation: boolean       // Loading state
isAlreadyParticipant: boolean | null // Participation status
showAcceptDialog: boolean             // Show dialog flag
acceptingParticipation: boolean       // Join loading state
acceptError: string | null            // Error message
```

### New Effects (2)
1. **checkParticipationStatus** - Checks if user is already a participant
2. **handleAcceptParticipation** - Joins user as participant

### New UI Component (1)
- Accept dialog with decline/accept buttons

## API Calls Made

### 1. Check Participation (Automatic)
```bash
GET /api/sos/{sosId}/participants/{userId}/check
```
- Runs automatically on page load
- Checks if rescuer is already joined
- Shows dialog if not joined

### 2. Join Participant (On Accept)
```bash
POST /api/sos/{sosId}/participants/join
Body: { userType: "rescuer" }
```
- Only runs when user clicks "Accept & Enter"
- Joins rescuer as participant
- Shows error if fails

## User Actions

| Action | Result |
|--------|--------|
| Accept & Enter | Join SOS, load dashboard |
| Decline | Redirect to home page |
| Retry after error | Try joining again |

## Loading States

| State | Appearance |
|-------|------------|
| Checking participation | No visible state (fast check) |
| Showing dialog | Dialog appears on screen |
| Accepting | Button shows "⏳ Accepting..." |
| Success | Dialog closes, dashboard loads |
| Error | Red error message in dialog |

## Error Handling

| Error Type | Handling |
|-----------|----------|
| Network error | Shows dialog (assume not joined) |
| Join fails | Shows error in red box |
| Already joined | Skips dialog, loads dashboard |

## Testing

### Test 1: Accept Participation
1. Open rescuer link (new rescuer)
2. See accept dialog
3. Click "Accept & Enter"
4. Verify: Joined API called
5. Verify: Dashboard loads
6. Verify: You appear in participants list

### Test 2: Skip Dialog (Already Joined)
1. Open rescuer link (already participant)
2. Verify: No dialog shown
3. Verify: Dashboard loads immediately

### Test 3: Decline
1. Open rescuer link
2. Click "Decline"
3. Verify: Redirected to home page

### Test 4: Error Handling
1. Mock API to fail
2. Click "Accept & Enter"
3. Verify: Error message shown
4. Click "Accept & Enter" again
5. Verify: Can retry

## Browser Logs

### Success Flow
```
✓ Checking participation status...
⚠️ Rescuer is not a participant, showing accept dialog
✅ Successfully joined as participant
```

### Already Joined Flow
```
✓ Checking participation status...
✓ Rescuer is already a participant
```

## Mobile View

The dialog:
- ✅ Responsive on all devices
- ✅ Full width on mobile
- ✅ Large touch targets
- ✅ Clear readable text
- ✅ Works portrait/landscape

## Code Location

**File**: `app/admin/rescuer/[rescuerId]/page.tsx`

**Lines with new code**:
- State declarations: ~55-60
- Check participation effect: ~330-375
- Accept handler function: ~377-411
- Accept dialog UI: ~573-623

## Key Functions

```typescript
// Checks if user is already a participant
checkParticipationStatus() {
  GET /api/sos/{sosId}/participants/{userId}/check
  → setIsAlreadyParticipant(true/false)
  → setShowAcceptDialog(true) if not participant
}

// Joins user as participant
handleAcceptParticipation() {
  POST /api/sos/{sosId}/participants/join
  → setIsAlreadyParticipant(true) on success
  → setShowAcceptDialog(false) on success
  → setAcceptError(msg) on error
}
```

## Troubleshooting

### Dialog not appearing
- Check browser console for errors
- Verify API endpoint is accessible
- Ensure token is valid

### Join fails with error
- Check API is accessible
- Verify JWT token has correct format
- Check network in browser dev tools

### Always shows dialog
- Check participation check API
- Verify response format is correct
- Check token has correct userId

## Related Files

- `RESCUER_ACCEPTANCE_FLOW.md` - Full documentation
- `SOS_PARTICIPANTS_API_BFF_ADMIN.md` - API details
- `PARTICIPANTS_IMPLEMENTATION.md` - Participants feature

## Summary

✅ **What was added**: Accept participation dialog
✅ **Why**: Rescuers must explicitly accept before joining
✅ **How**: Automatic check + dialog if needed
✅ **Result**: Better user control and audit trail

---

**Status**: ✅ Ready for Testing  
**Completion**: January 7, 2026
