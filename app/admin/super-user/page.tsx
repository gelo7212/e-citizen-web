'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { useAuth } from '@/hooks/useAuth';
import { isAppAdmin } from '@/lib/auth/roleAccess';

export default function SuperUserAdminDashboard() {
  const { user } = useAuth();

  if (!user || !isAppAdmin(user)) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super-User Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System administration and account management</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-purple-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admin Accounts</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">System</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </Card>
        <Card className="bg-blue-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Invites Manager</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">Active</p>
            </div>
            <div className="text-3xl">📧</div>
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Settings</p>
              <p className="text-2xl font-bold text-green-600 mt-1">Config</p>
            </div>
            <div className="text-3xl">⚙️</div>
          </div>
        </Card>
        <Card className="bg-orange-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Audit Log</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">Monitor</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </Card>
      </div>

      {/* Super User Sections */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Super User Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* System Invites */}
          <Link href="/admin/super-user/invites" className="group">
            <Card className="h-full group-hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                  System Invites
                </h3>
                <span className="text-2xl">📧</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Create and manage admin invitations across all municipalities. Full system access.
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Manage Invites
                <span className="ml-2">→</span>
              </div>
            </Card>
          </Link>

          {/* Admin Accounts */}
          <Link href="/admin/accounts" className="group">
            <Card className="h-full group-hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition">
                  Admin Accounts
                </h3>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                View and manage all administrator accounts in the system
              </p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                Manage Accounts
                <span className="ml-2">→</span>
              </div>
            </Card>
          </Link>

          {/* System Settings */}
          <Link href="/admin/super-user/settings" className="group">
            <Card className="h-full group-hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition">
                  System Settings
                </h3>
                <span className="text-2xl">⚙️</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Configure system-wide settings and preferences
              </p>
              <div className="flex items-center text-green-600 text-sm font-medium">
                Configure
                <span className="ml-2">→</span>
              </div>
            </Card>
          </Link>

          {/* Audit Log */}
          <Link href="/admin/super-user/audit" className="group">
            <Card className="h-full group-hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition">
                  Audit Log
                </h3>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Monitor system activity and admin actions
              </p>
              <div className="flex items-center text-orange-600 text-sm font-medium">
                View Audit Log
                <span className="ml-2">→</span>
              </div>
            </Card>
          </Link>

          {/* City Management */}
          <Link href="/admin/super-user/cities" className="group">
            <Card className="h-full group-hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                  City Management
                </h3>
                <span className="text-2xl">🏢</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Manage municipalities and organization settings
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Manage Cities
                <span className="ml-2">→</span>
              </div>
            </Card>
          </Link>

          {/* System Health */}
          <Link href="/admin/super-user/health" className="group">
            <Card className="h-full group-hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition">
                  System Health
                </h3>
                <span className="text-2xl">🏥</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Monitor system health and performance metrics
              </p>
              <div className="flex items-center text-red-600 text-sm font-medium">
                Check Status
                <span className="ml-2">→</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Super User Info */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
        <h3 className="font-bold text-lg text-purple-900 mb-3">Super User Powers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">Invites</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>✓ No municipality restrictions</li>
              <li>✓ Create all role types</li>
              <li>✓ View system-wide invites</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">System</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>✓ Manage all admin accounts</li>
              <li>✓ Configure system settings</li>
              <li>✓ Monitor audit logs</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
