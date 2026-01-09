# Rescuer Participation Acceptance Flow

## Overview

A new acceptance flow has been added to the rescuer page. When a rescuer first enters the page, they must explicitly accept participation in the SOS incident before viewing the full dashboard.

## How It Works

### 1. Initial Check
When the rescuer page loads with a valid token:
1. Page validates the JWT token (existing flow)
2. Extracts sosId and userId
3. **NEW**: Automatically checks if the rescuer is already a participant in the SOS

### 2. Participation Status Check
```typescript
// Endpoint: GET /api/sos/:sosId/participants/:userId/check
// Authorization: Bearer <jwt_token>
// Response: { success: true, data: { isActive: true/false } }
```

### 3. Decision Logic

| Status | Action |
|--------|--------|
| Already participant | Skip dialog, load dashboard |
| Not a participant | Show accept dialog |
| Check fails | Show accept dialog (assume not joined) |

### 4. Accept Dialog
If not already a participant, shows:
- Header with icon
- Description of what they'll do
- Information box with details
- Decline button (redirects to home)
- Accept button (joins and loads dashboard)

### 5. Join Participant
When user clicks "Accept & Enter":
```typescript
// Endpoint: POST /api/sos/:sosId/participants/join
// Authorization: Bearer <jwt_token>
// Body: { userType: "rescuer" }
// Response: { success: true, data: { ... } }
```

### 6. Access Dashboard
After successful join, the full rescuer dashboard loads with:
- Real-time map
- Participants list
- Messages
- Locations
- All other features

## Component Structure

### New State Variables

```typescript
// Participation acceptance states
const [checkingParticipation, setCheckingParticipation] = useState(false);
const [isAlreadyParticipant, setIsAlreadyParticipant] = useState<boolean | null>(null);
const [showAcceptDialog, setShowAcceptDialog] = useState(false);
const [acceptingParticipation, setAcceptingParticipation] = useState(false);
const [acceptError, setAcceptError] = useState<string | null>(null);
```

### New Effects

1. **checkParticipationStatus (useEffect)**
   - Runs after authentication completes
   - Checks if rescuer is already a participant
   - Shows accept dialog if needed
   - Handles errors gracefully

2. **handleAcceptParticipation (function)**
   - Called when user clicks "Accept & Enter"
   - Makes POST request to join participants API
   - Shows loading state
   - Displays errors if any
   - Proceeds to dashboard on success

## UI Flow

```
Login with Token
        ↓
Validate Token (existing)
        ↓
Extract SOS ID & User ID
        ↓
Check Participation Status (NEW)
        ↓
    ┌───┴────┐
    ↓        ↓
Already   Not a
Joined    Participant
    ↓        ↓
  Load    Show Accept
Dashboard Dialog
            ↓
        [Decline] [Accept]
            ↓        ↓
         Home     Join & Load
                 Dashboard
```

## UI Components

### Accept Dialog

```
╔════════════════════════════════════╗
║  Accept Participation              ║
╠════════════════════════════════════╣
║                                    ║
║  🏢 (Large icon)                   ║
║                                    ║
║  Accept Participation              ║
║  You are about to join this        ║
║  emergency response incident as    ║
║  a rescuer.                        ║
║                                    ║
║  ┌────────────────────────────────┐│
║  │ 📋 What you'll do:             ││
║  │ ✓ Join the active SOS          ││
║  │ ✓ Share your real-time location││
║  │ ✓ Communicate with responders  ││
║  │ ✓ Coordinate rescue efforts    ││
║  └────────────────────────────────┘│
║                                    ║
║  [Error message if any]            ║
║                                    ║
║  [Decline]  [✅ Accept & Enter]    ║
╚════════════════════════════════════╝
```

## Error Handling

### Network Errors
- If participation check fails → Show accept dialog
- If join fails → Display error message in dialog
- User can retry by clicking "Accept & Enter" again

### Error Messages
```typescript
setAcceptError(errorMsg);
// Displayed in red alert box in dialog
// User can decline or retry
```

## API Integration

### Check Participation Endpoint
```bash
GET /api/sos/:sosId/participants/:userId/check
Authorization: Bearer <token>

Response (Success):
{
  "success": true,
  "data": {
    "isActive": true  // or false
  }
}

Response (Error):
{
  "success": false,
  "error": "Error message"
}
```

### Join Participant Endpoint
```bash
POST /api/sos/:sosId/participants/join
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "userType": "rescuer"
}

Response (Success):
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439020",
    "sosId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "userType": "rescuer",
    "status": "ACTIVE",
    "joinedAt": "2026-01-07T10:30:00Z",
    "leftAt": null,
    "actorType": "USER"
  }
}
```

