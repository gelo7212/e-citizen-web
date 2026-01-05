# Token Rotation - Code Examples & Quick Reference

## Quick Reference

### Check Token Status
```typescript
import { getAuthToken } from '@/lib/auth/store';
import { getTokenTimeRemaining, willTokenExpireSoon, isTokenExpired } from '@/lib/auth/tokenRotation';

const token = getAuthToken();

// Check if expired
if (isTokenExpired(token)) {
  console.log('❌ Token is expired');
}

// Check if expiring soon (within 5 minutes)
if (willTokenExpireSoon(token)) {
  console.log('⚠️ Token expiring soon');
}

// Get time remaining
const timeRemaining = getTokenTimeRemaining(token);
console.log(`⏱️ Token expires in ${Math.round(timeRemaining / 1000)}s`);
```

### Refresh Token Manually
```typescript
import { refreshAccessToken } from '@/lib/services/authService';

const result = await refreshAccessToken();

if (result.success) {
  console.log('✅ Token refreshed, new token:', result.token);
} else {
  console.error('❌ Refresh failed:', result.error);
}
```

### Enable Automatic Rotation
```typescript
import { useTokenRotation } from '@/hooks/useTokenRotation';

// In component
useTokenRotation({
  enabled: true,
  checkInterval: 60000,
  onTokenRefreshed: (newToken) => console.log('Refreshed'),
  onTokenExpired: () => console.log('Expired'),
  onError: (error) => console.error('Error:', error),
});
```

---

## Code Examples by Use Case

### Example 1: Add Token Rotation to Root Layout

**File:** `app/layout.tsx`

```typescript
'use client';

import { useTokenRotation } from '@/hooks/useTokenRotation';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();

  // Enable automatic token rotation
  useTokenRotation({
    enabled: !!user,
    checkInterval: 60000, // Check every 60 seconds
    onTokenRefreshed: (newToken) => {
      console.log('✅ Token automatically refreshed');
      // Token is already saved in localStorage by refreshAccessToken()
    },
    onTokenExpired: () => {
      console.log('❌ Token expired, redirecting to login');
      router.push('/login');
    },
    onError: (error) => {
      console.error('⚠️ Token rotation error:', error);
    },
  });

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

### Example 2: Protect API Calls Before Sending

**File:** `lib/api/client.ts`

```typescript
import { getAuthToken } from '@/lib/auth/store';
import { willTokenExpireSoon } from '@/lib/auth/tokenRotation';
import { refreshAccessToken } from '@/lib/services/authService';

/**
 * Fetch with automatic token refresh
 */
