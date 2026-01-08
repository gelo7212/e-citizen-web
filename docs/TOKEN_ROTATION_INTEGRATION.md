/**
 * TOKEN ROTATION INTEGRATION EXAMPLES
 * 
 * This file shows how to integrate token rotation into your application components.
 * Copy these patterns into your actual components.
 */

// ============================================================================
// EXAMPLE 1: Root Layout (Recommended Location for useTokenRotation)
// ============================================================================

// app/layout.tsx or app/admin/layout.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useTokenRotation } from '@/hooks/useTokenRotation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();

  // ✅ ENABLE TOKEN ROTATION HERE
  // This hook will automatically refresh tokens before they expire
  useTokenRotation({
    enabled: isAuthenticated,
    refreshThresholdMs: 60000, // Refresh 60 seconds before expiration
    onTokenExpired: () => {
      console.log('🔴 Token expired, user logged out');
      // API client will handle redirect to login
    },
    onTokenRefreshed: () => {
      console.log('🟢 Token refreshed successfully');
    },
    onError: (error) => {
      console.error('❌ Token rotation error:', error);
    },
  });

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// ============================================================================
// EXAMPLE 2: Login Flow (Where tokens are first obtained)
// ============================================================================

// app/login/page.tsx or components/login/LoginForm.tsx
'use client';

import { loginWithFirebaseToken } from '@/lib/services/authService';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const { login } = useAuth();

  const handleLogin = async (firebaseToken: string, firebaseUid: string) => {
    try {
      const result = await loginWithFirebaseToken(firebaseToken, firebaseUid);

      if (result.success && result.data) {
        // ✅ Extract tokens from response
        const { accessToken, refreshToken } = result.data;

        // ✅ Create user object and store auth
        const user = {
          id: userId,
          role: userRole,
          scopes: userScopes,
          cityCode: cityCode,
          contextType: 'admin',
          firebaseUid,
        };

        // ✅ This stores both tokens automatically
        login(user, accessToken, refreshToken);

        console.log('✅ Logged in successfully');
        console.log('📋 Tokens stored:', {
          accessTokenExpires: 120, // seconds
          refreshTokenExpires: 7 * 24 * 60 * 60, // 7 days
        });

        // Redirect to dashboard
        router.push('/admin/dashboard');
      } else {
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      // handleLogin(...)
    }}>
      {/* Your form fields */}
    </form>
  );
}

// ============================================================================
// EXAMPLE 3: Protected Component (Using Authentication)
// ============================================================================

// components/admin/Dashboard.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useTokenRotation } from '@/hooks/useTokenRotation';

export function Dashboard() {
  const { user, token, isAuthenticated, isLoading } = useAuth();

  // ✅ Token rotation automatically enabled when component mounts
  // (if already enabled in layout, this is redundant but safe)
  useTokenRotation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.id}</p>
      <p>Role: {user?.role}</p>
      <p>Scopes: {user?.scopes?.join(', ')}</p>
      <p>Active Token: {token ? '✅ Valid' : '❌ Missing'}</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Making API Requests (Token automatically included)
// ============================================================================

// lib/services/sosService.ts or similar
import { apiClient, fetchData } from '@/lib/api/client';
import { ApiResponse } from '@/types';

// ✅ All requests automatically include Authorization header
// ✅ If token is expired, API client will refresh automatically

export async function getSOSList(): Promise<ApiResponse<any>> {
  // This request automatically includes:
  // headers: { Authorization: "Bearer {accessToken}" }
  return fetchData<any>('/api/sos/list');
}

export async function createSOS(data: any): Promise<ApiResponse<any>> {
  // This request automatically includes the token
  // If 401 response: token will be refreshed automatically
  // And the request will be retried
  return fetchData<any>('/api/sos/create', { method: 'POST', data });
}

// ============================================================================
// EXAMPLE 5: Manual Token Refresh (If Needed)
// ============================================================================

// For advanced scenarios where you need to manually refresh
'use client';

import { refreshAccessToken } from '@/lib/services/authService';
import { getAuthToken } from '@/lib/auth/store';

