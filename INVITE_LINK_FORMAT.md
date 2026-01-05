# Invite Link Format - Clarification

## Correct Invite Link Format

### URL Structure
```
/invites/{inviteId}
```

### Full URL Examples
```
http://localhost:3000/invites/695ab5d0ebbb768e6a1544f5
https://app.example.com/invites/507f1f77bcf86cd799439011
```

## Why This Format?

1. **RESTful**: Follows REST conventions for resource access
2. **Clean**: Single unified route for invite acceptance
3. **Consistent**: Matches the folder structure `app/invites/[inviteId]/`

## What Was Updated

### [components/admin/invites/InvitesList.tsx](components/admin/invites/InvitesList.tsx)
Updated the `handleCopyLink` function from:
```typescript
// OLD (incorrect)
const inviteLink = `${window.location.origin}/invite/accept/${invite.id}`;
```

To:
```typescript
// NEW (correct)
const inviteLink = `${window.location.origin}/invites/${invite.id}`;
```

## How the Invite Link Works

### Step 1: Admin Creates Invite
- Admin uses the Invites panel
- System generates a 6-digit code (e.g., `123456`)
- System creates invite with:
  - ID: `695ab5d0ebbb768e6a1544f5`
  - Code: `123456` (stored server-side)
  - Role: `SOS_ADMIN`
  - Municipality: `Calumpit`

### Step 2: Admin Copies & Shares Link
- Admin clicks "Copy Link" button
- Link is copied: `http://localhost:3000/invites/695ab5d0ebbb768e6a1544f5`
- Admin sends link to user

### Step 3: User Clicks Link
- User opens the link in their browser
- Route: `/invites/[inviteId]` matches
- `inviteId` param = `695ab5d0ebbb768e6a1544f5`

### Step 4: Accept Invite Flow
1. Check if user is logged in
2. If not: Redirect to login with returnUrl
3. If yes: Validate invite
4. Show form asking for 6-digit code
5. User enters code: `123456`
6. Submit to backend: `POST /api/invites/695ab5d0ebbb768e6a1544f5/accept`
7. Backend validates code matches
8. Accept invite and grant role
9. Redirect to dashboard

## Backend Integration

### Invite Response
The backend's `POST /api/invites` (create invite) should return:

```json
{
  "success": true,
  "data": {
    "inviteId": "695ab5d0ebbb768e6a1544f5",
    "code": "123456",
    "role": "SOS_ADMIN",
    "municipalityCode": "Calumpit",
    "expiresAt": "2026-01-05T12:45:00Z",
    "inviteLink": "http://localhost:3000/invites/695ab5d0ebbb768e6a1544f5"
  }
}
```

### Validation Response
`GET /api/invites/695ab5d0ebbb768e6a1544f5` returns:

```json
{
  "success": true,
  "data": {
    "inviteId": "695ab5d0ebbb768e6a1544f5",
    "valid": true,
    "role": "SOS_ADMIN",
    "municipalityCode": "Calumpit",
    "expiresAt": "2026-01-05T12:45:00Z",
    "reason": null
  }
}
```

### Accept Response
`POST /api/invites/695ab5d0ebbb768e6a1544f5/accept` with `{ code: "123456" }` returns:

```json
{
  "success": true,
  "data": {
    "success": true,
    "role": "SOS_ADMIN",
    "municipalityCode": "Calumpit",
    "message": "Invite accepted successfully. You are now a SOS Admin for Calumpit"
  }
}
```

## Route Mapping

| Route | File | Purpose |
|-------|------|---------|
| `/invites` | `app/invites/page.tsx` | Invite info page |
| `/invites/{inviteId}` | `app/invites/[inviteId]/page.tsx` | Accept invite (auth check → validate → code entry → accept) |
| `/login?returnUrl=/invites/{inviteId}` | Automatic redirect | For unregistered users |

## Summary

✅ Correct format: `/invites/{inviteId}`
✅ Updated frontend to generate correct links
✅ Backend should return `inviteLink` in invite creation response
✅ User clicks link → sees accept form → enters code → redirected to dashboard