export async function fetchWithTokenRefresh(
  url: string,
  options?: RequestInit
) {
  let token = getAuthToken();

  if (!token) {
    throw new Error('No auth token available');
  }

  // Refresh if expiring soon
  if (willTokenExpireSoon(token)) {
    console.log('[API] Token expiring soon, refreshing...');
    const refreshResult = await refreshAccessToken();
    if (refreshResult.success && refreshResult.token) {
      token = refreshResult.token;
    } else {
      console.error('[API] Token refresh failed:', refreshResult.error);
      // Continue with old token, may fail if too close to expiration
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}
```

Usage:
```typescript
const data = await fetchWithTokenRefresh('/api/sos-events');
```

---

### Example 3: WebSocket with Token Rotation

**File:** `components/admin/sos/SOSMap.tsx`

```typescript
'use client';

import { useSOSSocket } from '@/hooks/useSOSSocket';
import { getAuthToken } from '@/lib/auth/store';
import { useState } from 'react';

export function SOSMap({ sosId }: { sosId: string }) {
  const [isReady, setIsReady] = useState(false);
  const token = getAuthToken();

  // useSOSSocket automatically checks token before connecting
  // and handles refresh if needed
  const { socket, isConnected, error } = useSOSSocket({
    token,
    sosId,
    enabled: !!token && !!sosId,
    onLocationUpdate: (data) => {
      console.log('📍 Location update:', data);
    },
    onMessageBroadcast: (data) => {
      console.log('💬 New message:', data.content);
    },
    onError: (error) => {
      console.error('❌ WebSocket error:', error);
      // Hook will automatically try to refresh token if disconnected
    },
  });

  if (error) {
    return <div className="error">Connection error: {error}</div>;
  }

  return (
    <div className="map-container">
      <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      {/* Map content */}
    </div>
  );
}
```

---

### Example 4: Service with Token Refresh

**File:** `lib/services/sosService.ts`

```typescript
import { getAuthToken } from '@/lib/auth/store';
import { willTokenExpireSoon, isTokenExpired } from '@/lib/auth/tokenRotation';
import { refreshAccessToken } from '@/lib/services/authService';
import { fetchWithTokenRefresh } from '@/lib/api/client';

export class SOSService {
  /**
   * Get all SOS events with automatic token refresh
   */
  static async getEvents(filters?: { status?: string; cityId?: string }) {
    const query = new URLSearchParams(filters as any).toString();
    return fetchWithTokenRefresh(`/api/sos-events?${query}`);
  }

  /**
   * Create a new SOS event
   */
  static async createEvent(data: { location: string; priority: string }) {
    return fetchWithTokenRefresh('/api/sos-events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update SOS event status with token check
   */
  static async updateStatus(sosId: string, status: string) {
    let token = getAuthToken();

    // Check if we need to refresh
    if (isTokenExpired(token)) {
      console.warn('Token expired, refreshing before update...');
      const result = await refreshAccessToken();
      if (!result.success) {
        throw new Error('Failed to refresh token');
      }
      token = result.token || token;
    }

    return fetch(`/api/sos-events/${sosId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    }).then((res) => res.json());
  }
}
```

Usage:
```typescript
const events = await SOSService.getEvents({ status: 'active' });
await SOSService.updateStatus('sos-123', 'CLOSED');
```

---

### Example 5: Monitor Token Status in Component

**File:** `components/admin/TokenStatus.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/auth/store';
import {
  getTokenTimeRemaining,
  isTokenExpired,
  willTokenExpireSoon,
} from '@/lib/auth/tokenRotation';

export function TokenStatus() {
  const [tokenStatus, setTokenStatus] = useState<{
    isExpired: boolean;
    expiringsSoon: boolean;
    timeRemaining: string;
  } | null>(null);

  useEffect(() => {
    const checkToken = () => {
      const token = getAuthToken();
      if (!token) return;

      const timeRemaining = getTokenTimeRemaining(token);
      const isExpired = isTokenExpired(token);
      const expiringsSoon = willTokenExpireSoon(token);

      setTokenStatus({
        isExpired,
        expiringsSoon,
        timeRemaining: timeRemaining
          ? `${Math.round(timeRemaining / 1000)}s`
          : 'unknown',
      });
    };

    checkToken();
    const interval = setInterval(checkToken, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, []);

  if (!tokenStatus) return null;

  return (
    <div className="token-status">
      <div
        className={`status-badge ${
          tokenStatus.isExpired
            ? 'expired'
            : tokenStatus.expiringsSoon
              ? 'warning'
              : 'valid'
        }`}
      >
        {tokenStatus.isExpired ? (
          <>
            <span className="icon">⚠️</span> Token Expired
          </>
        ) : tokenStatus.expiringsSoon ? (
          <>
            <span className="icon">⏰</span> Expiring in {tokenStatus.timeRemaining}
          </>
        ) : (
          <>
            <span className="icon">✅</span> Valid ({tokenStatus.timeRemaining})
          </>
        )}
      </div>
    </div>
  );
}
```

Usage in layout:
```typescript
import { TokenStatus } from '@/components/admin/TokenStatus';

export default function AdminLayout({ children }) {
  return (
    <div>
      <TokenStatus />
      {children}
    </div>
  );
}
```

---

### Example 6: Handle Token Expiration in Error Boundary

**File:** `components/ErrorBoundary.tsx`

```typescript
'use client';

import React from 'react';
import { isTokenExpired } from '@/lib/auth/tokenRotation';
import { refreshAccessToken } from '@/lib/services/authService';
import { getAuthToken } from '@/lib/auth/store';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error) {
    // Check if error is due to expired token
    const token = getAuthToken();
    if (token && isTokenExpired(token)) {
      console.log('Token expired, attempting refresh...');
      const result = await refreshAccessToken();

      if (result.success) {
        console.log('✅ Token refreshed, reloading...');
        // Reload the page with new token
        window.location.reload();
      } else {
        console.error('❌ Token refresh failed, redirecting to login');
        window.location.href = '/login';
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>Please try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### Example 7: Test Token Rotation in Development

**File:** `pages/admin/debug/token-status.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/auth/store';
import {
  getTokenTimeRemaining,
  isTokenExpired,
  willTokenExpireSoon,
} from '@/lib/auth/tokenRotation';
import { refreshAccessToken } from '@/lib/services/authService';

export default function TokenDebugPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const updateStatus = () => {
    const token = getAuthToken();
    if (!token) {
      setStatus({ error: 'No token found' });
      return;
    }

    const timeRemaining = getTokenTimeRemaining(token);
    setStatus({
      hasToken: true,
      isExpired: isTokenExpired(token),
      expiringsSoon: willTokenExpireSoon(token),
      timeRemaining: timeRemaining ? `${Math.round(timeRemaining / 1000)}s` : null,
      tokenPreview: token.substring(0, 50) + '...',
    });
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await refreshAccessToken();
      if (result.success) {
        alert('✅ Token refreshed successfully');
        updateStatus();
      } else {
        alert('❌ Token refresh failed: ' + result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔐 Token Debug</h1>

      {status?.error ? (
        <div style={{ color: 'red' }}>Error: {status.error}</div>
      ) : (
        <div>
          <div>Has Token: {status?.hasToken ? '✅' : '❌'}</div>
          <div>
            Status: {status?.isExpired ? '❌ Expired' : status?.expiringsSoon ? '⚠️ Expiring Soon' : '✅ Valid'}
          </div>
          <div>Time Remaining: {status?.timeRemaining || 'N/A'}</div>
          <div>Token: {status?.tokenPreview}</div>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={updateStatus} style={{ marginRight: '10px' }}>
          Refresh Status
        </button>
        <button onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Token'}
        </button>
      </div>

      <hr />
      <h3>Console Logs</h3>
      <p>
        Open DevTools Console and look for logs with prefix <code>[TokenRotation]</code>
      </p>
      <p>Example logs:</p>
      <pre>
        [TokenRotation] Token valid, expires in 245s
        {'\n'}
        [TokenRotation] Token expiring in 123s, attempting refresh...
        {'\n'}
        [TokenRotation] ✅ Token refreshed successfully
      </pre>
    </div>
  );
}
```

---

## Constants & Configuration

### Token Refresh Thresholds

```typescript
// From tokenRotation.ts
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

// Check interval (configurable per hook)
const DEFAULT_CHECK_INTERVAL = 60000; // 60 seconds
```

### localStorage Keys

```typescript
localStorage.auth_token              // Access token (JWT)
localStorage.auth_refresh_token      // Refresh token (JWT)
localStorage.auth_user               // User object (JSON)
```

### API Endpoints

```typescript
POST /api/identity/token     // Exchange Firebase token → access + refresh tokens
POST /api/identity/refresh   // Refresh access token → new access + refresh tokens
```

---

## Debugging Checklist

- [ ] Is token rotation hook enabled in root layout?
- [ ] Does `getAuthToken()` return a value?
- [ ] Are logs showing `[TokenRotation]` messages?
- [ ] Is `auth_refresh_token` in localStorage?
- [ ] Does `/api/identity/refresh` endpoint exist?
- [ ] Is `NEXT_PUBLIC_BFF_URL` set correctly?
- [ ] Check DevTools Network tab for refresh requests
- [ ] Verify token is not corrupted (check first 20 chars)

---

## Log Examples

### Healthy Token Rotation
```
[TokenRotation] Token valid, expires in 245s
[TokenRotation] Token valid, expires in 234s
[TokenRotation] Token will expire in 123s, refreshing...
[TokenRotation] ✅ Token refreshed successfully
[TokenRotation] Token valid, expires in 3598s
```

### Error Scenarios
```
[TokenRotation] Token is expired
[TokenRotation] ❌ Token refresh failed: Network error
[TokenRotation] Failed to decode token: Invalid format
[TokenRotation] No refresh token available
```

---

## See Also

- [TOKEN_ROTATION.md](./TOKEN_ROTATION.md) - Technical documentation
- [TOKEN_ROTATION_INTEGRATION_GUIDE.md](./TOKEN_ROTATION_INTEGRATION_GUIDE.md) - Integration guide
- [useTokenRotation Hook](../hooks/useTokenRotation.ts)
- [tokenRotation Utility](../lib/auth/tokenRotation.ts)
- [Auth Service](../lib/services/authService.ts)
