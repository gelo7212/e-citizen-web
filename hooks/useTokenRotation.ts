'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getAuthToken } from '@/lib/auth/store';
import { refreshAccessToken } from '@/lib/services/authService';
import {
  willTokenExpireSoon,
  getTokenTimeRemaining,
  isTokenExpired,
  refreshTokenIfNeeded,
} from '@/lib/auth/tokenRotation';

interface UseTokenRotationOptions {
  enabled?: boolean;
  checkInterval?: number; // ms between checks, default 60000 (1 minute)
  onTokenRefreshed?: (newToken: string) => void;
  onTokenExpired?: () => void;
  onError?: (error: string) => void;
}

/**
 * Hook for automatic token rotation
 * Checks token expiration periodically and refreshes if needed
 * 
 * @example
 * ```typescript
 * const { isTokenValid, tokenTimeRemaining } = useTokenRotation({
 *   enabled: true,
 *   checkInterval: 60000,
 *   onTokenRefreshed: (newToken) => console.log('Token refreshed'),
 *   onTokenExpired: () => console.log('Token expired'),
 * });
 * ```
 */
export function useTokenRotation(options: UseTokenRotationOptions = {}) {
  const {
    enabled = true,
    checkInterval = 60000, // Check every 60 seconds
    onTokenRefreshed,
    onTokenExpired,
    onError,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  const checkAndRefreshToken = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      onTokenExpired?.();
      return;
    }

    // Check if token is already expired
    if (isTokenExpired(token)) {
      console.log('[useTokenRotation] ⚠️ Token is expired');
      onTokenExpired?.();
      return;
    }

    // Check if token will expire soon
    if (willTokenExpireSoon(token)) {
      const timeRemaining = getTokenTimeRemaining(token);
      console.log(
        `[useTokenRotation] Token expiring in ${timeRemaining ? Math.round(timeRemaining / 1000) : 'unknown'}s, attempting refresh...`
      );

      const result = await refreshTokenIfNeeded(token, refreshAccessToken);

      if (result.success) {
        if (result.wasRefreshed) {
          console.log('[useTokenRotation] ✅ Token refreshed successfully');
          onTokenRefreshed?.(result.token);
        }
      } else {
        console.error('[useTokenRotation] ❌ Token refresh failed:', result.error);
        onError?.(result.error || 'Token refresh failed');
        onTokenExpired?.();
      }
    } else {
      const timeRemaining = getTokenTimeRemaining(token);
      if (timeRemaining) {
        console.log(
          `[useTokenRotation] Token valid, expires in ${Math.round(timeRemaining / 1000)}s`
        );
      }
    }

    lastCheckRef.current = Date.now();
  }, [onTokenRefreshed, onTokenExpired, onError]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Perform initial check
    checkAndRefreshToken();

    // Set up periodic checks
    intervalRef.current = setInterval(() => {
      checkAndRefreshToken();
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, checkInterval, checkAndRefreshToken]);

  return {
    checkAndRefreshToken,
  };
}
