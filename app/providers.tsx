'use client';

// Initialize auth on app load
import { initializeAuth } from '@/lib/auth/store';

if (typeof window !== 'undefined') {
  initializeAuth();
}

export default function App({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
