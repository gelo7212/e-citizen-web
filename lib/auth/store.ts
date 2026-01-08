import { AuthUser } from '@/types';

// Store auth state
let currentUser: AuthUser | null = null;
let token: string | null = null;
let refreshToken: string | null = null;

/**
 * Initialize auth from localStorage (client-side)
 */
export function initializeAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('auth_user');
  const storedToken = localStorage.getItem('auth_token');
  const storedRefreshToken = localStorage.getItem('auth_refresh_token');
  
  if (stored && storedToken) {
    currentUser = JSON.parse(stored);
    token = storedToken;
    refreshToken = storedRefreshToken;
    return currentUser;
  }
  
  return null;
}

/**
 * Get current authenticated user
 */
export function getAuthUser(): AuthUser | null {
  // If in-memory state is set, return it
  if (currentUser) {
    return currentUser;
  }
  
  // Otherwise try to restore from localStorage
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('auth_user');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      return currentUser;
    } catch (error) {
      console.error('Failed to parse auth_user from localStorage:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Get current access token
 */
export function getAuthToken(): string | null {
  // If in-memory state is set, return it
  if (token) {
    return token;
  }
  
  // Otherwise try to restore from localStorage
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('auth_token');
  if (stored) {
    token = stored;
    return token;
  }
  
  return null;
}

/**
 * Get current refresh token
 */
export function getRefreshToken(): string | null {
  // If in-memory state is set, return it
  if (refreshToken) {
    return refreshToken;
  }
  
  // Otherwise try to restore from localStorage
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('auth_refresh_token');
  if (stored) {
    refreshToken = stored;
    return stored;
  }
  
  return null;
}

/**
 * Update only the access token (used during token refresh)
 */
export function updateAccessToken(newToken: string): void {
  token = newToken;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', newToken);
  }
}

/**
 * Update both access and refresh tokens
 */
export function updateTokens(newAccessToken: string, newRefreshToken: string): void {
  token = newAccessToken;
  refreshToken = newRefreshToken;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', newAccessToken);
    localStorage.setItem('auth_refresh_token', newRefreshToken);
  }
}

/**
 * Set authenticated user and token
 */
export function setAuth(user: AuthUser, authToken: string, authRefreshToken?: string): void {
  // Normalize role to uppercase for consistent checks
  const normalizedUser = {
    ...user,
    role: user.role?.toUpperCase() || user.role,
  };
  
  currentUser = normalizedUser;
  token = authToken;
  
  if (authRefreshToken) {
    refreshToken = authRefreshToken;
  }
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
      localStorage.setItem('auth_token', authToken);
      if (authRefreshToken) {
        localStorage.setItem('auth_refresh_token', authRefreshToken);
      }
      console.log('✅ Auth persisted to localStorage:', { role: normalizedUser.role, id: normalizedUser.id });
    } catch (error) {
      console.error('❌ Failed to persist auth to localStorage:', error);
    }
  }
}

/**
 * Clear authentication
 */
export function clearAuth(): void {
  currentUser = null;
  token = null;
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    console.log('🧹 Auth cleared from memory and localStorage');
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return currentUser !== null && token !== null;
}

/**
 * Check if user is on desktop/admin context
 */
export function isAdmin(): boolean {
  return currentUser?.contextType === 'admin';
}

/**
 * Check if user is rescuer
 */
export function isRescuer(): boolean {
  return currentUser?.contextType === 'rescue';
}

/**
 * Check if user is citizen
 */
export function isCitizen(): boolean {
  return currentUser?.contextType === 'citizen';
}