export function TokenDebugPanel() {
  const handleManualRefresh = async () => {
    try {
      const result = await refreshAccessToken();

      if (result.success) {
        console.log('✅ Manual refresh successful');
        console.log('New token:', getAuthToken());
      } else {
        console.error('Manual refresh failed:', result.error);
      }
    } catch (error) {
      console.error('Manual refresh error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleManualRefresh}>
        Manual Token Refresh
      </button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Token Status & Debugging
// ============================================================================

// components/debug/TokenStatus.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { getAuthToken, getRefreshToken } from '@/lib/auth/store';
import { getTokenTimeRemaining, isTokenExpired } from '@/lib/auth/tokenRotation';

export function TokenStatus() {
  const { isAuthenticated } = useAuth();
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  const timeRemaining = token ? getTokenTimeRemaining(token) : null;
  const isExpired = token ? isTokenExpired(token) : false;

  return (
    <div style={{ padding: '10px', border: '1px solid gray' }}>
      <h3>🔐 Token Status</h3>
      <p>Authenticated: {isAuthenticated ? '✅' : '❌'}</p>
      <p>Access Token: {token ? '✅ Set' : '❌ Missing'}</p>
      <p>Refresh Token: {refreshToken ? '✅ Set' : '❌ Missing'}</p>
      <p>Expired: {isExpired ? '🔴 Yes' : '🟢 No'}</p>
      <p>
        Time Remaining: {timeRemaining 
          ? `${(timeRemaining / 1000).toFixed(2)}s` 
          : 'N/A'}
      </p>
      <p>
        Refresh at: {timeRemaining && timeRemaining > 60000
          ? `${((timeRemaining - 60000) / 1000).toFixed(2)}s`
          : 'Imminent'}
      </p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Logout (Clears all tokens)
// ============================================================================

// components/auth/LogoutButton.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = () => {
    // This clears all auth data and tokens
    logout();
    
    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}

// ============================================================================
// EXAMPLE 8: Complete App Setup
// ============================================================================

// app/admin/layout.tsx - Full implementation
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useTokenRotation } from '@/hooks/useTokenRotation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  // ✅ Enable automatic token rotation
  useTokenRotation({
    enabled: isAuthenticated,
    refreshThresholdMs: 60000,
    onTokenExpired: () => {
      console.log('Token expired');
      router.push('/login');
    },
    onTokenRefreshed: () => {
      console.log('✅ Token refreshed at:', new Date().toLocaleTimeString());
    },
    onError: (error) => {
      console.error('Token error:', error);
    },
  });

  // ✅ Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return null; // Redirect in progress
  }

  return (
    <div>
      <header>
        <h1>Admin Panel</h1>
        <p>User: {user?.id}</p>
      </header>
      <main>{children}</main>
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Token Expiration Handler
// ============================================================================

// Implement in components that need to react to token state changes
'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/auth/store';
import { getTokenTimeRemaining } from '@/lib/auth/tokenRotation';

export function TokenExpirationWarning() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // Update time left every second
    const interval = setInterval(() => {
      const remaining = getTokenTimeRemaining(token);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Show warning when token is expiring in next 30 seconds
  if (timeLeft && timeLeft < 30000) {
    return (
      <div style={{
        padding: '10px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '4px',
      }}>
        ⚠️ Your session will expire in {(timeLeft / 1000).toFixed(0)} seconds
      </div>
    );
  }

  return null;
}

// ============================================================================
// INTEGRATION CHECKLIST
// ============================================================================

/*
✅ TOKEN ROTATION INTEGRATION CHECKLIST

1. Auth Store Update
   - [x] getRefreshToken() function
   - [x] updateAccessToken() function
   - [x] updateTokens() function
   - [x] setAuth() accepts refresh token

2. Auth Service Update
   - [x] loginWithFirebaseToken() stores both tokens
   - [x] refreshAccessToken() calls /api/identity/refresh
   - [x] Uses current token in Authorization header
   - [x] Sends refresh token in request body

3. useTokenRotation Hook
   - [x] Monitors token expiration
   - [x] Schedules refresh before expiration
   - [x] Handles immediate refresh if needed
   - [x] Supports callbacks (onTokenExpired, onTokenRefreshed, onError)

4. API Client Interceptor
   - [x] Adds token to all requests
   - [x] Handles 401 responses
   - [x] Queues requests during refresh
   - [x] Retries failed requests with new token

5. Integration Points
   - [ ] Add useTokenRotation to root layout or main component
   - [ ] Update login form to use loginWithFirebaseToken()
   - [ ] Verify API requests include Authorization header
   - [ ] Test logout clears tokens

6. Testing
   - [ ] Test login flow stores both tokens
   - [ ] Test token refresh before expiration
   - [ ] Test reactive refresh on 401
   - [ ] Test multiple concurrent requests on 401
   - [ ] Test logout clears all tokens
   - [ ] Test token expiration redirects to login

*/
