# Accept Invite Implementation

## Overview
Implementation of the complete invite acceptance flow for the e-Citizen platform. Users can now accept invitations through a secure 6-digit code verification system.

## Flow Diagram

```
User clicks invite link → System checks login status
                              ↓
                    ✗ Not logged in?
                    └─→ Redirect to Login with returnUrl
                        ↓
                        User logs in
                        ↓
                    ✓ Redirect back to invite (returnUrl)
                        ↓
                    ✓ Already logged in?
                    └─→ Continue to accept flow
                        ↓
                        Validate invite
                        ↓
                    ✓ Valid? → Enter 6-digit code
                    ✗ Invalid? → Show error (EXPIRED/USED/INVALID)
                        ↓
                        User submits code
                        ↓
                    ✓ Code matches? → Accept invite
                    ✗ Code invalid? → Show error
                        ↓
                        Show confirmation
                        ↓
                        Redirect to correct dashboard:
                        - CITY_ADMIN    → /admin/city
                        - SOS_ADMIN     → /admin/sos
                        - SK_ADMIN      → /admin/sk
                        - SUPER_ADMIN   → /admin/super-user
```

## Files Modified

### 1. [app/invites/[inviteId]/page.tsx](app/invites/[inviteId]/page.tsx)
**Changes:**
- Added `useAuth` hook to check authentication status
- Added authentication guard that:
  - Checks if user is logged in
  - Redirects to login with `returnUrl` parameter if not authenticated
  - Continues with invite acceptance if authenticated
- Added `isInitialized` state to ensure auth check completes before validation
- Updated success redirect logic with role-based routing:
  - Maps role types to dashboard endpoints
  - Falls back to `/admin/dashboard` if role doesn't match map
- Added loading state for authentication check

**Key Features:**
```typescript
// Auth guard logic
if (!user) {
  const returnUrl = `/invites/${inviteId}/accept`;
  router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  return;
}

// Role-based redirect mapping
const roleMap: Record<string, string> = {
  'CITY_ADMIN': '/admin/city',
  'SOS_ADMIN': '/admin/sos',
  'SK_ADMIN': '/admin/sk',
  'SUPER_ADMIN': '/admin/super-user',
};
```

### 2. [app/login/page.tsx](app/login/page.tsx)
**Changes:**
- Added `useSearchParams` hook to read `returnUrl` parameter
- Updated redirect logic to prioritize `returnUrl` if present
- Falls back to role-based routing (setup check for CITY_ADMIN, dashboard for others) if no returnUrl

**Key Features:**
```typescript
const searchParams = useSearchParams();
const returnUrl = searchParams.get('returnUrl') || null;

// After successful login
if (returnUrl) {
  router.push(returnUrl);
} else {
  // Role-based redirect logic
}
```

## User Experience

### Step 1: Receive Invite
- User receives invite link (example: `https://app.com/invites/abc123def456/accept`)

### Step 2: Click Link
- User clicks the invite link
- System checks if logged in

### Step 3a: Not Logged In
- Redirected to login page with `returnUrl` parameter
- After successful login, automatically returns to invite page
- Example URL: `/login?returnUrl=%2Finvites%2Fabc123def456%2Faccept`

### Step 3b: Already Logged In
- Proceeds directly to invite acceptance form

### Step 4: Enter 6-Digit Code
- Display form with:
  - 6-digit code input field (numeric only)
  - Invite details (role, municipality, expiration)
  - Accept Invite button
- Form validates:
  - Code is exactly 6 digits
  - Invite is still valid
  - Invite hasn't been used

### Step 5: Accept Invite
- User submits the code
- Backend validates code against invite
- If valid:
  - Show success confirmation with role and municipality
  - Redirect to appropriate dashboard after 2 seconds

### Step 6: Dashboard Redirect
User is taken to their role-specific dashboard:

| Role | Redirect Path |
|------|---------------|
| CITY_ADMIN | `/admin/city` |
| SOS_ADMIN | `/admin/sos` |
| SK_ADMIN | `/admin/sk` |
| SUPER_ADMIN | `/admin/super-user` |
| Other | `/admin/dashboard` |

## API Integration

### Endpoints Used

#### 1. Validate Invite
```typescript
GET /api/invites/{inviteId}

Response: ValidateInviteResponse {
  inviteId: string;
  valid: boolean;
  role: InviteRole;
  municipalityCode: string;
  expiresAt: string;
  reason: null | 'EXPIRED' | 'USED' | 'INVALID';
}
```

#### 2. Accept Invite
```typescript
POST /api/invites/{inviteId}/accept

Request: AcceptInviteRequest {
  code: string;
}

Response: AcceptInviteResponse {
  success: boolean;
  role: InviteRole;
  municipalityCode: string;
  message: string;
}
```

Both endpoints are already implemented in [lib/api/endpoints.ts](lib/api/endpoints.ts):
- `validateInvite(inviteId: string)`
- `acceptInvite(inviteId: string, data: AcceptInviteRequest)`

## Error Handling

### Invite Validation Errors
- **EXPIRED**: Invite has expired (valid for 15 minutes)
- **USED**: Invite has already been accepted
- **INVALID**: Invite doesn't exist or is invalid

### Code Submission Errors
- **Invalid Code**: Code doesn't match the 6-digit code in the invite
- **HTTP 410**: Invite expired or used (gone)
- **HTTP 422**: Invalid code format

## Loading States

1. **Auth Check Loading**: While verifying if user is logged in
2. **Invite Validation Loading**: While validating the invite
3. **Code Submission Loading**: While submitting the code

## Security Considerations

- ✅ Authentication required before accepting invites
- ✅ Automatic redirect to login if not authenticated
- ✅ Return URL parameter safely encoded
- ✅ 6-digit code verification required
- ✅ Invite expiration check (15 minutes)
- ✅ Single-use invite enforcement (USED status)
- ✅ Role-based access control for subsequent pages

## Testing Checklist

- [ ] Clicking invite without being logged in redirects to login
- [ ] After login, user returns to invite acceptance page
- [ ] Invalid invite shows appropriate error (EXPIRED/USED/INVALID)
- [ ] Valid invite shows acceptance form
- [ ] 6-digit code input only accepts numbers
- [ ] Code with less than 6 digits keeps button disabled
- [ ] Valid code accepts invite and shows confirmation
- [ ] Invalid code shows error message
- [ ] Confirmation message displays role and municipality
- [ ] CITY_ADMIN is redirected to `/admin/city`
- [ ] SOS_ADMIN is redirected to `/admin/sos`
- [ ] SK_ADMIN is redirected to `/admin/sk`
- [ ] SUPER_ADMIN is redirected to `/admin/super-user`
- [ ] Unknown roles redirect to `/admin/dashboard`
- [ ] Invite expires after 15 minutes
- [ ] Invite can't be reused

## Future Enhancements

1. **Multi-language support** for error messages
2. **Email notification** after successful invite acceptance
3. **Audit logging** for all invite actions
4. **Bulk invite statistics** in admin dashboard
5. **Invite resend** functionality
6. **SMS code delivery** option (if 6-digit code via SMS)
