/**
 * Share Token Utilities
 * Decodes and validates JWT share tokens from ShareLink API
 */

export interface ShareTokenPayload {
  iss?: string;
  aud?: string;
  exp?: number;
  identity?: {
    role?: string;
  };
  actor?: {
    type?: string;
    cityCode?: string;
  };
  assignment?: {
    incidentId: string;
    assignmentId?: string;
    departmentId: string;
    contextUsage?: string;
  };
  tokenType?: string;
}

/**
 * Decode JWT token (without verification - for client-side use only)
 * For production, token should be validated on the server
 */
export function decodeShareToken(token: string): ShareTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const decoded = atob(parts[1]);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(payload: ShareTokenPayload): boolean {
  if (!payload.exp) return false;
  return payload.exp * 1000 < Date.now();
}

/**
 * Validate token payload structure
 */
export function validateTokenStructure(payload: ShareTokenPayload): boolean {
  return !!(
    payload.assignment?.departmentId &&
    (payload.tokenType === 'share_link' || payload.actor?.type === 'SHARE_LINK')
  );
}

/**
 * Check if token is for department-level access (can view all incidents for department)
 */
export function isDepartmentLevelAccess(payload: ShareTokenPayload): boolean {
  return !!(
    payload.assignment?.contextUsage === 'REPORT_ASSIGNMENT_DEPARTMENT' &&
    payload.assignment?.departmentId
  );
}

/**
 * Extract incident and department info from token
 */
export function getTokenInfo(token: string) {
  const payload = decodeShareToken(token);
  if (!payload) return null;

  const isExpired = isTokenExpired(payload);
  const isDeptLevel = isDepartmentLevelAccess(payload);
  const isValid = !isExpired && validateTokenStructure(payload);

  return {
    incidentId: payload.assignment?.incidentId,
    assignmentId: payload.assignment?.assignmentId,
    departmentId: payload.assignment?.departmentId,
    cityCode: payload.actor?.cityCode,
    contextUsage: payload.assignment?.contextUsage,
    scope: payload.assignment?.assignmentId ? 'ASSIGNMENT_ONLY' : 'DEPT_ACTIVE',
    isDepartmentLevel: isDeptLevel,
    isExpired,
    isValid,
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
  };
}
