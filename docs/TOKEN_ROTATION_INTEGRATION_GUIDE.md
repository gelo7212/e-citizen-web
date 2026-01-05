# Token Rotation Integration Guide

## Quick Start

### 1. Add Token Rotation to Root Layout

In `app/layout.tsx`, enable automatic token rotation:

```typescript
'use client';

import { useTokenRotation } from '@/hooks/useTokenRotation';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // Enable token rotation when user is authenticated
  useTokenRotation({
    enabled: !!user,
    checkInterval: 60000, // Check every 60 seconds
    onTokenRefreshed: (newToken) => {
      console.log('✅ Token automatically refreshed');
    },
    onTokenExpired: () => {
      console.log('❌ Token expired, please login again');
      // Redirect to login or show modal
    },
    onError: (error) => {
      console.error('⚠️ Token rotation error:', error);
    },
  });

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Use in Components That Make API Calls

Before making authenticated requests, check token expiration:

```typescript
import { getAuthToken } from '@/lib/auth/store';
import { willTokenExpireSoon } from '@/lib/auth/tokenRotation';
import { refreshAccessToken } from '@/lib/services/authService';

export async function fetchSOSEvents() {
  let token = getAuthToken();

  // Refresh if expiring soon
  if (willTokenExpireSoon(token)) {
    const result = await refreshAccessToken();
    if (result.success && result.token) {
      token = result.token;
    }
  }

  const response = await fetch('/api/sos-events', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}
```

### 3. WebSocket Connections

The `useSOSSocket` hook already integrates token rotation:

```typescript
const { socket, isConnected } = useSOSSocket({
  token: currentToken,
  sosId: 'sos-123',
  enabled: true,
  // Hook automatically checks token before connecting
  // and handles refresh if needed
});
```

## Integration Locations

### High Priority (Implement First)

1. **Root Layout** (`app/layout.tsx`)
   ```typescript
   useTokenRotation({ enabled: !!user });
   ```
   - Enables automatic token management globally
   - Runs on every page load

2. **Admin Dashboard** (`app/admin/dashboard/page.tsx`)
   ```typescript
   const response = await refreshTokenIfNeeded(token, refreshAccessToken);
   ```
   - Critical operations need fresh tokens
   - Protects long-running pages

3. **SOS Pages** (`app/admin/sos/page.tsx`)
   ```typescript
   const { socket, isConnected } = useSOSSocket({
     token: currentToken,
     // Token rotation integrated
   });
   ```
   - WebSocket connections need valid tokens
   - Uses integrated token rotation

### Medium Priority

4. **API Service Wrapper**
   ```typescript
   // lib/api/client.ts
   export async function fetchWithTokenRefresh(
     endpoint: string,
     options?: RequestInit
   ) {
     let token = getAuthToken();

     if (willTokenExpireSoon(token)) {
       const result = await refreshAccessToken();
       if (result.token) token = result.token;
     }

     return fetch(endpoint, {
       ...options,
       headers: {
         ...options?.headers,
         Authorization: `Bearer ${token}`,
       },
     });
   }
   ```

5. **Auth Context Provider**
   - Track token refresh events
   - Trigger UI updates on token change
   - Manage refresh token failures

### Low Priority (Optional)

6. **Service Workers**
   - Cache refresh tokens securely
   - Handle offline token refresh
   - Implement token pre-fetch

## Testing Token Rotation

### Test 1: Check Token Expiration

```typescript
import { getTokenTimeRemaining, willTokenExpireSoon } from '@/lib/auth/tokenRotation';
import { getAuthToken } from '@/lib/auth/store';

// In browser console
const token = getAuthToken();
console.log('Token time remaining:', getTokenTimeRemaining(token) / 1000 + 's');
console.log('Will expire soon?', willTokenExpireSoon(token));
```

### Test 2: Trigger Manual Refresh

```typescript
import { refreshAccessToken } from '@/lib/services/authService';

// In browser console
const result = await refreshAccessToken();
console.log('Refresh result:', result);
```

### Test 3: Monitor Automatic Rotation

1. Open DevTools Console
2. Look for logs starting with `[TokenRotation]`
3. Create a token that expires in ~10 minutes
4. Watch the automatic refresh trigger
5. Verify new token is stored in localStorage

### Test 4: WebSocket Token Rotation

```typescript
// pages/admin/sos/page.tsx
console.log('[TEST] Token before connection:', getAuthToken().substring(0, 20) + '...');

const { socket, isConnected } = useSOSSocket({
  token: getAuthToken(),
  sosId: 'test-sos-123',
  enabled: true,
});

// After 5+ minutes, check if token was rotated
useEffect(() => {
  const checkToken = () => {
    console.log('[TEST] Token after rotation:', getAuthToken().substring(0, 20) + '...');
  };
  const timer = setTimeout(checkToken, 6 * 60 * 1000);
  return () => clearTimeout(timer);
}, []);
```

## Environment Setup

### Development

```env
# .env.local
NEXT_PUBLIC_BFF_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Production

```env
# .env.production
NEXT_PUBLIC_BFF_URL=https://api.example.com
NEXT_PUBLIC_WS_URL=wss://api.example.com
```

## Monitoring & Debugging

### 1. Enable Console Logging

The implementation logs all token rotation events:

```
[TokenRotation] Token valid, expires in 245s
[TokenRotation] Token expiring in 234s, attempting refresh...
[TokenRotation] ✅ Token refreshed successfully
[TokenRotation] ❌ Token refresh failed: Network error
```

### 2. Check localStorage

```javascript
// Browser DevTools Console
localStorage.auth_token           // Current access token
localStorage.auth_refresh_token   // Refresh token
localStorage.auth_user            // User info
```

### 3. Network Tab Monitoring

- Look for `POST /api/identity/refresh` requests
- Verify response contains new accessToken
- Check response status is 200

### 4. Performance Monitoring

```typescript
const startTime = performance.now();
const result = await refreshAccessToken();
const duration = performance.now() - startTime;

console.log(`Token refresh took ${duration}ms`);
```

## Troubleshooting

### Issue: Token never refreshes

**Check:**
1. Is `useTokenRotation` hook enabled?
2. Is user authenticated (`getAuthToken()` returns value)?
3. Are logs showing `[TokenRotation]` messages?

**Fix:**
```typescript
// Debug in root layout
useTokenRotation({
  enabled: !!user,
  onTokenRefreshed: (token) => {
    console.log('✅ Token refreshed:', token.substring(0, 20) + '...');
  },
});
```

### Issue: Refresh token missing

**Check:**
```typescript
console.log('Auth token:', localStorage.auth_token ? 'present' : 'missing');
console.log('Refresh token:', localStorage.auth_refresh_token ? 'present' : 'missing');
```

**Fix:**
- Ensure `/token` endpoint response includes `refreshToken`
- Check `loginWithFirebaseToken` stores refresh token
- Verify localStorage keys match exactly

### Issue: WebSocket disconnects after 1 hour

**Cause:** Token expired, connection uses old token

**Fix:**
```typescript
const { socket } = useSOSSocket({
  token: currentToken, // Update token when rotated
  onError: () => {
    // Reconnect with new token
    setCurrentToken(getAuthToken());
  },
});
```

### Issue: "Token refresh failed" errors

**Check:**
1. Is refresh token valid? `console.log(localStorage.auth_refresh_token)`
2. Is `/api/identity/refresh` endpoint working?
3. Is `NEXT_PUBLIC_BFF_URL` set correctly?

**Debug:**
```typescript
import { decodeTokenPayload } from '@/lib/auth/tokenRotation';

const refreshToken = localStorage.auth_refresh_token;
const payload = decodeTokenPayload(refreshToken);
console.log('Refresh token payload:', payload);
console.log('Expires:', new Date(payload.exp * 1000).toLocaleString());
```

## FAQ

**Q: How often are tokens checked?**
A: By default, every 60 seconds. Adjustable via `checkInterval` option.

**Q: What happens if refresh fails?**
A: Hook calls `onError` callback. Component can redirect to login or retry.

**Q: Is refresh token secure?**
A: Stored in localStorage (not HttpOnly). Consider upgrading to IndexedDB with encryption for enhanced security.

**Q: Can I disable automatic rotation?**
A: Yes, set `enabled: false` in `useTokenRotation` options.

**Q: Does this work with server-side rendering?**
A: No, token rotation is client-side only. SSR pages use API routes for authentication.

**Q: What's the difference between refresh token and access token?**
A: Access token (short-lived) is used for API requests. Refresh token (long-lived) obtains new access tokens.

## Related Documentation

- [Token Rotation Implementation](./TOKEN_ROTATION.md)
- [Auth Service](../lib/services/authService.ts)
- [JWT Utilities](../lib/auth/jwt.ts)
- [WebSocket Integration](../components/admin/sos/WEBSOCKET_INTEGRATION.md)
