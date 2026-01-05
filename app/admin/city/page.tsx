'use client';

import React from 'react';
import Link from 'next/link';

export default function CityAdminDashboard() {
  return (
    <div className="p-8 admin-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-admin-900 mb-2">City Admin Dashboard</h1>
        <p className="text-admin-600">Manage city operations and administration</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/admin/city/config">
          <div className="admin-card cursor-pointer p-6 hover:shadow-admin-card-hover">
            <div className="material-icons text-4xl text-purple-600 mb-3">settings</div>
            <p className="text-admin-900 font-semibold">City Configuration</p>
            <p className="text-sm text-admin-600 mt-1">Manage city settings</p>
          </div>
        </Link>
        <Link href="/admin/city/management">
          <div className="admin-card cursor-pointer p-6 hover:shadow-admin-card-hover h-full">
            <div className="material-icons text-4xl text-blue-600 mb-3">location_city</div>
            <p className="text-admin-900 font-semibold">City Management</p>
            <p className="text-sm text-admin-600 mt-1">Manage users and invites</p>
          </div>
        </Link>
        <Link href="/admin/city/incidents">
          <div className="admin-card cursor-pointer p-6 hover:shadow-admin-card-hover">
            <div className="material-icons text-4xl text-orange-600 mb-3">assignment_late</div>
            <p className="text-admin-900 font-semibold">Incidents</p>
            <p className="text-sm text-admin-600 mt-1">Manage incident reports</p>
          </div>
        </Link>
        <Link href="/admin/city/departments">
          <div className="admin-card cursor-pointer p-6 hover:shadow-admin-card-hover">
            <div className="material-icons text-4xl text-green-600 mb-3">fire_truck</div>
            <p className="text-admin-900 font-semibold">Departments</p>
            <p className="text-sm text-admin-600 mt-1">Emergency response teams</p>
          </div>
        </Link>
        <Link href="/admin/city/sos-hq">
          <div className="admin-card cursor-pointer p-6 hover:shadow-admin-card-hover">
            <div className="material-icons text-4xl text-red-600 mb-3">emergency</div>
            <p className="text-admin-900 font-semibold">SOS HQ</p>
            <p className="text-sm text-admin-600 mt-1">Response centers</p>
          </div>
        </Link>
        <Link href="/admin/city/announcements">
          <div className="admin-card cursor-pointer p-6 hover:shadow-admin-card-hover">
            <div className="material-icons text-4xl text-purple-600 mb-3">notifications_active</div>
            <p className="text-admin-900 font-semibold">Announcements</p>
            <p className="text-sm text-admin-600 mt-1">Public updates</p>
          </div>
        </Link>
        <Link href="/admin/invites">
          <div className="admin-card cursor-pointer p-6 hover:shadow-admin-card-hover">
            <div className="material-icons text-4xl text-indigo-600 mb-3">mail_outline</div>
            <p className="text-admin-900 font-semibold">Invite Users</p>
            <p className="text-sm text-admin-600 mt-1">Create user invitations</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-card lg:col-span-2 p-6">
          <h2 className="text-xl font-bold text-admin-900 mb-6">Quick Start Guide</h2>
          <div className="space-y-3">
            <Link href="/admin/city/config" className="block p-4 hover:bg-blue-50 rounded-admin-md transition-colors border border-admin-100">
              <div className="flex items-center gap-3">
                <span className="material-icons text-purple-600">settings</span>
                <div>
                  <p className="text-sm font-semibold text-admin-900">City Configuration</p>
                  <p className="text-xs text-admin-600 mt-1">Configure city settings and information</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/city/incidents" className="block p-4 hover:bg-blue-50 rounded-admin-md transition-colors border border-admin-100">
              <div className="flex items-center gap-3">
                <span className="material-icons text-orange-600">assignment_late</span>
                <div>
                  <p className="text-sm font-semibold text-admin-900">Manage Incidents</p>
                  <p className="text-xs text-admin-600 mt-1">View and manage incident reports and assignments</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/city/departments" className="block p-4 hover:bg-blue-50 rounded-admin-md transition-colors border border-admin-100">
              <div className="flex items-center gap-3">
                <span className="material-icons text-blue-600">fire_truck</span>
                <div>
                  <p className="text-sm font-semibold text-admin-900">Manage Departments</p>
                  <p className="text-xs text-admin-600 mt-1">Create and manage emergency response departments</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/city/sos-hq" className="block p-4 hover:bg-blue-50 rounded-admin-md transition-colors border border-admin-100">
              <div className="flex items-center gap-3">
                <span className="material-icons text-red-600">emergency</span>
                <div>
                  <p className="text-sm font-semibold text-admin-900">Manage SOS HQ</p>
                  <p className="text-xs text-admin-600 mt-1">Configure emergency response centers and coverage areas</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/city/management" className="block p-4 hover:bg-blue-50 rounded-admin-md transition-colors border border-admin-100">
              <div className="flex items-center gap-3">
                <span className="material-icons text-green-600">group</span>
                <div>
                  <p className="text-sm font-semibold text-admin-900">Manage Users & Invites</p>
                  <p className="text-xs text-admin-600 mt-1">Invite and manage city staff and responders</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/city/announcements" className="block p-4 hover:bg-blue-50 rounded-admin-md transition-colors border border-admin-100">
              <div className="flex items-center gap-3">
                <span className="material-icons text-purple-600">notifications_active</span>
                <div>
                  <p className="text-sm font-semibold text-admin-900">Create Announcement</p>
                  <p className="text-xs text-admin-600 mt-1">Send updates to citizens and staff</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="admin-card p-6">
          <h2 className="text-xl font-bold text-admin-900 mb-6">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-admin-200">
              <span className="text-sm text-admin-600 font-medium">Database</span>
              <span className="admin-badge admin-badge-success text-xs flex items-center gap-1">
                <span className="material-icons text-sm">check_circle</span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-admin-200">
              <span className="text-sm text-admin-600 font-medium">API</span>
              <span className="admin-badge admin-badge-success text-xs flex items-center gap-1">
                <span className="material-icons text-sm">check_circle</span>
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-admin-600 font-medium">Services</span>
              <span className="admin-badge admin-badge-success text-xs flex items-center gap-1">
                <span className="material-icons text-sm">check_circle</span>
                Running
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
