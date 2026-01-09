# Invite Flow - Quick Reference

## User Journey Overview

```
┌─────────────────────┐
│  User clicks invite │
│  link (unauth)      │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────┐
│ app/invites/[inviteId]       │
│ (Welcome screen)             │
└────┬────────────────┬────────┘
     │                │
   New Account?     Existing Account?
     │                │
     ▼                ▼
┌──────────────────┐ ┌────────────────┐
│ Create Account   │ │ Login Page      │
│ (register)       │ │ (/login)        │
└────────┬─────────┘ └────────┬────────┘
         │                    │
         └────────┬───────────┘
                  │
                  ▼
         ┌─────────────────────┐
         │ Accept Invite Page  │
         │ (Enter Code)        │
         └────────┬────────────┘
                  │
                  ▼
         ┌─────────────────────┐
         │ Role-based Dashboard│
         │ (Redirect)          │
         └─────────────────────┘
```

## API Endpoints Used

### 1. Validate Invite
**Endpoint:** `GET /api/invites/{inviteId}`
**Used by:** Both accept and register pages
**Returns:** Invite validity status, role, municipality, expiration time

### 2. Register with Invite
**Endpoint:** `POST /api/identity/admin/register`
**Headers:** `Authorization: Bearer {firebaseToken}`
**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+63 912 345 6789",
  "displayName": "John Doe",
  "firebaseUid": "firebase-uid-here",
  "inviteId": "invite-id-from-url",
  "code": "123456"
}
```
**Returns:** Success status, user ID, role, municipality code

### 3. Accept Invite (Existing User)
**Endpoint:** `POST /api/invites/{inviteId}/accept`
**Request Body:**
```json
{
  "code": "123456"
}
```
**Returns:** Success status, role, municipality code, message

## Page Routes

| Route | Purpose | Auth Required |
|-------|---------|:-------------:|
| `/invites/{id}` | Welcome screen | ❌ |
| `/invites/{id}/register` | Registration form | ❌ |
| `/invites/{id}/accept` | Code entry for registered users | ✅ |
| `/login` | User login | ❌ |

## Key Features

### ✅ Unregistered User Can:
1. Click invite link
2. See welcome screen
3. Choose "Create New Account"
4. Register with email, phone, password
5. Enter 6-digit invitation code
6. Create account and accept invite in one action
7. Get logged in automatically
8. Redirect to role-based dashboard

### ✅ Registered User Can:
1. Click invite link
2. See welcome screen
3. Choose "Login with Existing Account"
4. Login with email/password
5. See code entry form
6. Enter 6-digit invitation code
7. Accept invite
8. Redirect to role-based dashboard

### ✅ Error Handling:
- Invite validation on all pages
- Password validation (min 6 chars, match check)
- Email validation (no duplicates)
- Code validation (6 digits only)
- Expired/used invite detection
- Firebase user cleanup on failure

## Environment Variables Required

```env
NEXT_PUBLIC_API_BASE=http://admin.localhost
```

This is used to construct the register API endpoint URL.

## Component Dependencies

- `validateInvite()` from `lib/api/endpoints.ts`
- `registerWithInvite()` from `lib/api/endpoints.ts`
- `acceptInvite()` from `lib/api/endpoints.ts` (existing)
- `useAuth()` hook
- `useRouter()` from Next.js
- `useParams()` from Next.js
- Firebase Auth SDK
- `Card` component
- `Alert` component

## State Management

### Register Page State:
- Form inputs: email, password, confirmPassword, phone, displayName, code
- UI states: isValidating, isSubmitting, error, success
- Invite data: inviteData (ValidateInviteResponse)

### Invite Page State:
- Authentication: user, authLoading
- Invite data: inviteData (ValidateInviteResponse)
- Accept flow: code, isSubmitting, error, success

## Testing Scenarios

### Scenario 1: New User Registration
1. Invite: Valid, 15 mins remaining
2. User: Not registered
3. Expected: Registration form shown, successful account creation

### Scenario 2: Expired Invite
1. Invite: Expired
2. Expected: Error message, no registration option

### Scenario 3: Used Invite
1. Invite: Already used
2. Expected: Error message, no registration option

### Scenario 4: Existing User
1. Invite: Valid
2. User: Has account
3. Expected: Login form shown, redirect to accept page after login

### Scenario 5: Invalid Code
1. User: Registered or newly created
2. Code: Wrong code entered
3. Expected: Code validation error, no accept

## Redirect Logic

After successful registration/accept:
- Role == `CITY_ADMIN` → `/admin/setup/check`
- Role == `SOS_ADMIN` → `/admin/sos`
- Role == `SK_ADMIN` → `/admin/sk-youth`
- Role == `SUPER_ADMIN` → `/admin/super-user`
- Default → `/admin/dashboard`
