# Unregistered User Invite Flow - Solution

## The Problem

When a user who **doesn't have a Firebase account** clicks an invite link:

1. They are redirected to login page (no auth needed for invite acceptance)
2. They try to enter credentials
3. Firebase returns "user not found" error
4. **User is stuck with no way to proceed**

## The Solution Implemented

### Enhanced Error Handling

The login page now provides **specific error messages** for different Firebase errors:

```
✕ Account not found. 
→ Please contact your administrator for an invite with account creation.
```

### Helpful Guidance

When an unregistered user reaches the login page **from an invite link**, they see:

```
Don't have an account yet?

If you have an invitation code, your account will be created 
when you complete the invite acceptance process.

1. Contact your administrator for an invite with account creation
2. Click the invite link they send you
3. A new account will be created automatically
```

This guidance **only appears** when:
- User is on login page with `returnUrl` containing `/invites/`
- Error message contains "not found"

## Firebase Error Code Handling

The updated login page handles these Firebase errors gracefully:

| Error Code | Message |
|-----------|---------|
| `auth/user-not-found` | "Account not found. Please contact your administrator..." |
| `auth/wrong-password` | "Invalid password. Please try again." |
| `auth/invalid-email` | "Invalid email address." |
| `auth/user-disabled` | "Your account has been disabled. Please contact..." |
| Other | "Login failed: [original error]" |

## Architecture Flow

```
User without Firebase account clicks invite
                ↓
Redirected to login (unauthenticated)
                ↓
Enters email/password
                ↓
Firebase returns "user-not-found"
                ↓
System checks if coming from invite (/invites/ in returnUrl)
                ↓
Shows helpful message:
"Contact admin for invite with account creation"
                ↓
User contacts admin for proper invite
                ↓
Admin sends invite with account creation
                ↓
Invite acceptance creates Firebase account automatically
                ↓
User can now accept invite and access dashboard
```

## How Account Creation via Invite Should Work

When an **admin creates an invite**, they should have an option to:
- "Create account on accept" - Creates Firebase account when invite is accepted
- "Account exists" - Expects user to already have Firebase account

**Note:** This requires backend changes to support account creation during invite acceptance.

## Current Workflow (What Works Now)

1. **Admin** creates invite in admin panel
2. **Admin** ensures user already has a Firebase account
3. **User** clicks invite link
4. **User** logs in with existing credentials
5. **User** enters 6-digit code to accept invite
6. **User** is granted admin role

## Improved Workflow (Recommended for Backend)

1. **Admin** creates invite with "Create account" option
2. **Admin** shares invite link with user
3. **User** clicks invite link (no login required)
4. **User** enters 6-digit code
5. **Backend** creates Firebase account automatically
6. **User** is granted admin role (no separate login needed)
7. **User** redirects to dashboard with auto-login

## Changes Made

### 1. [app/login/page.tsx](app/login/page.tsx)
- Added `useSearchParams` to read `returnUrl`
- Enhanced error handling for Firebase auth errors
- Added helpful guidance for users coming from invite links
- Better error messages for different auth failure scenarios

### 2. [app/invites/[inviteId]/page.tsx](app/invites/[inviteId]/page.tsx)
- Store invite ID in sessionStorage for better UX tracking
- Future enhancement: Use stored invite ID for better error handling

## User Experience Improvements

✅ Clear error messages instead of generic "Login failed"
✅ Contextual help for users without accounts
✅ Guidance on how to get a proper invite
✅ Better navigation flow

## Recommended Backend Enhancement

To fully support unregistered users accepting invites:

```
POST /api/invites/{inviteId}/accept

Request:
{
  code: string,
  createAccount?: boolean,  // If true, create Firebase account
  email?: string,           // Email for account creation
  password?: string         // Initial password
}

Response:
{
  success: boolean,
  role: InviteRole,
  municipalityCode: string,
  message: string,
  userId?: string,          // Return user ID if account created
  accessToken?: string,     // Auto-login token if account created
  refreshToken?: string
}
```

This would enable true one-click invite acceptance without requiring pre-existing Firebase accounts.
