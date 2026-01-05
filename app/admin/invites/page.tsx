'use client';

import React, { useState } from 'react';
import { RoleGuard } from '@/components/shared/RoleGuard';
import { Card } from '@/components/shared/Card';
import CreateInviteForm from '@/components/admin/invites/CreateInviteForm';
import InvitesList from '@/components/admin/invites/InvitesList';
import InvitesFilterBar from '@/components/admin/invites/FilterBar';
import { InviteRole, InviteResponse } from '@/types';

export default function AdminInvitesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<InviteRole | undefined>();
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleInviteCreated = (invite: InviteResponse) => {
    setShowCreateForm(false);
    // Trigger list refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleRoleFilterChange = (role: InviteRole | undefined) => {
    setSelectedRole(role);
  };

  const handleMunicipalityFilterChange = (code: string) => {
    setSelectedMunicipality(code);
  };

  return (
    <RoleGuard requiredRoles={['APP_ADMIN', 'CITY_ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Invites</h1>
            <p className="mt-2 text-gray-600">
              Create and manage user invitations for admin roles
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            {showCreateForm ? 'Cancel' : '+ Create Invite'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card>
            <CreateInviteForm
              onSuccess={handleInviteCreated}
              onClose={() => setShowCreateForm(false)}
            />
          </Card>
        )}

        {/* Filters */}
        <Card>
          <InvitesFilterBar
            role={selectedRole}
            municipalityCode={selectedMunicipality}
            onRoleChange={handleRoleFilterChange}
            onMunicipalityChange={handleMunicipalityFilterChange}
          />
        </Card>

        {/* Invites List */}
        <Card>
          <div className="p-0">
            <InvitesList
              role={selectedRole}
              municipalityCode={selectedMunicipality}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </Card>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Invite Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Invites expire after 15 minutes from creation</li>
            <li>✓ Each invite has a unique 6-digit code</li>
            <li>✓ Invites can only be accepted once</li>
            <li>✓ CITY_ADMIN can only create invites for their municipality</li>
          </ul>
        </div>
      </div>
    </RoleGuard>
  );
}
