'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { useScopes } from '@/hooks/useScopes';
import { isSosAdmin } from '@/lib/auth/roleAccess';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export default function SOSAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useRequireAuth();
  const scopes = useScopes();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/sos', icon: '📊' },
    { label: 'Monitor', href: '/admin/sos/monitor', icon: '🚨' },
    { label: 'Management', href: '/admin/sos/management', icon: '⚙️' },
    { label: 'Responders', href: '/admin/sos/responders', icon: '👮' },
    { label: 'Analytics', href: '/admin/sos/analytics', icon: '📈' },
  ];

  const isNavSelected = (href: string): boolean => {
    // Use exact path matching to avoid overlapping routes
    return pathname === href;
  };

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isSosAdmin(auth.user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center border border-red-200">
          <div className="text-5xl mb-4">🚨</div>
          <p className="text-red-600 font-bold text-lg">Access Denied</p>
          <p className="text-gray-600 mt-2">SOS Admin access is required to view this page.</p>
          <p className="text-sm text-gray-500 mt-3">Your Role: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{auth.user?.role}</span></p>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              window.location.href = '/citizen/home';
            }}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 shadow-lg flex flex-col overflow-y-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-500 rounded-lg">
              <span className="text-lg">🚨</span>
            </div>
            <h1 className="text-xl font-bold">SOS Command</h1>
          </div>
          <p className="text-slate-400 text-xs">Emergency Management</p>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                isNavSelected(item.href)
                  ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-500 ring-opacity-50'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-700">
          <div className="text-xs text-slate-400">Connected</div>
          <div className="text-sm font-medium text-white mt-1">{auth.user?.role || 'Admin'}</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">SOS Live Command Center</h2>
              <p className="text-sm text-slate-500 mt-1">Real-time emergency response monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('auth_user');
                  window.location.href = '/citizen/home';
                }}
                className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-300 transition-colors"
                title="Logout"
              >
                {auth.user?.id?.charAt(0).toUpperCase() || 'A'}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
