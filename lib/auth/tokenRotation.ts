/**
 * Token Rotation Utility
 * Handles automatic token refresh when expiration is approaching (5 minutes)
 */

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

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
 * Check if token will expire within the threshold (5 minutes)
 */
export function willTokenExpireSoon(token: string): boolean {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    return true; // Treat invalid tokens as expired
  }

  const now = Date.now();
  const timeUntilExpiration = expirationTime - now;

  return timeUntilExpiration <= TOKEN_REFRESH_THRESHOLD;
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
 * Refresh token if it will expire soon, otherwise return existing token
 */
export async function refreshTokenIfNeeded(
  currentToken: string,
  refreshFn: () => Promise<{ success: boolean; token?: string; error?: string }>
): Promise<{ success: boolean; token: string; wasRefreshed: boolean; error?: string }> {
  if (isTokenExpired(currentToken)) {
    // Token is already expired, must refresh
    const result = await refreshFn();
    if (result.success && result.token) {
      return {
        success: true,
        token: result.token,
        wasRefreshed: true,
      };
    }
    return {
      success: false,
      token: currentToken,
      wasRefreshed: false,
      error: result.error || 'Token refresh failed',
    };
  }

  if (willTokenExpireSoon(currentToken)) {
    // Token will expire soon, refresh proactively
    console.log('[TokenRotation] Token will expire soon, refreshing proactively');
    const result = await refreshFn();
    if (result.success && result.token) {
      return {
        success: true,
        token: result.token,
        wasRefreshed: true,
      };
    }
    // If refresh fails, return current token and let it be used
    console.warn('[TokenRotation] Proactive refresh failed, using existing token', result.error);
    return {
      success: true,
      token: currentToken,
      wasRefreshed: false,
    };
  }

  // Token is still valid and won't expire soon
  return {
    success: true,
    token: currentToken,
    wasRefreshed: false,
  };
}

/**
 * Schedule periodic token rotation check
 * Returns a cleanup function to stop the interval
 */
export function scheduleTokenRotation(
  getToken: () => string | null,
  refreshFn: () => Promise<{ success: boolean; token?: string; error?: string }>,
  checkInterval: number = 60000 // Check every 60 seconds by default
): () => void {
  const intervalId = setInterval(async () => {
    const token = getToken();
    if (!token) {
      return;
    }

    const timeRemaining = getTokenTimeRemaining(token);
    if (timeRemaining === null) {
      return;
    }

    // If token will expire in less than 10 minutes, refresh it
    if (timeRemaining <= 10 * 60 * 1000) {
      console.log(
        `[TokenRotation] Token expiring in ${Math.round(timeRemaining / 1000)}s, refreshing...`
      );
      await refreshTokenIfNeeded(token, refreshFn);
    }
  }, checkInterval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
