# Token Rotation Implementation

## Overview

Token rotation is automatically implemented in the application to prevent authentication failures due to token expiration. The system proactively checks if tokens will expire within 5 minutes and refreshes them before expiration.

## Components

### 1. **Token Rotation Utility** (`lib/auth/tokenRotation.ts`)

Core utility functions for token expiration checking and management:

- **`willTokenExpireSoon(token: string): boolean`**
  - Checks if a token will expire within 5 minutes
  - Returns `true` if expiration is within 5 minutes
  - Returns `true` for invalid/malformed tokens

- **`getTokenTimeRemaining(token: string): number | null`**
  - Returns milliseconds until token expires
  - Returns `null` if token is invalid

- **`isTokenExpired(token: string): boolean`**
  - Returns `true` if token is completely expired

- **`refreshTokenIfNeeded(currentToken, refreshFn): Promise<...>`**
  - Checks if refresh is needed
  - Calls the refresh function if necessary
  - Returns result with new token and refresh status

- **`scheduleTokenRotation(getToken, refreshFn, checkInterval): () => void`**
  - Sets up periodic token checks
  - Returns cleanup function

### 2. **Auth Service Enhancement** (`lib/services/authService.ts`)

Updated `refreshAccessToken()` function:

- **Endpoint:** `POST /refresh`
- **Request Header:** `Authorization: Bearer {refreshToken}`
- **Response Format:** Same as token exchange
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "new_jwt_token",
      "refreshToken": "new_refresh_token",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    }
  }
  ```
- **Storage:** Updates both `auth_token` and `auth_refresh_token` in localStorage
- **Validation:** Decodes new token before storing

### 3. **Token Rotation Hook** (`hooks/useTokenRotation.ts`)

Custom React hook for automatic token management:

```typescript
const { checkAndRefreshToken } = useTokenRotation({
  enabled: true,
  checkInterval: 60000, // Check every 60 seconds
  onTokenRefreshed: (newToken) => console.log('Token refreshed'),
  onTokenExpired: () => console.log('Token expired'),
  onError: (error) => console.log('Error:', error),
});
```

**Features:**
- Periodic token checks (default: every 60 seconds)
- Proactive refresh when expiration is within 5 minutes
- Error handling and callbacks
- Automatic cleanup on unmount

### 4. **WebSocket Integration** (`hooks/useSOSSocket.ts`)

Token rotation checks integrated into WebSocket connection:

- **Pre-connection Check:** Validates token before creating WebSocket
- **Expired Token:** Attempts refresh if token is expired
- **Expiring Soon:** Logs warning if token will expire within 5 minutes
- **Auto-disconnect:** Handles connection failures due to invalid tokens

## Token Expiration Timeline

```
Current Time ──── 5 min ──── Expiration Time
                     ▲
              REFRESH WINDOW
            (proactive refresh)
```

The system monitors token expiration in three states:

1. **Valid & Safe** (>5 min until expiration)
   - Token is used normally
   - Periodic checks continue

2. **Expiring Soon** (≤5 min until expiration)
   - Proactive refresh triggered
   - New token obtained from `/refresh` endpoint
   - Old token still valid for ongoing requests

3. **Expired** (<0 sec, past expiration)
   - Cannot be used
   - Immediate refresh attempt required
   - Connection failures trigger refresh retry

## Usage Examples

### Example 1: Using Token Rotation Hook

```typescript
'use client';

import { useTokenRotation } from '@/hooks/useTokenRotation';
import { useAuth } from '@/hooks/useAuth';

export function AdminDashboard() {
  const { user } = useAuth();

  // Enable automatic token rotation
  useTokenRotation({
    enabled: !!user,
    checkInterval: 60000,
    onTokenRefreshed: (newToken) => {
      console.log('🔄 Token rotated automatically');
    },
    onTokenExpired: () => {
      console.log('⚠️ Token expired, redirecting to login');
      // Redirect to login
    },
  });

  return <div>Dashboard content</div>;
}
```

### Example 2: Manual Token Check Before Request

```typescript
import { getAuthToken } from '@/lib/auth/store';
import { willTokenExpireSoon } from '@/lib/auth/tokenRotation';
import { refreshAccessToken } from '@/lib/services/authService';

