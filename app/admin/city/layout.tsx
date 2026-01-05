'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import { useScopes } from '@/hooks/useScopes';
import { isCityAdmin, isAppAdmin } from '@/lib/auth/roleAccess';

export default function CityAdminLayout({
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

  if (!isCityAdmin(auth.user) && !isAppAdmin(auth.user)) {
    console.warn('City Admin check failed:', {
      user: auth.user?.id,
      role: auth.user?.role,
      roleUpperCase: auth.user?.role?.toUpperCase(),
      isCityAdmin: isCityAdmin(auth.user),
      isAppAdmin: isAppAdmin(auth.user),
    });
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <p className="text-red-600 font-bold text-lg">Access Denied</p>
          <p className="text-gray-600 mt-2">City Admin access is required to view this page.</p>
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

  const cityAdminLinks = [
    { label: 'Dashboard', href: '/admin/city', show: true, icon: 'dashboard' },
    { label: 'City Configuration', href: '/admin/city/config', show: true, icon: 'settings' },
    { label: 'City Management', href: '/admin/city/management', show: true, icon: 'location_city' },
    { label: 'Incidents', href: '/admin/city/incidents', show: true, icon: 'assignment_late' },
    { label: 'Departments', href: '/admin/city/departments', show: true, icon: 'fire_truck' },
    { label: 'SOS HQ', href: '/admin/city/sos-hq', show: true, icon: 'emergency' },
    { label: 'Reports', href: '/admin/city/reports', show: true, icon: 'description' },
    { label: 'Announcements', href: '/admin/city/announcements', show: true, icon: 'notifications_active' },
  ];

  return (
    <div className="flex h-screen admin-page">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} admin-sidebar overflow-y-auto transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-admin-200">
          {sidebarOpen && (
            <>
              <h1 className="text-lg font-bold text-admin-900">e-Citizen</h1>
              <p className="text-xs text-admin-500 mt-1">City Admin Portal</p>
            </>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {cityAdminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-admin-md text-admin-700 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transition-colors group"
              title={!sidebarOpen ? link.label : undefined}
            >
              <span className="material-icons flex-shrink-0 text-xl">{link.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{link.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-admin-200 p-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center py-2 text-admin-600 hover:bg-admin-100 rounded-admin-md transition-colors font-semibold"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            <span className="material-icons text-xl">
              {sidebarOpen ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <div className="admin-header px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-admin-600">Logged in as</span>
              <span className="admin-badge admin-badge-primary text-xs font-semibold">
                {auth.user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              window.location.href = '/citizen/home';
            }}
            className="admin-btn admin-btn-secondary text-sm"
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
