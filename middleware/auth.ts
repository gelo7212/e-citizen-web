import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';

/**
 * Middleware to check authentication and authorization
 */
export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const token = extractToken(req.headers.get('authorization'));
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TOKEN', message: 'No token provided' } },
        { status: 401 }
      );
    }
    
    const claims = verifyToken(token);
    if (!claims) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }
    
    // Attach claims to request for handler to use
    (req as any).claims = claims;
    
    return handler(req);
  };
}

/**
 * Check if user has required scope
 */
export function requireScope(scope: string) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      const claims = (req as any).claims;
      
      if (!claims || !claims.scopes || !claims.scopes.includes(scope)) {
        return NextResponse.json(
          { success: false, error: { code: 'INSUFFICIENT_SCOPE', message: 'Missing required scope' } },
          { status: 403 }
        );
      }
      
      return handler(req);
    };
  };
}
