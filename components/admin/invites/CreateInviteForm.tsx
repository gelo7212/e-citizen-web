'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createInvite } from '@/lib/api/endpoints';
import { Alert } from '@/components/shared/Alert';
import { InviteRole, InviteResponse } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface CreateInviteFormProps {
  onSuccess?: (invite: InviteResponse) => void;
  onClose?: () => void;
  defaultMunicipalityCode?: string;
}

export default function CreateInviteForm({
  onSuccess,
  onClose,
  defaultMunicipalityCode,
}: CreateInviteFormProps) {
  const { user } = useAuth();
  const [role, setRole] = useState<InviteRole>('SOS_ADMIN');
  const [municipalityCode, setMunicipalityCode] = useState(defaultMunicipalityCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<InviteResponse | null>(null);
  const hasInitialized = useRef(false);

  // Load municipality code from user or default (only once)
  useEffect(() => {
    // Skip if already initialized
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (defaultMunicipalityCode) {
      setMunicipalityCode(defaultMunicipalityCode);
    } else if (user?.cityCode) {
      setMunicipalityCode(user.cityCode);
    }
  }, []);

  // Filter roles based on user's role
  const getRoleOptions = () => {
    const allRoles: { label: string; value: InviteRole }[] = [
      { label: 'City Admin', value: 'CITY_ADMIN' },
      { label: 'SOS Admin', value: 'SOS_ADMIN' },
      { label: 'SK Admin', value: 'SK_ADMIN' },
    ];

    // APP_ADMIN can create all roles except nothing
    // CITY_ADMIN can create SOS_ADMIN and SK_ADMIN (not CITY_ADMIN)
    if (user?.role?.toUpperCase() === 'CITY_ADMIN') {
      return allRoles.filter(r => r.value !== 'CITY_ADMIN');
    }

    return allRoles;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!municipalityCode.trim()) {
      setError('Municipality code is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await createInvite({
        role,
        municipalityCode: municipalityCode.trim().toUpperCase(),
      });

      if (response.success && response.data) {
        setCreatedInvite(response.data);
        setRole('SOS_ADMIN');
        setMunicipalityCode(defaultMunicipalityCode || '');
        onSuccess?.(response.data);
      } else {
        setError(response.error?.message || 'Failed to create invite');
      }
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to create invite';
      setError(message);
      console.error('Error creating invite:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = getRoleOptions();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Invite</h2>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
      {successMessage && <div className="mb-4"><Alert type="success" message={successMessage} /></div>}

      {createdInvite ? (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <p className="text-sm font-medium text-blue-900 mb-3">✓ Invite Created Successfully</p>
          <div className="space-y-3 text-sm text-blue-800">
            <p>
              <strong>Code:</strong>{' '}
              <code className="bg-white px-2 py-1 rounded font-mono text-base">{createdInvite.code}</code>
            </p>
            <p>
              <strong>Role:</strong> {createdInvite.role}
            </p>
            <p>
              <strong>Municipality:</strong> {createdInvite.municipalityCode}
            </p>
            <p>
              <strong>Expires:</strong> {new Date(createdInvite.expiresAt).toLocaleString()}
            </p>
            {createdInvite.inviteLink && (
              <div className="pt-2 border-t border-blue-200">
                <p className="font-semibold mb-2">Share Invite Link:</p>
                <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                  <code className="flex-1 text-xs overflow-auto">{createdInvite.inviteLink}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdInvite.inviteLink!);
                      alert('Link copied to clipboard!');
                    }}
                    className="flex-shrink-0 material-icons text-blue-600 hover:text-blue-800 cursor-pointer"
                    title="Copy link"
                  >
                    content_copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as InviteRole)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="municipalityCode" className="block text-sm font-medium text-gray-700 mb-1">
            Municipality Code {defaultMunicipalityCode && <span className="text-xs text-gray-500">(Your City)</span>}
          </label>
          <input
            id="municipalityCode"
            type="text"
            value={municipalityCode}
            onChange={(e) => setMunicipalityCode(e.target.value.toUpperCase())}
            placeholder="e.g., QZN"
            disabled={isLoading || !!defaultMunicipalityCode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed uppercase"
          />
          <p className="mt-1 text-xs text-gray-500">3-letter or number municipality code</p>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            {isLoading ? 'Creating...' : 'Create Invite'}
          </button>
        </div>
      </form>
    </div>
  );
}
