'use client';

import React from 'react';
import { Card } from '@/components/shared/Card';
import Link from 'next/link';

export default function SOSAdminDashboard() {
  return (
    <div className="p-8">      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/sos/monitor">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-red-500">
            <div className="text-4xl font-bold text-red-600 mb-2">🚨</div>
            <p className="text-lg font-bold text-gray-900">SOS Monitor</p>
            <p className="text-gray-600 text-sm mt-2">Real-time SOS tracking with live map</p>
          </div>
        </Link>

        <Link href="/admin/sos/management">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-orange-500">
            <div className="text-4xl font-bold text-orange-600 mb-2">⚠️</div>
            <p className="text-lg font-bold text-gray-900">SOS Management</p>
            <p className="text-gray-600 text-sm mt-2">Manage and track all SOS requests</p>
          </div>
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="text-4xl font-bold text-green-600 mb-2">📊</div>
          <p className="text-lg font-bold text-gray-900">Statistics</p>
          <p className="text-gray-600 text-sm mt-2">View SOS analytics and reports</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="text-4xl font-bold text-blue-600 mb-2">👮</div>
          <p className="text-lg font-bold text-gray-900">Responders</p>
          <p className="text-gray-600 text-sm mt-2">Manage emergency responders</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="text-4xl font-bold text-purple-600 mb-2">📍</div>
          <p className="text-lg font-bold text-gray-900">Locations</p>
          <p className="text-gray-600 text-sm mt-2">View incident hotspots</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="text-4xl font-bold text-indigo-600 mb-2">⏰</div>
          <p className="text-lg font-bold text-gray-900">Response Time</p>
          <p className="text-gray-600 text-sm mt-2">Monitor average response times</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Key Metrics</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Active Cases</span>
              <span className="text-2xl font-bold text-red-600">12</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Resolved Today</span>
              <span className="text-2xl font-bold text-green-600">8</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Avg Response Time</span>
              <span className="text-2xl font-bold text-blue-600">4m 32s</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Response Rate</span>
              <span className="text-2xl font-bold text-green-600">94%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              View Live Map
            </button>
            <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
              Active Incidents
            </button>
            <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
              Resolved Cases
            </button>
            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
              Responder Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
