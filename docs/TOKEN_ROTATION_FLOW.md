# Token Rotation Implementation Guide

## Overview

This document describes the token rotation implementation for the e-citizen frontend application. The system uses a **hybrid strategy** combining both **active** and **reactive** token refresh:

- **Active Refresh**: Proactively refreshes tokens before expiration using the `useTokenRotation` hook
- **Reactive Refresh**: Automatically refreshes tokens when API requests fail with 401 status

## Token Flow

### 1. Login Flow

```
User Login
    ↓
exchangeFirebaseToken() 
    ↓
GET /api/identity/token (with Firebase token)
    ↓
Response: { success: true, data: { accessToken, refreshToken, expiresIn } }
    ↓
Store in localStorage:
  - auth_user
  - auth_token (access token)
  - auth_refresh_token (refresh token)
    ↓
User Authenticated
```

**Endpoint**: `POST /api/identity/token`

**Request Headers**:
```json
{
  "Authorization": "Bearer {firebaseToken}",
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "firebaseUid": "user-firebase-uid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 120,
    "tokenType": "Bearer"
  },
  "timestamp": "2026-01-08T01:43:37.635Z"
}
```

### 2. Active Token Refresh (Proactive)

The `useTokenRotation` hook monitors token expiration and automatically refreshes before it expires.

```
Token exists
    ↓
useTokenRotation hook activated
    ↓
Calculate time until expiration
    ↓
Time remaining > threshold (60s)?
    │
    ├─ YES: Schedule refresh for (expiration - threshold)
    │
    └─ NO: Refresh immediately
        ↓
        POST /api/identity/refresh
        ↓
        Response: { success: true, data: { accessToken, refreshToken, expiresIn } }
        ↓
        Update tokens in localStorage
        ↓
        Reschedule next refresh
```

**Endpoint**: `POST /api/identity/refresh`

**Request Headers**:
```json
{
  "Authorization": "Bearer {currentAccessToken}",
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "refreshToken": "{refreshTokenFromStorage}"
}
```

**Response** (same as login):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 120,
    "tokenType": "Bearer"
  },
  "timestamp": "2026-01-08T01:43:40.864Z"
}
```

### 3. Reactive Token Refresh (On 401)

If a request fails with 401 status, the API client automatically attempts to refresh the token.

```
API Request
    ↓
Add Authorization header: "Bearer {accessToken}"
    ↓
Send request
    ↓
Response 401 Unauthorized?
    │
    ├─ YES: Attempt token refresh
    │   ↓
    │   POST /api/identity/refresh
    │   ↓
    │   Refresh successful?
    │   │
    │   ├─ YES: Get new token
    │   │   ↓
    │   │   Update Authorization header
    │   │   ↓
    │   │   Retry original request
    │   │
    │   └─ NO: Clear auth & redirect to /citizen/home
    │
    └─ NO: Process response normally
```

## Implementation Details

### Auth Store (`lib/auth/store.ts`)

Functions for managing authentication state:

```typescript
// Get/set auth user and tokens
getAuthUser()                              // Get current user
getAuthToken()                             // Get access token
getRefreshToken()                          // Get refresh token
setAuth(user, accessToken, refreshToken)   // Store auth data
updateAccessToken(newToken)                // Update only access token
updateTokens(newAccess, newRefresh)        // Update both tokens
clearAuth()                                // Clear all auth data
```

### Auth Service (`lib/services/authService.ts`)

Core authentication functions:

```typescript
// Login with Firebase token
loginWithFirebaseToken(firebaseToken, firebaseUid)

// Refresh access token
refreshAccessToken()  // Returns { success, token, data, error }

