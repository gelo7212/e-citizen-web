'use client';

import { useState } from 'react';
import { RoleGuard } from '@/components/shared/RoleGuard';
import { Card } from '@/components/shared/Card';
import CreateInviteForm from '@/components/admin/invites/CreateInviteForm';
import InvitesList from '@/components/admin/invites/InvitesList';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface CityUser {
  id: string;
  email: string;
  name: string;
  role: 'sos' | 'rescuer' | 'sk';
  status: 'active' | 'pending' | 'inactive';
  invitedAt: string;
  joinedAt?: string;
}

interface CityInfo {
  cityCode: string;
  cityName: string;
  totalUsers: number;
  activeUsers: number;
}

export default function CityManagementPage() {
  const { user } = useAuth();
  const [cityInfo, setCityInfo] = useState<CityInfo | null>(null);
  const [users, setUsers] = useState<CityUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshInvites, setRefreshInvites] = useState(0);
  const [showFormInfo, setShowFormInfo] = useState(true);

  const handleInviteSuccess = () => {
    setRefreshInvites(prev => prev + 1);
  };

  return (
    <RoleGuard requiredRoles={['city_admin']}>
      <div className="admin-page p-8">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-admin-900">City Management</h1>
            <p className="mt-2 text-admin-600">
              Manage city information, user invitations, and staff
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        {user?.cityCode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-admin-600 text-sm font-medium mb-1">Your City</p>
                  <p className="text-2xl font-bold text-admin-900">{user.cityCode}</p>
                </div>
                <div className="material-icons text-4xl text-blue-600 opacity-20">location_city</div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-admin-600 text-sm font-medium mb-1">Your Role</p>
                  <p className="text-2xl font-bold text-admin-900 capitalize">{user.role || 'Admin'}</p>
                </div>
                <div className="material-icons text-4xl text-purple-600 opacity-20">admin_panel_settings</div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-admin-600 text-sm font-medium mb-1">Management Hub</p>
                  <p className="text-sm text-admin-900 font-semibold">Invites & Users</p>
                </div>
                <div className="material-icons text-4xl text-green-600 opacity-20">group</div>
              </div>
            </Card>
          </div>
        )}

        {/* City Info Card */}
        {cityInfo && (
          <Card>
            <h2 className="text-lg font-semibold text-admin-900 mb-4">City Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-admin-600">City Code</p>
                <p className="text-2xl font-bold text-admin-900">{cityInfo.cityCode}</p>
              </div>
              <div>
                <p className="text-sm text-admin-600">City Name</p>
                <p className="text-2xl font-bold text-admin-900">{cityInfo.cityName}</p>
              </div>
              <div>
                <p className="text-sm text-admin-600">Total Users</p>
                <p className="text-2xl font-bold text-admin-900">{cityInfo.totalUsers}</p>
              </div>
              <div>
                <p className="text-sm text-admin-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{cityInfo.activeUsers}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Info Message */}
        {showFormInfo && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-start">
            <div className="flex gap-3 flex-1">
              <span className="material-icons text-blue-600 flex-shrink-0">info</span>
              <div>
                <p className="font-semibold text-blue-900">Invite System</p>
                <p className="text-sm text-blue-800 mt-1">Create invitations for your city staff. Invites expire in 15 minutes and can only be used once. Share the generated link with the recipient.</p>
              </div>
            </div>
            <button
              onClick={() => setShowFormInfo(false)}
              className="text-blue-600 hover:text-blue-800 flex-shrink-0 ml-4"
            >
              <span className="material-icons text-sm">close</span>
            </button>
          </div>
        )}

        {/* Sections Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Invite Form - Takes 1 column */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <h2 className="text-lg font-semibold text-admin-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-blue-600">mail</span>
                Create Invite
              </h2>
              <CreateInviteForm 
                onSuccess={handleInviteSuccess}
                defaultMunicipalityCode={user?.cityCode}
              />
            </Card>
          </div>

          {/* Active Invites List - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-semibold text-admin-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-green-600">check_circle</span>
                Active Invitations
              </h2>
              <InvitesList 
                municipalityCode={user?.cityCode}
                refreshTrigger={refreshInvites}
              />
            </Card>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-admin-900 mb-4">Other Management Areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/city/config">
              <div className="p-4 border border-admin-200 rounded-lg hover:bg-admin-50 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="material-icons text-purple-600">settings</span>
                  <div>
                    <p className="font-semibold text-admin-900 text-sm">City Configuration</p>
                    <p className="text-xs text-admin-600 mt-0.5">Manage city settings</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/admin/city/departments">
              <div className="p-4 border border-admin-200 rounded-lg hover:bg-admin-50 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="material-icons text-green-600">fire_truck</span>
                  <div>
                    <p className="font-semibold text-admin-900 text-sm">Departments</p>
                    <p className="text-xs text-admin-600 mt-0.5">Manage response teams</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/admin/city/sos-hq">
              <div className="p-4 border border-admin-200 rounded-lg hover:bg-admin-50 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="material-icons text-red-600">emergency</span>
                  <div>
                    <p className="font-semibold text-admin-900 text-sm">SOS HQ</p>
                    <p className="text-xs text-admin-600 mt-0.5">Manage response centers</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
