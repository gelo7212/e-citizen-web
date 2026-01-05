import { TokenResponse, AuthUser, JWTClaims } from '@/types';
import { setAuth, clearAuth } from '@/lib/auth/store';
import { ROLE_SCOPES } from '@/lib/auth/scopes';

/**
 * Auth Service - Handles authentication operations
 * Follows Next.js best practices for API service layer
 */

/**
 * Get API base URL
 */
function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
}

/**
 * Exchange Firebase token for API tokens
 */
export async function exchangeFirebaseToken(
  firebaseToken: string,
  firebaseUid: string
): Promise<{ success: boolean; data?: TokenResponse; error?: string }> {
  try {
    const apiUrl = getApiUrl();
    const endpoint = `${apiUrl}/api/identity/token`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`,
        'x-client-id': 'gov-ph-admin-client',
        'client-id': 'gov-ph-admin-client',
      },
      body: JSON.stringify({
        firebaseUid,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Token exchange failed: ${response.statusText}`,
      };
    }

    const tokenData = await response.json();

    if (!tokenData.success || !tokenData.data) {
      return {
        success: false,
        error: 'Invalid token response',
      };
    }

    return {
      success: true,
      data: tokenData.data,
    };
  } catch (error) {
    console.error('Token exchange error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token exchange failed',
    };
  }
}

/**
 * Decode JWT payload (client-side only)
 * Handles both test tokens (JWTClaims) and BFF tokens (with identity/actor structure)
 */
function decodeToken(token: string): JWTClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid token format: expected 3 parts, got', parts.length);
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Validate token structure
    if (!payload.identity && !payload.sub) {
      console.warn('Invalid token structure: missing identity or sub claim');
      return null;
    }

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.warn('Token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

/**
 * Login with Firebase token
 */
export async function loginWithFirebaseToken(
  firebaseToken: string,
  firebaseUid: string
): Promise<{ success: boolean; data?: TokenResponse; error?: string }> {
  try {
    // Exchange Firebase token for API tokens
    const result = await exchangeFirebaseToken(firebaseToken, firebaseUid);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to exchange token',
      };
    }

    const { accessToken, refreshToken } = result.data;

    // Decode the access token to extract user info
    const payload = decodeToken(accessToken);
    if (!payload) {
      return {
        success: false,
        error: 'Failed to decode token payload',
      };
    }

    const userId = payload.identity.userId;
    const userRole = payload.identity.role;
    const cityCode = payload.actor?.cityCode;
    firebaseUid = payload.identity.firebaseUid;

    if (!userId || !userRole) {
      return {
        success: false,
        error: 'Invalid token: missing userId or role',
      };
    }

    // Derive scopes from role (use role as-is for lookup, not lowercased)
    const scopesForRole = ROLE_SCOPES[userRole] || [];
    
    // Use payload scopes if available and non-empty, otherwise use derived scopes from role
    const finalScopes = (payload.identity && payload.identity.scopes && payload.identity.scopes.length > 0) 
      ? payload.identity.scopes 
      : scopesForRole;
    
    const user: AuthUser = {
      id: userId,
      role: userRole,
      scopes: finalScopes,
      cityCode: cityCode || '',
      contextType: 'admin',
      firebaseUid,
    };

    // Validate critical scopes are present
    if (!user.scopes || user.scopes.length === 0) {
      console.error(`⚠️ Critical: No scopes found for role "${userRole}". Available roles:`, Object.keys(ROLE_SCOPES));
      user.scopes = scopesForRole;
    }

    console.log('✅ User logged in:', {
      id: user.id,
      role: user.role,
      scopes: user.scopes,
      cityCode: user.cityCode,
      scopesFromRole: scopesForRole,
    });

    // Store auth state with tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('auth_refresh_token', refreshToken);
      }
    }

    // Update global auth state
    setAuth(user, accessToken);

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

/**
 * Logout
 */
export function logout(): void {
  clearAuth();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
  }
}

/**
 * Refresh access token using refresh token
 * Endpoint: POST /refresh
 * Request: { refreshToken: "..." } in body
 * Response: Same as token exchange (TokenResponse with accessToken, refreshToken, expiresIn)
 */
export async function refreshAccessToken(): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const apiUrl = getApiUrl();
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('auth_refresh_token') : null;

    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
      };
    }

    const response = await fetch(`${apiUrl}/api/identity/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[TokenRotation] Token refresh failed:', response.status, errorData);
      return {
        success: false,
        error: errorData.message || 'Token refresh failed',
      };
    }

    const data = await response.json();
    
    // Handle response format: { success: boolean, data: { accessToken, refreshToken, expiresIn, tokenType } }
    const tokenData = data.data || data;
    const newAccessToken = tokenData.accessToken;
    const newRefreshToken = tokenData.refreshToken;

    if (!newAccessToken) {
      return {
        success: false,
        error: 'No access token in refresh response',
      };
    }

    // Validate new token before storing
    const payload = decodeToken(newAccessToken);
    if (!payload) {
      return {
        success: false,
        error: 'Invalid refreshed token',
      };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', newAccessToken);
      
      // Update refresh token if provided in response (same as get token endpoint)
      if (newRefreshToken) {
        localStorage.setItem('auth_refresh_token', newRefreshToken);
      }
      
      console.log('[TokenRotation] ✅ Token refreshed successfully');
    }

    return {
      success: true,
      token: newAccessToken,
    };
  } catch (error) {
    console.error('[TokenRotation] Token refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}
