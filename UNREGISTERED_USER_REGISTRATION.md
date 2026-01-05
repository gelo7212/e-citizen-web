# Invite Flow Implementation - Unregistered User Registration

## Overview
Implemented a complete invite flow that allows unregistered users to create accounts and accept invitations, in addition to the existing flow for registered users.

## Changes Made

### 1. **API Endpoint** - `lib/api/endpoints.ts`
Added a new function `registerWithInvite()` that calls the backend API to create a user account and accept an invite in one operation:

```typescript
export async function registerWithInvite(
  firebaseToken: string,
  data: RegisterWithInviteRequest
)
```

**API Details:**
- Endpoint: `POST /api/identity/admin/register`
- Headers: Firebase token in Authorization header
- Body:
  - `email`: User's email address
  - `phone`: User's phone number
  - `displayName`: User's full name
  - `firebaseUid`: Firebase UID from authentication
  - `inviteId`: The invite ID from the URL
  - `code`: 6-digit invitation code

### 2. **Types** - `types/index.ts`
Added two new type interfaces:

```typescript
export interface RegisterWithInviteRequest {
  email: string;
  phone: string;
  displayName: string;
  firebaseUid: string;
  inviteId: string;
  code: string;
}

export interface RegisterWithInviteResponse {
  success: boolean;
  message: string;
  userId?: string;
  role?: InviteRole;
  municipalityCode?: string;
}
```

### 3. **Register Page** - `app/invites/[inviteId]/register/page.tsx` (NEW)
Created a new registration page that handles unregistered users with valid invites.

**Features:**
- Validates invite validity before showing form
- Registration form collects:
  - Full Name
  - Email Address
  - Phone Number
  - Password (min 6 characters)
  - Confirm Password
  - 6-Digit Invitation Code
- Creates Firebase user first, then registers with backend
- Shows invite details (role, municipality, expiration)
- Proper error handling for:
  - Email already in use
  - Invalid password strength
  - Invalid invitation code
  - Expired/used invites
- Redirects to appropriate dashboard based on assigned role
- Cleans up Firebase user on registration failure

### 4. **Invite Acceptance Flow** - `app/invites/[inviteId]/page.tsx` (MODIFIED)
Updated the invite acceptance page to support both unregistered and registered users.

**Changes:**
- Removed automatic redirect to login for unauthenticated users
- Shows welcome screen with two options when user is not logged in:
  1. **Create New Account** - Links to register page for unregistered users
  2. **Login with Existing Account** - Links to login page for registered users
- Maintains all existing functionality for authenticated users

**New UI Component:**
- Shows invite details (role, municipality, expiration)
- Clear visual separation between create account and login options
- Links to existing registration/login flows

## User Flow

### For Unregistered Users:
1. User clicks invite link → `app/invites/[inviteId]/page.tsx`
2. Invite is validated
3. User sees welcome screen with "Create New Account" button
4. User clicks "Create New Account" → `app/invites/[inviteId]/register/page.tsx`
5. User fills out registration form with:
   - Personal info (name, email, phone)
   - New password
   - 6-digit invitation code
6. System:
   - Creates Firebase account
   - Registers user in backend
   - Accepts invite
   - Creates user with appropriate role
7. User is logged in and redirected to appropriate dashboard

### For Registered Users:
1. User clicks invite link → `app/invites/[inviteId]/page.tsx`
2. Invite is validated
3. User sees welcome screen with "Login with Existing Account" button
4. User clicks button → redirected to login page
5. User logs in → returns to `app/invites/[inviteId]/page.tsx`
6. User enters 6-digit code from invitation
7. System accepts the invite and redirects to dashboard

## Validation & Error Handling

### Invite Validation:
- Checks if invite is valid (not expired, not already used)
- Shows appropriate error messages:
  - "This invite has expired. Invites are valid for 15 minutes."
  - "This invite has already been used."
  - "This invite is no longer valid."

### Registration Validation:
- All fields required
- Password minimum 6 characters
- Passwords must match
- Email format validation
- 6-digit code validation
- Firebase email validation (prevents duplicate accounts)

### API Error Handling:
- Firebase errors (email already in use, weak password, invalid email)
- Backend errors (invalid code, expired invite, registration failure)
- Cleans up Firebase user if backend registration fails

## Role-Based Redirects
After successful registration/invite acceptance, users are redirected based on their assigned role:

- `CITY_ADMIN` → `/admin/setup/check`
- `SOS_ADMIN` → `/admin/sos`
- `SK_ADMIN` → `/admin/sk-youth`
- `SUPER_ADMIN` → `/admin/super-user`
- Default → `/admin/dashboard`

## Files Changed
1. ✅ `lib/api/endpoints.ts` - Added register API function
2. ✅ `types/index.ts` - Added register types
3. ✅ `app/invites/[inviteId]/page.tsx` - Updated for unregistered user flow
4. ✅ `app/invites/[inviteId]/register/page.tsx` - NEW registration page

## Testing Checklist
- [ ] Test invalid/expired invite handling
- [ ] Test valid invite flow for unregistered user
- [ ] Test registration form validation
- [ ] Test password mismatch error
- [ ] Test duplicate email error
- [ ] Test invalid code error
- [ ] Test successful registration and redirect
- [ ] Test existing user login flow
- [ ] Test Firebase user cleanup on registration failure
- [ ] Verify role-based redirects work correctly
