'use client';

import React from 'react';
import { Card } from '@/components/shared/Card';

export default function SKYouthAdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">SK-Youth Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">Manage youth programs and initiatives</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-3xl font-bold text-green-600">👦</div>
          <p className="text-gray-600 mt-2">Youth Management</p>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-blue-600">🎓</div>
          <p className="text-gray-600 mt-2">Programs</p>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-purple-600">📋</div>
          <p className="text-gray-600 mt-2">Reports</p>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-orange-600">📊</div>
          <p className="text-gray-600 mt-2">Analytics</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <p className="text-gray-600">
          Use the sidebar to navigate to specific youth program management sections.
        </p>
      </Card>
    </div>
  );
}
