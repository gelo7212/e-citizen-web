'use client';

import { useEffect, useRef } from 'react';
import { getAuthToken } from '@/lib/auth/store';
import { refreshAccessToken } from '@/lib/services/authService';
import { getTokenTimeRemaining } from '@/lib/auth/tokenRotation';

interface UseTokenRotationOptions {
  enabled?: boolean;
  refreshThresholdMs?: number; // How much time before expiration to refresh (default: 60 seconds)
  onTokenExpired?: () => void;
  onTokenRefreshed?: () => void;
  onError?: (error: string) => void;
}

/**
 * Token Rotation Hook - Active Token Refresh Strategy
 * 
 * This hook automatically refreshes the access token before it expires.
 * 
 * Strategy:
 * - Checks token expiration on mount and periodically
 * - Refreshes token proactively when approaching expiration
 * - Falls back to API client interceptor for reactive 401 handling
 * - Threshold: refreshes 60 seconds before expiration by default
 * 
 * @example
 * ```typescript
 * useTokenRotation({ 
 *   enabled: true,
 *   refreshThresholdMs: 60000, // Refresh 1 minute before expiration
 *   onTokenExpired: () => logout(),
 *   onError: (error) => console.error('Token error:', error)
 * });
 * ```
 */
export function useTokenRotation(options: UseTokenRotationOptions = {}) {
  const {
    enabled = true,
    refreshThresholdMs = 60000, // 60 seconds before expiration
    onTokenExpired,
    onTokenRefreshed,
    onError,
  } = options;

  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const scheduleTokenRefresh = () => {
      // Clear any existing timeout/interval
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }

      const token = getAuthToken();
      if (!token) {
        onTokenExpired?.();
        return;
      }

      const timeRemaining = getTokenTimeRemaining(token);
      
      if (timeRemaining === null) {
        console.warn('[TokenRotation] Could not determine token expiration');
        onError?.('Could not determine token expiration');
        return;
      }

      // If token is already expired or expiring very soon, refresh immediately
      if (timeRemaining <= refreshThresholdMs) {
        console.log('[TokenRotation] Token expiring soon, refreshing immediately', {
          timeRemaining: `${(timeRemaining / 1000).toFixed(2)}s`,
          threshold: `${(refreshThresholdMs / 1000).toFixed(2)}s`,
        });

        performTokenRefresh().then((success) => {
          if (success) {
            // Reschedule after refresh
            scheduleTokenRefresh();
          }
        });
      } else {
        // Schedule refresh for threshold time before expiration
        const refreshIn = timeRemaining - refreshThresholdMs;
        
        console.log('[TokenRotation] Token refresh scheduled', {
          timeRemaining: `${(timeRemaining / 1000).toFixed(2)}s`,
          refreshIn: `${(refreshIn / 1000).toFixed(2)}s`,
        });

        refreshTimeoutRef.current = setTimeout(() => {
          console.log('[TokenRotation] Executing scheduled token refresh');
          performTokenRefresh().then((success) => {
            if (success) {
              // Reschedule after refresh
              scheduleTokenRefresh();
            }
          });
        }, refreshIn);
      }
    };

    const performTokenRefresh = async (): Promise<boolean> => {
      try {
        const result = await refreshAccessToken();
        
        if (result.success) {
          console.log('[TokenRotation] ✅ Token refreshed successfully via hook');
          onTokenRefreshed?.();
          return true;
        } else {
          const error = result.error || 'Token refresh failed';
          console.error('[TokenRotation] Token refresh failed:', error);
          onError?.(error);
          return false;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[TokenRotation] Token refresh error:', errorMsg);
        onError?.(errorMsg);
        return false;
      }
    };

    // Initial schedule on mount
    scheduleTokenRefresh();

    // Cleanup
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled, refreshThresholdMs, onTokenExpired, onTokenRefreshed, onError]);

  return {
    // Public API for manual refresh if needed
  };
}

