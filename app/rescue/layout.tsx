'use client';

import React from 'react';
import { useRequireAuth } from '@/hooks/useAuth';

export default function RescueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useRequireAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Minimal navigation for rescue ops */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Rescue Operations</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{auth.user?.role}</span>
            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                window.location.href = '/citizen/home';
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Quick navigation */}
        <div className="bg-white border-b border-gray-200 px-8 py-3 flex gap-4">
          <a
            href="/rescue/active"
            className="px-4 py-2 hover:bg-gray-100 rounded"
          >
            Active SOS
          </a>
          <a
            href="/rescue/map"
            className="px-4 py-2 hover:bg-gray-100 rounded"
          >
            Live Map
          </a>
          <a
            href="/rescue/history"
            className="px-4 py-2 hover:bg-gray-100 rounded"
          >
            History
          </a>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
