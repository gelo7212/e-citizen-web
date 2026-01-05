'use client';

import React from 'react';
import { Card } from '@/components/shared/Card';

export default function SuperUserAdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Super-User Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">System administration and account management</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-3xl font-bold text-purple-600">👥</div>
          <p className="text-gray-600 mt-2">Admin Accounts</p>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-blue-600">⚙️</div>
          <p className="text-gray-600 mt-2">System Settings</p>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-green-600">📝</div>
          <p className="text-gray-600 mt-2">Audit Log</p>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-orange-600">📊</div>
          <p className="text-gray-600 mt-2">System Health</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <p className="text-gray-600">
          Use the sidebar to manage admin accounts, system settings, and view audit logs.
        </p>
      </Card>
    </div>
  );
}
