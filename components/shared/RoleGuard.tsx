'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { canAccessPage, getDefaultPageForRole } from '@/lib/auth/roleAccess';

interface RoleGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
}

/**
 * RoleGuard component - Protects pages by role-based access control
 * 
 * Usage:
 * <RoleGuard>
 *   <YourPageContent />
 * </RoleGuard>
 * 
 * Or with specific roles:
 * <RoleGuard requiredRoles={['app_admin']}>
 *   <AdminContent />
 * </RoleGuard>
 */
export function RoleGuard({ children, requiredRoles }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!user) {
      console.warn('Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Check if user has access to current page
    if (!canAccessPage(user, pathname)) {
      console.warn(`User ${user.id} (role: ${user.role}) does not have access to ${pathname}`);
      
      // Redirect to default page for their role
      const defaultPage = getDefaultPageForRole(user.role);
      router.push(defaultPage);
      return;
    }

    // Check specific required roles if provided
    if (requiredRoles && requiredRoles.length > 0) {
      const normalizedRequiredRoles = requiredRoles.map(role => role.toUpperCase());
      if (!normalizedRequiredRoles.includes(user.role.toUpperCase())) {
        console.warn(
          `User role '${user.role}' not in required roles: ${requiredRoles.join(', ')}`
        );
        
        const defaultPage = getDefaultPageForRole(user.role);
        router.push(defaultPage);
      }
    }
  }, [user, isLoading, pathname, router, requiredRoles]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // If not authenticated, don't render children
  if (!user) {
    return null;
  }

  // If access denied, don't render children
  if (!canAccessPage(user, pathname)) {
    return null;
  }

  // If specific roles required, check them
  if (requiredRoles && requiredRoles.length > 0) {
    const normalizedRequiredRoles = requiredRoles.map(role => role.toUpperCase());
    if (!normalizedRequiredRoles.includes(user.role.toUpperCase())) {
      return null;
    }
  }

  return <>{children}</>;
}

/**
 * Hook to check if user can access a page
 */
export function useCanAccessPage(pathname: string): boolean {
  const { user } = useAuth();
  return canAccessPage(user, pathname);
}

/**
 * Hook to get user's accessible pages
 */
export function useAccessiblePages() {
  const { user } = useAuth();
  if (!user) return [];
  
  // Import ROLE_PAGE_ACCESS to get pages
  const { ROLE_PAGE_ACCESS } = require('@/lib/auth/roleAccess');
  return ROLE_PAGE_ACCESS[user.role] || [];
}
