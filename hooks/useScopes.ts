'use client';

import React, { useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  canAccessAdmin,
  canManageCity,
  canManageSos,
  canManageYouth,
  canAccessRescue,
  canUpdateRescueStatus,
  canAccessCitizen,
  getContextRoute,
  hasScope,
} from '@/lib/auth/scopes';

export function useScopes() {
  const { user, token } = useAuth();

  // Extract cityCode from JWT token directly
  let cityCode: string | null = null;
  
  if (token) {
    try {
      // Decode JWT token (format: header.payload.signature)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        cityCode = payload.actor?.cityCode || null;
        console.log('Decoded cityCode from JWT:', cityCode);
      }
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
    }
  }

  // Also try to get from user object as fallback
  if (!cityCode && user) {
    cityCode = (user as any)?.actor?.cityCode || null;
  }

  const scopes = {
    canAccessAdmin: user ? canAccessAdmin(user) : false,
    canManageCity: user ? canManageCity(user) : false,
    canManageSos: user ? canManageSos(user) : false,
    canManageYouth: user ? canManageYouth(user) : false,
    canAccessRescue: user ? canAccessRescue(user) : false,
    canUpdateRescueStatus: user ? canUpdateRescueStatus(user) : false,
    canAccessCitizen: user ? canAccessCitizen(user) : false,
    hasScope: (scope: string) => user ? hasScope(user, scope) : false,
    contextRoute: user ? getContextRoute(user) : '/citizen',
    cityCode: cityCode,
  };

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('🔐 Scope Check:', {
        role: user.role,
        scopes: user.scopes,
        cityCode: cityCode,
        canAccessAdmin: scopes.canAccessAdmin,
        hasAdminRead: user.scopes?.includes('admin:read') || false,
      });
    }
    
    // Log token decode result
    if (token) {
      console.log('✅ JWT Token available, cityCode extracted:', cityCode);
    } else {
      console.log('⚠️ No JWT token available');
    }
  }, [user?.id, user?.scopes, cityCode, token]);

  return scopes;
}
