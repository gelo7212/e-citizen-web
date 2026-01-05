'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSetup } from '@/context/SetupContext';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

interface SetupGuardProps {
  children: React.ReactNode;
}

export function SetupGuard({ children }: SetupGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const { cityCode, setupStatus, isLoading: setupLoading, resumeSetup, error } = useSetup();
  const [isInitializing, setIsInitializing] = useState(true);

  // List of routes that should be accessible regardless of setup status
  const SETUP_ROUTES = ['/admin/setup', '/admin/login', '/citizen/login', '/login'];
  const isSetupRoute = SETUP_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    const initializeGuard = async () => {
      // Wait for auth to load
      if (authLoading) {
        return;
      }

      // If user is not authenticated, skip guard
      if (!user) {
        setIsInitializing(false);
        return;
      }

      // If on setup routes, allow through
      if (isSetupRoute) {
        setIsInitializing(false);
        return;
      }

      // Initialize setup from city code in JWT for any user with a cityCode
      // This includes city_admin, super_admin, and other admin roles
      try {
        if (user.cityCode && !cityCode) {
          await resumeSetup(user.cityCode);
        }
        setIsInitializing(false);
      } catch (err) {
        console.error('Failed to resume setup:', err);
        // If setup resumption fails for city_admin, redirect to setup
        if (user.role === 'city_admin') {
          router.push('/admin/setup/check');
        } else {
          // For other roles (like super_admin), just proceed
          setIsInitializing(false);
        }
      }
    };

    initializeGuard();
  }, [authLoading, user, cityCode, isSetupRoute, resumeSetup, router]);

  // If initializing, show loading
  if (isInitializing || (authLoading && !isSetupRoute)) {
    return <LoadingSkeleton />;
  }

  // If user is authenticated, is CITY_ADMIN, and setup is not complete
  if (user && user.role === 'city_admin' && setupStatus && setupStatus.currentStep !== 'COMPLETED') {
    // Allow setup routes
    if (isSetupRoute) {
      return children;
    }

    // Redirect to setup from the correct step
    const stepRoutes: Record<string, string> = {
      CITY_PROFILE: '/admin/setup/create-city',
      DEPARTMENTS: '/admin/setup/departments',
      SOS_HQ: '/admin/setup/sos-hq',
      SETTINGS: '/admin/setup/settings',
    };

    const nextRoute = stepRoutes[setupStatus.currentStep] || '/admin/setup/city-profile';
    router.push(nextRoute);
    return <LoadingSkeleton />;
  }

  // Allow access if setup is complete or user is not city_admin
  return children;
}
