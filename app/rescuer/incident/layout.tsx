'use client';

import React from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useTokenRotation } from '@/hooks/useTokenRotation';

export default function RescuerIncidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useRequireAuth();

  // Enable token rotation for incident operations
  useTokenRotation({
    enabled: auth.isAuthenticated,
    refreshThresholdMs: 60000,
    onTokenExpired: () => {
      console.log('[RescuerIncidentLayout] Token expired, redirecting to login');
      window.location.href = '/login';
    },
    onTokenRefreshed: () => {
      console.log('[RescuerIncidentLayout] Token refreshed successfully');
    },
    onError: (error) => {
      console.error('[RescuerIncidentLayout] Token rotation error:', error);
    },
  });

  return <>{children}</>;
}
