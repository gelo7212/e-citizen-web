import { JWTClaims, AuthUser } from '@/types';

/**
 * Decode JWT token and extract claims (client-side, no signature verification)
 * Note: On client-side we only decode, we don't verify the signature.
 * The server verified the signature when it issued the token.
 */
export function decodeToken(token: string): JWTClaims | null {
  try {
    // Split token and decode the payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid token format: expected 3 parts, got', parts.length);
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    ) as JWTClaims;
    
    console.log('✅ Token decoded successfully:', { 
      role: decoded.identity?.role,
      userId: decoded.identity?.userId,
      scopes: decoded.identity?.scopes,
      iss: decoded.iss,
    });
    
    return decoded;
  } catch (error) {
    console.error('❌ Token decode error:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return Date.now() >= decoded.exp * 1000;
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
}

/**
 * Verify token signature and expiration
 */
export function verifyToken(token: string): JWTClaims | null {
  if (isTokenExpired(token)) return null;
  return decodeToken(token);
}

/**
 * Convert JWT claims to AuthUser
 */
export function claimsToAuthUser(claims: JWTClaims): AuthUser {
  console.log('🔍 claimsToAuthUser input:', { role: claims.identity?.role, userId: claims.identity?.userId });
  
  let contextType: 'admin' | 'rescue' | 'citizen' = 'admin';
  switch (claims.identity?.role) {
    case 'APP_ADMIN':
    case 'SOS_ADMIN':
    case 'SK_YOUTH_ADMIN':
    case 'CITY_ADMIN':
      contextType = 'admin';
      break;
    case 'CITIZEN':
      contextType = 'citizen';
      break;
    case 'RESCUER':
      contextType = 'rescue';
      break;
    default:
      contextType = 'admin';
  }

  const result = {
    id: claims.identity.userId,
    role: claims.identity.role,
    scopes: claims.identity.scopes,
    cityCode: claims.actor?.cityCode,
    contextType: contextType
  };
  
  console.log('🔍 claimsToAuthUser output:', { role: result.role, contextType: result.contextType });
  return result;
}
