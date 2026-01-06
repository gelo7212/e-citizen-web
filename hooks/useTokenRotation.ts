'use client';

import { useEffect } from 'react';
import { getAuthToken } from '@/lib/auth/store';

interface UseTokenRotationOptions {
  enabled?: boolean;
  onTokenExpired?: () => void;
  onError?: (error: string) => void;
}

/**
 * Token Rotation Hook (Deprecated - Passive Refresh Strategy)
 * 
 * This hook is kept for backward compatibility but no longer performs active token checks.
 * Token refresh is now handled automatically by the API client interceptor when requests fail with 401.
 * 
 * The new approach:
 * - No periodic token expiration checks
 * - Tokens are only refreshed when API requests fail (401 response)
 * - Refresh tokens are valid for 7 days, providing a large window
 * - Reduces unnecessary API calls and improves performance
 * 
 * @deprecated Use API client interceptor for automatic token refresh instead
 * @example
 * ```typescript
 * // This hook can still be called but does nothing
 * useTokenRotation({ enabled: true });
 * // Token refresh is now handled in lib/api/client.ts
 * ```
 */
export function useTokenRotation(options: UseTokenRotationOptions = {}) {
  const {
    enabled = true,
    onTokenExpired,
    onError,
  } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Perform initial validation on mount
    const token = getAuthToken();
    if (!token) {
      onTokenExpired?.();
    }

    // No periodic checks - token refresh is handled by API client interceptor
    // This cleanup is not strictly necessary but provided for consistency
    return () => {
      // Cleanup
    };
  }, [enabled, onTokenExpired, onError]);

  return {
    // Empty return for backward compatibility
  };
}