async function makeAuthenticatedRequest() {
  let token = getAuthToken();

  if (willTokenExpireSoon(token)) {
    const result = await refreshAccessToken();
    if (result.success && result.token) {
      token = result.token;
    }
  }

  // Make request with valid token
  return fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

### Example 3: WebSocket with Token Rotation

```typescript
const { socket, isConnected } = useSOSSocket({
  token: currentToken,
  sosId: 'sos-123',
  enabled: true,
  onError: (error) => {
    console.log('WebSocket error:', error);
    // Hook will automatically attempt token refresh if expired
  },
});
```

## API Endpoints

### Token Exchange (Login)
```
POST /api/identity/token
Authorization: Bearer {firebaseToken}
Content-Type: application/json

{
  "firebaseUid": "user-123"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

### Token Refresh
```
POST /api/identity/refresh
Authorization: Bearer {refreshToken}
Content-Type: application/json

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

## Token Storage

Tokens are stored in localStorage:

```typescript
localStorage.auth_token           // Current access token (JWT)
localStorage.auth_refresh_token   // Refresh token (JWT)
localStorage.auth_user            // User object (JSON)
```

## Configuration

### Thresholds

- **Refresh Window:** 5 minutes (300,000 ms)
- **Check Interval:** 60 seconds (configurable)
- **Max Retry Attempts:** 5 (built into Socket.IO)

### Environment Variables

```env
# Backend URL for token refresh
NEXT_PUBLIC_BFF_URL=http://api.example.com

# WebSocket URL
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Error Handling

### Scenarios

1. **No Refresh Token**
   - User redirected to login
   - Clear localStorage and redirect to `/login`

2. **Refresh Token Invalid**
   - Session is terminated
   - User must re-login with Firebase

3. **Network Error During Refresh**
   - Retry with exponential backoff
   - Fall back to existing token
   - Log error for monitoring

4. **Invalid Token Payload**
   - Token not stored
   - Refresh retry triggered
   - Error logged

## Best Practices

1. **Enable Token Rotation Hook** in root layouts
   ```typescript
   // app/layout.tsx
   export default function RootLayout() {
     useTokenRotation({ enabled: true });
     return <>{children}</>;
   }
   ```

2. **Check Token Before Critical Operations**
   ```typescript
   const token = getAuthToken();
   if (isTokenExpired(token)) {
     await refreshAccessToken();
   }
   ```

3. **Handle Refresh Failures**
   ```typescript
   const result = await refreshAccessToken();
   if (!result.success) {
     logout(); // Clear session and redirect
   }
   ```

4. **Monitor Token Expiration in Logs**
   - Watch for `[TokenRotation]` prefixed logs
   - Track refresh success/failure rates
   - Alert on repeated refresh failures

## Debugging

### Enable Debug Logging

All token rotation logs use `[TokenRotation]` prefix:

```
[TokenRotation] Token will expire soon, refreshing proactively
[TokenRotation] Token expiring in 245s, refreshing...
[TokenRotation] ✅ Token refreshed successfully
[TokenRotation] ❌ Token refresh failed: Network error
```

### Check Token Status

```typescript
import { getTokenTimeRemaining, isTokenExpired } from '@/lib/auth/tokenRotation';
import { getAuthToken } from '@/lib/auth/store';

const token = getAuthToken();
const timeRemaining = getTokenTimeRemaining(token);
const isExpired = isTokenExpired(token);

console.log('Token status:', {
  isExpired,
  timeRemaining: timeRemaining ? `${Math.round(timeRemaining / 1000)}s` : 'unknown',
});
```

## Future Enhancements

1. **Sliding Window Tokens**
   - Extend token expiration with each request

2. **Token Pre-Refresh**
   - Refresh before each critical operation

3. **Silent Token Refresh**
   - Background refresh without user interruption

4. **Token Revocation**
   - Add endpoint to revoke tokens on logout

5. **Device Binding**
   - Bind tokens to device fingerprint
