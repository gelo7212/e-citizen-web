/**
 * TOKEN ROTATION DEBUGGING GUIDE
 * 
 * This file helps you diagnose and fix token rotation issues.
 */

// ============================================================================
// ISSUE 1: Token Rotation Hook Not Being Called
// ============================================================================

// ❌ PROBLEM: Token rotation never starts
// SOLUTION: Make sure useTokenRotation is called in your layout

// Before (NOT WORKING):
// app/admin/layout.tsx
'use client';
import { useRequireAuth } from '@/hooks/useAuth';

export default function AdminLayout({ children }) {
  const auth = useRequireAuth();
  
  // ❌ useTokenRotation NOT called - tokens won't refresh!
  
  return <div>{children}</div>;
}


// After (WORKING):
'use client';
import { useRequireAuth } from '@/hooks/useAuth';
import { useTokenRotation } from '@/hooks/useTokenRotation'; // ✅ Import

export default function AdminLayout({ children }) {
  const auth = useRequireAuth();
  
  // ✅ ALWAYS call useTokenRotation when user is authenticated
  useTokenRotation({
    enabled: auth.isAuthenticated,
    refreshThresholdMs: 60000,
    onTokenExpired: () => console.log('Token expired'),
    onTokenRefreshed: () => console.log('Token refreshed'),
    onError: (error) => console.error('Token error:', error),
  });
  
  return <div>{children}</div>;
}

// ============================================================================
// ISSUE 2: Token Refresh Returns 401
// ============================================================================

// ❌ PROBLEM: Refresh endpoint returns 401 Unauthorized
// LIKELY CAUSE: Authorization header missing or access token is invalid

// Check your refreshAccessToken function:
// lib/services/authService.ts

