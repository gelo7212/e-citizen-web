'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthUser } from '@/types';
import {
  getAuthUser,
  getAuthToken,
  setAuth,
  clearAuth,
  isAuthenticated,
} from '@/lib/auth/store';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth from storage on component mount
    const authUser = getAuthUser();
    const authToken = getAuthToken();
    
    setUser(authUser);
    setToken(authToken);
    setIsLoading(false);

    // Debug log
    if (authUser) {
      console.log('Auth initialized from storage:', {
        user: authUser.id,
        role: authUser.role,
        scopes: authUser.scopes,
        isAuthenticated: !!authToken,
      });
    }
  }, []);

  const login = useCallback((authUser: AuthUser, authToken: string) => {
    setAuth(authUser, authToken);
    setUser(authUser);
    setToken(authToken);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: isAuthenticated(),
    login,
    logout,
  };
}

export function useRequireAuth() {
  const auth = useAuth();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    // Only redirect if loading is complete AND not authenticated AND not already redirected
    if (!auth.isLoading && !auth.isAuthenticated && !redirected) {
      console.warn('Not authenticated, redirecting to citizen portal');
      setRedirected(true);
      window.location.href = '/citizen/home';
    }
  }, [auth.isLoading, auth.isAuthenticated, redirected]);

  return auth;
}