// Logout
logout()
```

### Token Rotation Hook (`hooks/useTokenRotation.ts`)

Automatically refresh tokens before expiration:

```typescript
useTokenRotation({
  enabled: true,                    // Enable/disable hook
  refreshThresholdMs: 60000,        // Refresh 60s before expiration
  onTokenExpired: () => {},         // Callback when token expires
  onTokenRefreshed: () => {},       // Callback after successful refresh
  onError: (error) => {}            // Callback on errors
})
```

### API Client (`lib/api/client.ts`)

Axios interceptors handle:
- Automatic token refresh on 401
- Queue multiple requests during refresh
- Retry failed requests with new token

## Token Lifetime

Based on the provided endpoint responses:

- **Access Token**: 120 seconds (2 minutes)
- **Refresh Token**: 7 days
- **Refresh Threshold**: 60 seconds before expiration

### Timeline Example

```
0s:   Login → Token issued (expires at 120s)
60s:  useTokenRotation triggers refresh (60s before expiration)
120s: New token issued (expires at 240s)
180s: useTokenRotation triggers refresh (60s before expiration)
```

## Error Handling

### Refresh Token Invalid
- Clear all auth data
- Redirect to `/citizen/home` (logout)
- User must log in again

### Network Error During Refresh
- Log error
- Call `onError` callback
- Fallback to reactive refresh on next API request

### Multiple 401 Responses
- Queue additional requests while first refresh is in progress
- Execute all queued requests after successful refresh

## Usage in Components

### Enable Token Rotation

In your layout or main app component:

```typescript
'use client';

import { useTokenRotation } from '@/hooks/useTokenRotation';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const auth = useAuth();

  // Enable automatic token refresh
  useTokenRotation({
    enabled: auth.isAuthenticated,
    onTokenExpired: () => {
      console.log('Token expired, user needs to log in');
      // Logout or redirect handled by API client
    },
    onError: (error) => {
      console.error('Token rotation error:', error);
    },
  });

  return (
    <html>
      <body>{/* content */}</body>
    </html>
  );
}
```

### Use Authentication

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useTokenRotation } from '@/hooks/useTokenRotation';

export function MyComponent() {
  const { user, token, isAuthenticated } = useAuth();
  
  // Enable token rotation
  useTokenRotation();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Logged in as: {user?.id}</p>
      <p>Role: {user?.role}</p>
      <p>Token active: {!!token}</p>
    </div>
  );
}
```

## Testing Token Rotation

### Scenario 1: Proactive Refresh
1. User logs in
2. Wait until 60 seconds before token expires
3. Check console logs for `[TokenRotation] ✅ Token refreshed successfully`
4. Verify token was renewed

### Scenario 2: Reactive Refresh
1. User logs in
2. Wait for token to expire naturally
3. Make any API request
4. Observe 401 response → automatic refresh → request retry
5. Check console logs for `[API Client] ✅ Token refreshed via API interceptor`

### Scenario 3: Refresh Token Expiration
1. Wait 7 days (or modify token lifetime in backend)
2. Try to refresh
3. Observe redirect to `/citizen/home` (logout)

## Debugging

Enable debug logging by checking browser console:

```
[TokenRotation] Token refresh scheduled
[TokenRotation] ✅ Token refreshed successfully
[TokenRotation] Token expiring soon, refreshing immediately
[API Client] ✅ Token refreshed via API interceptor
[API Client] Retrying original request with new token
```

## Security Considerations

1. **Secure Storage**: Tokens stored in localStorage (consider using secure cookie for refresh token in production)
2. **Short Expiration**: Access tokens expire in 2 minutes (120s)
3. **Refresh Window**: Large refresh window (7 days) allows users to stay logged in
4. **Token Validation**: Tokens validated before storage
5. **Bearer Token**: Standard Bearer scheme in Authorization header
6. **HTTPS Only**: Ensure all requests use HTTPS in production

## Future Improvements

1. Move refresh token to secure HTTP-only cookie
2. Implement token revocation endpoint
3. Add token introspection for admin functionality
4. Implement refresh token rotation (issue new refresh with each refresh)
5. Add request queuing for better performance under load
