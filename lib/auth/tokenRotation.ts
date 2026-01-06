/**
 * Token Rotation Utility
 * Implements passive token refresh strategy:
 * - No active checking of token expiration
 * - Tokens are refreshed only when requests fail with 401
 * - Refresh tokens are valid for 7 days, providing a large buffer
 */

/**
 * Decode JWT payload without verification (client-side)
 */
function decodeTokenPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    return JSON.parse(atob(parts[1]));
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Get token expiration time in milliseconds
 */
function getTokenExpirationTime(token: string): number | null {
  const payload = decodeTokenPayload(token);
  if (!payload || !payload.exp) {
    return null;
  }
  return payload.exp * 1000; // Convert from seconds to milliseconds
}

/**
 * Get time remaining until token expires
 */
export function getTokenTimeRemaining(token: string): number | null {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    return null;
  }
  return Math.max(0, expirationTime - Date.now());
}

/**
 * Check if token is completely expired
 */
export function isTokenExpired(token: string): boolean {
  const timeRemaining = getTokenTimeRemaining(token);
  return timeRemaining === null || timeRemaining <= 0;
}

/**
 * Check if token will expire soon (within 5 minutes)
 */
export function willTokenExpireSoon(token: string): boolean {
  const timeRemaining = getTokenTimeRemaining(token);
  if (timeRemaining === null) {
    return true; // Treat as expiring soon if we can't determine
  }
  const fiveMinutesInMs = 5 * 60 * 1000;
  return timeRemaining <= fiveMinutesInMs;
}

