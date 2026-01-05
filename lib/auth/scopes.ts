import { AuthUser } from '@/types';

// Scope definitions for each role
export const ROLE_SCOPES: Record<string, string[]> = {
  APP_ADMIN: [
    'admin:read',
    'admin:write',
    'city:read',
    'city:write',
    'sos:read',
    'sos:admin',
    'youth:read',
    'youth:write',
    'audit:read',
  ],
  CITY_ADMIN: [
    'admin:read',
    'city:read',
    'city:write',
    'sos:read',
    'youth:read',
    'youth:write',
  ],
  SOS_ADMIN : [
    'admin:read',
    'sos:read',
    'sos:admin',
  ],
  SK_YOUTH_ADMIN: [
    'admin:read',
    'youth:read',
    'youth:write',
  ],
  RESCUER: [
    'rescue:read',
    'rescue:write',
    'sos:read',
  ],
  CITIZEN: [
    'citizen:read',
    'news:read',
  ],
};

/**
 * Check if user has a specific scope
 */
export function hasScope(user: AuthUser, scope: string): boolean {
  if (!user || !user.scopes) return false;
  return user.scopes.includes(scope);
}

/**
 * Check if user has all required scopes
 */
export function hasAllScopes(user: AuthUser, scopes: string[]): boolean {
  if (!user || !user.scopes) return false;
  return scopes.every(scope => user.scopes.includes(scope));
}

/**
 * Check if user has any of the required scopes
 */
export function hasAnyScope(user: AuthUser, scopes: string[]): boolean {
  if (!user || !user.scopes) return false;
  return scopes.some(scope => user.scopes.includes(scope));
}

/**
 * Check if user can access admin section
 * Uses role-based access control (temporary, until full scope implementation)
 */
export function canAccessAdmin(user: AuthUser): boolean {
  if (!user) return false;
  const adminRoles = ['APP_ADMIN', 'CITY_ADMIN', 'SOS_ADMIN', 'SK_YOUTH_ADMIN'];
  return adminRoles.includes(user.role.toUpperCase());
}

/**
 * Check if user can manage city data
 * Uses role-based access control (temporary, until full scope implementation)
 */
export function canManageCity(user: AuthUser): boolean {
  if (!user) return false;
  const managerRoles = ['APP_ADMIN', 'CITY_ADMIN'];
  return managerRoles.includes(user.role.toUpperCase());
}

/**
 * Check if user can manage SOS
 * Uses role-based access control (temporary, until full scope implementation)
 */
export function canManageSos(user: AuthUser): boolean {
  if (!user) return false;
  const sosManagerRoles = ['APP_ADMIN', 'SOS_ADMIN'];
  return sosManagerRoles.includes(user.role.toUpperCase());
}

/**
 * Check if user can manage youth programs
 * Uses role-based access control (temporary, until full scope implementation)
 */
export function canManageYouth(user: AuthUser): boolean {
  if (!user) return false;
  const youthManagerRoles = ['APP_ADMIN', 'SK_YOUTH_ADMIN'];
  return youthManagerRoles.includes(user.role.toUpperCase());
}

/**
 * Check if user can access rescue operations
 * Uses role-based access control (temporary, until full scope implementation)
 */
export function canAccessRescue(user: AuthUser): boolean {
  if (!user) return false;
  return user.role.toUpperCase() === 'RESCUER';
}

/**
 * Check if user can manage rescue status
 * Uses role-based access control (temporary, until full scope implementation)
 */
export function canUpdateRescueStatus(user: AuthUser): boolean {
  if (!user) return false;
  return user.role.toUpperCase() === 'RESCUER';
}

/**
 * Check if user can access citizen portal
 * Uses role-based access control (temporary, until full scope implementation)
 */
export function canAccessCitizen(user: AuthUser): boolean {
  if (!user) return false;
  return user.role.toUpperCase() === 'CITIZEN';
}

/**
 * Get context-based route prefix
 */
export function getContextRoute(user: AuthUser): string {
  switch (user.contextType) {
    case 'admin':
      return '/admin';
    case 'rescue':
      return '/rescue';
    case 'citizen':
      return '/citizen';
    default:
      return '/citizen';
  }
}
