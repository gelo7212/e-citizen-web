import { AuthUser } from '@/types';

/**
 * Role types in the system
 */
export enum UserRole {
  APP_ADMIN = 'APP_ADMIN',
  CITY_ADMIN = 'CITY_ADMIN',
  SOS_ADMIN = 'SOS_ADMIN',
  SK_YOUTH_ADMIN = 'SK_YOUTH_ADMIN',
  RESCUER = 'RESCUER',
  CITIZEN = 'CITIZEN',
}

/**
 * Page access definitions by role
 * Maps each role to the pages they can access
 */
export const ROLE_PAGE_ACCESS: Record<string, string[]> = {
  [UserRole.APP_ADMIN]: [
    '/admin',
    '/admin/dashboard',
    '/admin/accounts',
  ],
  [UserRole.CITY_ADMIN]: [
    '/admin',
    '/admin/dashboard',
    '/admin/city/management',
    '/admin/city/announcements',
    '/admin/invites',
  ],
  [UserRole.SOS_ADMIN]: [
    '/admin',
    '/admin/dashboard',
    '/admin/sos',
    '/admin/sos/monitor',
    '/admin/sos/management',
  ],
  [UserRole.SK_YOUTH_ADMIN]: [
    '/admin',
    '/admin/dashboard',
    '/admin/youth',
    '/admin/youth/management',
  ],
  [UserRole.RESCUER]: [
    '/rescue',
    '/rescue/active',
    '/rescue/history',
    '/rescue/map',
  ],
  [UserRole.CITIZEN]: [
    '/citizen',
    '/citizen/home',
    '/citizen/announcements',
    '/citizen/news',
    '/citizen/services',
    '/citizen/programs',
  ],
};

/**
 * Get the default dashboard/home page for a role (case-insensitive)
 */
export function getDefaultPageForRole(role: string): string {
  const upperRole = role.toUpperCase();
  switch (upperRole) {
    case UserRole.APP_ADMIN:
    case UserRole.CITY_ADMIN:
    case UserRole.SOS_ADMIN:
    case UserRole.SK_YOUTH_ADMIN:
      return '/admin/dashboard';
    case UserRole.RESCUER:
      return '/rescue/active';
    case UserRole.CITIZEN:
    default:
      return '/citizen/home';
  }
}

/**
 * Check if a user can access a specific page
 */
export function canAccessPage(user: AuthUser | null, pathname: string): boolean {
  if (!user) return false;

  // Normalize pathname (remove trailing slashes for comparison)
  const normalizedPath = pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  // Use uppercase role for lookup
  const userRole = user.role.toUpperCase();
  const allowedPages = ROLE_PAGE_ACCESS[userRole] || [];

  // Check exact match or starts with (for nested pages)
  return allowedPages.some(page => 
    normalizedPath === page || normalizedPath.startsWith(page + '/')
  );
}

/**
 * Get all pages accessible by a specific role
 */
export function getAccessiblePages(role: string): string[] {
  const upperRole = role.toUpperCase();
  return ROLE_PAGE_ACCESS[upperRole] || [];
}

/**
 * Check if user has a specific role (case-insensitive)
 */
export function hasRole(user: AuthUser | null, role: string | string[]): boolean {
  if (!user) return false;
  
  const userRole = user.role.toUpperCase();
  
  if (Array.isArray(role)) {
    const normalizedRoles = role.map(r => r.toUpperCase());
    const hasMatchingRole = normalizedRoles.includes(userRole);
    if (!hasMatchingRole) {
      console.debug('hasRole check failed (array):', {
        userRole,
        requiredRoles: normalizedRoles,
        hasMatch: hasMatchingRole,
      });
    }
    return hasMatchingRole;
  }
  
  const normalizedRole = role.toUpperCase();
  const hasMatchingRole = userRole === normalizedRole;
  if (!hasMatchingRole) {
    console.debug('hasRole check failed:', {
      userRole,
      requiredRole: normalizedRole,
      hasMatch: hasMatchingRole,
    });
  }
  return hasMatchingRole;
}

/**
 * Check if user is admin (any type of admin)
 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  const userRole = user.role.toUpperCase();
  return [
    UserRole.APP_ADMIN,
    UserRole.CITY_ADMIN,
    UserRole.SOS_ADMIN,
    UserRole.SK_YOUTH_ADMIN,
  ].some(role => role === userRole);
}

/**
 * Check if user is app admin (can manage other admins)
 */
export function isAppAdmin(user: AuthUser | null): boolean {
  return hasRole(user, UserRole.APP_ADMIN);
}

/**
 * Check if user is city admin
 */
export function isCityAdmin(user: AuthUser | null): boolean {
  const result = hasRole(user, UserRole.CITY_ADMIN);
  if (!result && user) {
    console.debug('isCityAdmin check failed:', {
      userRole: user.role,
      userRoleUpper: user.role?.toUpperCase(),
      expectedRole: UserRole.CITY_ADMIN,
      result,
    });
  }
  return result;
}

/**
 * Check if user is SOS admin
 */
export function isSosAdmin(user: AuthUser | null): boolean {
  return hasRole(user, UserRole.SOS_ADMIN);
}

/**
 * Check if user is youth admin
 */
export function isYouthAdmin(user: AuthUser | null): boolean {
  return hasRole(user, UserRole.SK_YOUTH_ADMIN);
}

/**
 * Check if user is rescuer
 */
export function isRescuer(user: AuthUser | null): boolean {
  return hasRole(user, UserRole.RESCUER);
}

/**
 * Check if user is citizen
 */
export function isCitizen(user: AuthUser | null): boolean {
  return hasRole(user, UserRole.CITIZEN);
}
