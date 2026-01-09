'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { useAuth } from '@/hooks/useAuth';
import {
  isAppAdmin,
  isCityAdmin,
  isSosAdmin,
  isYouthAdmin,
} from '@/lib/auth/roleAccess';

export default function AdminDashboardDefault() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to the administration panel
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Role</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{user.role}</p>
            </div>
            <div className="text-3xl">👤</div>
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Organization</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{user.cityCode || 'Global'}</p>
            </div>
            <div className="text-3xl">🏢</div>
          </div>
        </Card>
        <Card className="bg-purple-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scopes</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{user.scopes?.length || 0}</p>
            </div>
            <div className="text-3xl">🔐</div>
          </div>
        </Card>
        <Card className="bg-orange-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Context</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{user.contextType}</p>
            </div>
            <div className="text-3xl">⚙️</div>
          </div>
        </Card>
      </div>

      {/* Admin Sections */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Invites Section */}
          {(isAppAdmin(user) || isCityAdmin(user)) && (
            <Link href="/admin/invites" className="group">
              <Card className="h-full group-hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                    User Invites
                  </h3>
                  <span className="text-2xl">📧</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Create and manage user invitation links for admin roles
                </p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  Manage Invites
                  <span className="ml-2">→</span>
                </div>
              </Card>
            </Link>
          )}

          {/* City Setup Section */}
          {(isAppAdmin(user) || isCityAdmin(user)) && (
            <Link href="/admin/city" className="group">
              <Card className="h-full group-hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition">
                    City Setup
                  </h3>
                  <span className="text-2xl">🏙️</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Configure city settings and organization details
                </p>
                <div className="flex items-center text-green-600 text-sm font-medium">
                  Go to Setup
                  <span className="ml-2">→</span>
                </div>
              </Card>
            </Link>
          )}

          {/* SOS Management Section */}
          {(isAppAdmin(user) || isSosAdmin(user)) && (
            <Link href="/admin/sos" className="group">
              <Card className="h-full group-hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition">
                    SOS Management
                  </h3>
                  <span className="text-2xl">🚨</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Manage emergency response systems and SOS settings
                </p>
                <div className="flex items-center text-red-600 text-sm font-medium">
                  Go to SOS
                  <span className="ml-2">→</span>
                </div>
              </Card>
            </Link>
          )}

          {/* Accounts Management Section */}
          {isAppAdmin(user) && (
            <Link href="/admin/accounts" className="group">
              <Card className="h-full group-hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition">
                    Account Management
                  </h3>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Manage admin accounts and user access
                </p>
                <div className="flex items-center text-purple-600 text-sm font-medium">
                  Manage Accounts
                  <span className="ml-2">→</span>
                </div>
              </Card>
            </Link>
          )}

          {/* Super User Section */}
          {isAppAdmin(user) && (
            <Link href="/admin/super-user" className="group">
              <Card className="h-full group-hover:shadow-lg transition border-2 border-yellow-200">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition">
                    Super User
                  </h3>
                  <span className="text-2xl">⭐</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  System-wide administration and settings
                </p>
                <div className="flex items-center text-yellow-600 text-sm font-medium">
                  Super User Panel
                  <span className="ml-2">→</span>
                </div>
              </Card>
            </Link>
          )}

          {/* Rescuer Management Section */}
          {(isAppAdmin(user) || isCityAdmin(user)) && (
            <Link href="/admin/rescuer" className="group">
              <Card className="h-full group-hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition">
                    Rescuer Management
                  </h3>
                  <span className="text-2xl">🚑</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Manage rescue services and rescuer assignments
                </p>
                <div className="flex items-center text-orange-600 text-sm font-medium">
                  Manage Rescuers
                  <span className="ml-2">→</span>
                </div>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
        <p className="text-sm text-blue-800 mb-4">
          Use the sidebar navigation to access different admin sections. Each section allows you to manage specific aspects of the system.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
          <div>✓ Create and manage user invitations</div>
          <div>✓ Configure organization settings</div>
          <div>✓ Manage rescue operations</div>
          <div>✓ Monitor system health</div>
        </div>
      </Card>
    </div>
  );
}
