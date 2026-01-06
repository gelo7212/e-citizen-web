'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { useScopes } from '@/hooks/useScopes';
import { SetupProvider } from '@/context/SetupContext';
import { SetupGuard } from '@/components/admin/setup/SetupGuard';
import {
  isAppAdmin,
  isCityAdmin,
  isYouthAdmin,
  isSosAdmin,
} from '@/lib/auth/roleAccess';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Check if on rescuer route with token (anonymous rescuer access)
  const isRescuerRoute = pathname.startsWith('/admin/rescuer/');
  const hasRescuerToken = isRescuerRoute && searchParams.get('token');

  // Skip auth hooks for rescuer route with token
  const auth = !hasRescuerToken ? useRequireAuth() : null;
  const scopes = !hasRescuerToken ? useScopes() : null;

  // Check if on setup routes or already on a valid admin subsection
  const isSetupRoute = pathname.startsWith('/admin/setup');
  const isCityRoute = pathname.startsWith('/admin/city');
  const isSuperUserRoute = pathname.startsWith('/admin/super-user');
  const isYouthRoute = pathname.startsWith('/admin/sk-youth');
  const isSosRoute = pathname.startsWith('/admin/sos');
  const isInvitesRoute = pathname.startsWith('/admin/invites');
  const isOnValidRoute = isSetupRoute || isCityRoute || isSuperUserRoute || isYouthRoute || isSosRoute || isInvitesRoute || hasRescuerToken;

  useEffect(() => {
    // Skip auth check for rescuer route with token (will be validated in page component)
    if (hasRescuerToken) {
      return;
    }

    // Only redirect to default admin page if not on a setup route and not already on a valid admin subsection
    if (auth && !auth.isLoading && scopes?.canAccessAdmin && !isOnValidRoute) {
      // Redirect to appropriate admin section based on role
      if (isAppAdmin(auth.user)) {
        router.push('/admin/super-user');
      } else if (isCityAdmin(auth.user)) {
        router.push('/admin/city');
      } else if (isYouthAdmin(auth.user)) {
        router.push('/admin/sk-youth');
      } else if (isSosAdmin(auth.user)) {
        router.push('/admin/sos');
      } else {
        // Default fallback
        router.push('/admin/city');
      }
    }
  }, [auth?.isLoading, scopes?.canAccessAdmin, auth?.user, router, isOnValidRoute, hasRescuerToken]);

  if (!hasRescuerToken && auth && auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Skip admin access check for rescuer route with token
  if (!hasRescuerToken && auth && !scopes?.canAccessAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <p className="text-red-600 font-bold text-lg">Access Denied</p>
          <p className="text-gray-600 mt-2">Admin access is required to view this page.</p>
          <p className="text-sm text-gray-500 mt-3">
            Role: <span className="font-mono">{auth.user?.role}</span>
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              window.location.href = '/citizen/home';
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Wrap with SetupProvider and SetupGuard (skip for rescuer route with token)
  if (hasRescuerToken) {
    return <>{children}</>;
  }

  return (
    <SetupProvider>
      <SetupGuard>{children}</SetupGuard>
    </SetupProvider>
  );
}