## State Flow

### States & Transitions

```
Initial: checkingParticipation=true, isAlreadyParticipant=null, showAcceptDialog=false

After Check:
  ├─ If already participant: 
  │   checkingParticipation=false, isAlreadyParticipant=true, showAcceptDialog=false
  │   → Load Dashboard
  │
  └─ If not participant:
      checkingParticipation=false, isAlreadyParticipant=false, showAcceptDialog=true
      → Show Accept Dialog

On Accept Click:
  acceptingParticipation=true → Loading state

After Join:
  ├─ Success:
  │   acceptingParticipation=false, isAlreadyParticipant=true, showAcceptDialog=false
  │   → Load Dashboard
  │
  └─ Error:
      acceptingParticipation=false, acceptError="Error message"
      → Stay in Dialog, Show Error
```

## User Scenarios

### Scenario 1: New Rescuer (Not Yet Joined)
1. Opens rescuer link with valid token
2. Token is validated ✓
3. System checks participation → Not found
4. Accept dialog appears
5. User clicks "Accept & Enter"
6. Joins as participant
7. Dashboard loads

### Scenario 2: Returning Rescuer (Already Joined)
1. Opens rescuer link with valid token
2. Token is validated ✓
3. System checks participation → Already active
4. Dialog skipped
5. Dashboard loads immediately

### Scenario 3: User Declines
1. Opens rescuer link with valid token
2. Token is validated ✓
3. System checks participation → Not found
4. Accept dialog appears
5. User clicks "Decline"
6. Redirected to citizen home page

### Scenario 4: Join Fails
1. Opens rescuer link with valid token
2. Token is validated ✓
3. System checks participation → Not found
4. Accept dialog appears
5. User clicks "Accept & Enter"
6. API error occurs
7. Error message shown
8. User can retry or decline

## Configuration

No new environment variables required. Uses existing:
```
NEXT_PUBLIC_API_BASE=http://bff-admin:3000
```

## Testing Checklist

### Happy Path
- [ ] Open rescuer page with new token
- [ ] Accept dialog appears
- [ ] Click "Accept & Enter"
- [ ] Join API is called
- [ ] Dashboard loads after success
- [ ] Participant list shows you joined

### Returning User
- [ ] Open rescuer page as already-joined rescuer
- [ ] Accept dialog should NOT appear
- [ ] Dashboard loads immediately

### Error Handling
- [ ] Join API fails → Error message shown
- [ ] Can retry after error
- [ ] Decline button works
- [ ] Redirected to home after decline

### Edge Cases
- [ ] Network error during check → Shows dialog
- [ ] Invalid token → Shows auth error (existing)
- [ ] Rapid clicks on Accept → Prevent duplicate requests
- [ ] Close browser during check → No crashes

## Browser Console Logs

Debug information will show:
```
✓ Checking participation status...
✓ Rescuer is already a participant
  OR
⚠️ Rescuer is not a participant, showing accept dialog

When accepting:
⏳ Accepting participation...
✅ Successfully joined as participant
```

## Mobile Responsiveness

The accept dialog:
- ✅ Responsive on all screen sizes
- ✅ Touch-friendly buttons
- ✅ Large tap targets
- ✅ Clear typography
- ✅ Works in portrait and landscape

## Accessibility

- ✅ Semantic HTML
- ✅ Clear button labels
- ✅ Icon + text combinations
- ✅ Error messages visible
- ✅ Loading states clear
- ✅ Keyboard navigable

## Future Enhancements

1. **Confirmation Toast**: Show toast when join succeeds
2. **Join Details**: Display SOS details before joining
3. **Estimated Duration**: Show expected incident duration
4. **Skill Selection**: Let rescuer select their role/skills
5. **Quick Briefing**: Show incident briefing before join
6. **Join Analytics**: Track join/decline rates

## Related Documentation

- [PARTICIPANTS_IMPLEMENTATION.md](PARTICIPANTS_IMPLEMENTATION.md) - Full participants feature
- [PARTICIPANTS_QUICK_REFERENCE.md](PARTICIPANTS_QUICK_REFERENCE.md) - Quick start guide
- [PARTICIPANTS_ARCHITECTURE.md](PARTICIPANTS_ARCHITECTURE.md) - System design

## API Reference

For complete API documentation, see [SOS_PARTICIPANTS_API_BFF_ADMIN.md](../SOS_PARTICIPANTS_API_BFF_ADMIN.md)