// ✅ CORRECT - Includes Authorization header:
const response = await fetch(`${apiUrl}/api/identity/refresh`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${currentAccessToken}`, // ✅ REQUIRED
  },
  body: JSON.stringify({
    refreshToken: currentRefreshToken,
  }),
});

// ❌ WRONG - Missing Authorization header:
const response = await fetch(`${apiUrl}/api/identity/refresh`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    refreshToken: currentRefreshToken,
  }),
});

// ============================================================================
// ISSUE 3: Tokens Not Stored After Refresh
// ============================================================================

// ❌ PROBLEM: Token is refreshed but new token isn't used on next request
// LIKELY CAUSE: updateTokens() not called or localStorage access issues

// ✅ CORRECT - Call updateTokens after refresh:
if (result.success && result.data) {
  const { accessToken, refreshToken } = result.data;
  
  // ✅ Update both tokens
  updateTokens(accessToken, refreshToken);
  
  console.log('✅ Tokens updated in storage');
}

// ❌ WRONG - Only updating one token:
localStorage.setItem('auth_token', newAccessToken);
// Missing: localStorage.setItem('auth_refresh_token', newRefreshToken);

// ============================================================================
// ISSUE 4: useTokenRotation Hook Not Triggering Refresh
// ============================================================================

// ❌ PROBLEM: Console shows hook is active but no refresh happens
// LIKELY CAUSES:
// 1. Token payload doesn't have 'exp' claim
// 2. Token TTL is very short (already expired)
// 3. Timestamp mismatch between client and server

// DEBUG STEPS:

// Step 1: Check if token is valid JWT
const token = localStorage.getItem('auth_token');
const parts = token.split('.');
console.log('Token parts:', parts.length); // Should be 3

// Step 2: Decode and check exp claim
const payload = JSON.parse(atob(parts[1]));
console.log('Token payload:', payload);
console.log('Has exp claim:', !!payload.exp); // Should be true
console.log('Exp claim value:', payload.exp);

// Step 3: Check expiration time
const expiresAt = new Date(payload.exp * 1000);
const now = new Date();
const timeRemaining = expiresAt - now;
console.log('Expires at:', expiresAt.toLocaleTimeString());
console.log('Current time:', now.toLocaleTimeString());
console.log('Time remaining (ms):', timeRemaining);
console.log('Time remaining (s):', timeRemaining / 1000);

// Step 4: Check if clock is skewed
const clockSkew = now - (payload.iat * 1000);
console.log('Clock skew (ms):', clockSkew);
if (Math.abs(clockSkew) > 300000) {
  console.warn('⚠️ WARNING: Client clock may be out of sync with server');
}

// ============================================================================
// ISSUE 5: Multiple Token Refresh Requests
// ============================================================================

// ❌ PROBLEM: Token refresh endpoint called multiple times simultaneously
// SOLUTION: The code includes deduplication - ensure you're not calling manually

// ❌ WRONG - Manual refresh while auto-refresh is active:
useTokenRotation({ enabled: true });
// Then manually calling:
refreshAccessToken(); // This might cause issues

// ✅ CORRECT - Let useTokenRotation handle everything:
useTokenRotation({ enabled: true });
// Don't call refreshAccessToken manually unless necessary

// If you need manual refresh, check status first:
if (!isRefreshing) {
  const result = await refreshAccessToken();
}

// ============================================================================
// DEBUGGING CHECKLIST
// ============================================================================

/*
✅ DEBUGGING CHECKLIST FOR TOKEN ROTATION

1. Verify Hook is Called
   - [ ] Open browser DevTools Console
   - [ ] Look for "[TokenRotation]" messages
   - [ ] Should see "Token refresh scheduled" on login
   - [ ] Should see "Executing scheduled token refresh" before expiration

2. Verify Token Storage
   - [ ] Open DevTools Application/Storage tab
   - [ ] Check localStorage has:
       - auth_user ✅
       - auth_token ✅
       - auth_refresh_token ✅
   - [ ] All values are non-empty strings

3. Verify Token Format
   - [ ] Copy auth_token from localStorage
   - [ ] Split by '.' - should have 3 parts
   - [ ] Decode middle part: atob('MIDDLE_PART')
   - [ ] Should have exp, iss, aud fields

4. Verify Refresh Endpoint
   - [ ] Open DevTools Network tab
   - [ ] Filter for "refresh" requests
   - [ ] Look for POST /api/identity/refresh
   - [ ] Check Request Headers include:
       - Authorization: Bearer {...}
       - Content-Type: application/json
   - [ ] Check Request Body has refreshToken
   - [ ] Check Response Status is 200 (not 401 or 500)
   - [ ] Check Response Body has:
       - success: true
       - data.accessToken
       - data.refreshToken
       - data.expiresIn

5. Verify Token Update
   - [ ] After refresh request completes
   - [ ] Check localStorage auth_token changed
   - [ ] New token should be different from old token
   - [ ] Decode new token to verify it's valid

6. Test Failure Scenarios
   - [ ] Manually delete auth_refresh_token from localStorage
   - [ ] Try to use app - should redirect to login
   - [ ] Check console for "[TokenRotation] Token refresh failed"

7. Check Console Logs
   - [ ] No TypeScript errors
   - [ ] No "Cannot read property" errors
   - [ ] No network errors in Network tab
   - [ ] Expected log messages appear

*/

// ============================================================================
// MANUAL TESTING SCRIPT
// ============================================================================

// Run this in browser console to test token rotation:

async function testTokenRotation() {
  console.log('=== TOKEN ROTATION TEST ===\n');

  // 1. Check auth store
  console.log('1. Checking auth storage...');
  const token = localStorage.getItem('auth_token');
  const refreshToken = localStorage.getItem('auth_refresh_token');
  const user = localStorage.getItem('auth_user');
  
  if (!token) {
    console.error('❌ No auth_token found');
    return;
  }
  if (!refreshToken) {
    console.error('❌ No auth_refresh_token found');
    return;
  }
  console.log('✅ Both tokens found\n');

  // 2. Decode and check token
  console.log('2. Checking token validity...');
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error('❌ Invalid token format (expected 3 parts, got ' + parts.length + ')');
    return;
  }
  
  const payload = JSON.parse(atob(parts[1]));
  console.log('Token payload:', payload);
  
  if (!payload.exp) {
    console.error('❌ Token has no exp claim');
    return;
  }
  
  const expiresAt = new Date(payload.exp * 1000);
  const now = new Date();
  const timeRemaining = expiresAt - now;
  
  console.log('✅ Token valid');
  console.log('   Expires at:', expiresAt.toLocaleTimeString());
  console.log('   Time remaining:', (timeRemaining / 1000).toFixed(2), 'seconds\n');

  // 3. Test manual refresh
  console.log('3. Testing manual token refresh...');
  try {
    const result = await fetch('/api/identity/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    const data = await result.json();
    console.log('Refresh response:', result.status);
    console.log('Response data:', data);
    
    if (result.ok && data.success) {
      console.log('✅ Token refresh successful\n');
      
      // 4. Verify tokens were updated
      console.log('4. Verifying tokens were updated in storage...');
      const newToken = localStorage.getItem('auth_token');
      const newRefreshToken = localStorage.getItem('auth_refresh_token');
      
      if (newToken !== token) {
        console.log('✅ Access token updated');
      } else {
        console.warn('⚠️ Access token unchanged (might be normal)');
      }
      
      if (newRefreshToken && newRefreshToken !== refreshToken) {
        console.log('✅ Refresh token updated');
      } else {
        console.warn('⚠️ Refresh token unchanged (might be normal)');
      }
    } else {
      console.error('❌ Token refresh failed');
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Error during refresh test:', error.message);
  }

  console.log('\n=== TEST COMPLETE ===');
}

// Run the test:
// testTokenRotation();

// ============================================================================
// EXPECTED CONSOLE OUTPUT
// ============================================================================

/*
When token rotation is working correctly, you should see:

On Login:
[TokenRotation] Token refresh scheduled
  - timeRemaining: "118.45s"
  - refreshIn: "58.45s"

While App is Active (at scheduled refresh time):
[TokenRotation] Executing scheduled token refresh
[TokenRotation] ✅ Token refreshed successfully via hook
  - expiresIn: 120
  - newRefreshTokenProvided: true

On Every API Request:
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

If Token Expires While App is Open:
[API Client] Token refresh via API interceptor
[API Client] ✅ Token refreshed via API interceptor
[API Client] Retrying original request with new token

If Refresh Token is Invalid (7 days expired):
[API Client] Token refresh failed, clearing auth and redirecting to login

*/

// ============================================================================
// COMMON ERROR MESSAGES & SOLUTIONS
// ============================================================================

/*
ERROR: "[TokenRotation] No refresh token available"
SOLUTION: 
  - Check that loginWithFirebaseToken stored auth_refresh_token
  - Verify setAuth is called with refreshToken parameter
  - Check localStorage has auth_refresh_token key

ERROR: "[TokenRotation] Token refresh failed: 401"
SOLUTION:
  - Check Authorization header is included in refresh request
  - Verify currentAccessToken is valid (not empty/null)
  - Check server's /api/identity/refresh endpoint is working

ERROR: "[API Client] Token refresh failed, clearing auth and redirecting to login"
SOLUTION:
  - Refresh token has expired (> 7 days old)
  - User must log in again
  - This is expected behavior

ERROR: "[TokenRotation] Could not determine token expiration"
SOLUTION:
  - Token is not a valid JWT (missing exp claim)
  - Token payload is corrupt or not base64 encoded
  - Check token format: should have 3 parts separated by dots

ERROR: "Cannot read property 'enabled' of undefined" in useTokenRotation
SOLUTION:
  - Pass options object correctly
  - Change: useTokenRotation()
  - To: useTokenRotation({ enabled: true })

*/
