'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import { useScopes } from '@/hooks/useScopes';
import { isAppAdmin } from '@/lib/auth/roleAccess';

export default function SuperUserAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useRequireAuth();
  const scopes = useScopes();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAppAdmin(auth.user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <p className="text-red-600 font-bold text-lg">Access Denied</p>
          <p className="text-gray-600 mt-2">Super-User access is required to view this page.</p>
          <p className="text-sm text-gray-500 mt-3">Role: <span className="font-mono">{auth.user?.role}</span></p>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              window.location.href = '/citizen/home';
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const superUserLinks = [
    { label: 'Dashboard', href: '/admin/super-user', show: true, icon: '📊' },
    { label: 'Admin Accounts', href: '/admin/super-user/accounts', show: true, icon: '👥' },
    { label: 'System Settings', href: '/admin/super-user/settings', show: true, icon: '⚙️' },
    { label: 'Audit Log', href: '/admin/super-user/audit', show: true, icon: '📝' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-gray-200">
          {sidebarOpen && (
            <>
              <h1 className="text-lg font-bold text-gray-900">e-Citizen</h1>
              <p className="text-xs text-gray-500 mt-1">Super-User</p>
            </>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-2 px-3">
          {superUserLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group"
              title={!sidebarOpen ? link.label : undefined}
            >
              <span className="text-xl flex-shrink-0">{link.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{link.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
              {auth.user?.role}
            </span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              window.location.href = '/citizen/home';
            }}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Logout
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
