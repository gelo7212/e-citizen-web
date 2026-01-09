'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createInvite } from '@/lib/api/endpoints';
import { getMunicipalities, Municipality } from '@/lib/api/geoEndpoints';
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
  const [municipalitySearch, setMunicipalitySearch] = useState('');
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<Municipality[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingMunicipalities, setSearchingMunicipalities] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<InviteResponse | null>(null);
  const hasInitialized = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load municipality code from user or default (only once)
  useEffect(() => {
    // Skip if already initialized
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (defaultMunicipalityCode) {
      setMunicipalityCode(defaultMunicipalityCode);
      setMunicipalitySearch(defaultMunicipalityCode);
    } else if (user?.cityCode) {
      setMunicipalityCode(user.cityCode);
      setMunicipalitySearch(user.cityCode);
    }
  }, []);

  // Search municipalities with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!municipalitySearch.trim()) {
      setMunicipalitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingMunicipalities(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await getMunicipalities(undefined, municipalitySearch);
        if (response.success && response.data) {
          setMunicipalitySuggestions(response.data);
          setShowSuggestions(true);
        } else {
          setMunicipalitySuggestions([]);
        }
      } catch (err) {
        console.error('Error searching municipalities:', err);
        setMunicipalitySuggestions([]);
      } finally {
        setSearchingMunicipalities(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [municipalitySearch]);

  // Filter roles based on user's role
  const getRoleOptions = () => {
    const allRoles: { label: string; value: InviteRole }[] = [
      { label: 'City Admin', value: 'CITY_ADMIN' },
      { label: 'SOS Admin', value: 'SOS_ADMIN' },
      { label: 'SK Admin', value: 'SK_ADMIN' },
      { label: 'Rescuer', value: 'RESCUER' },
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

  const handleSelectMunicipality = (municipality: Municipality) => {
    setMunicipalityCode(municipality.code);
    setMunicipalitySearch(`${municipality.name} - ${municipality.province}`);
    setShowSuggestions(false);
  };

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
          <div className="relative">
            <input
              id="municipalityCode"
              type="text"
              value={municipalitySearch}
              onChange={(e) => setMunicipalitySearch(e.target.value)}
              onFocus={() => municipalitySearch.trim() && setShowSuggestions(true)}
              placeholder="Search city name or code... e.g., Quezon City"
              disabled={isLoading || !!defaultMunicipalityCode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed uppercase"
            />
            
            {/* Municipality Suggestions Dropdown */}
            {showSuggestions && municipalitySuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {municipalitySuggestions.map((municipality) => (
                  <button
                    key={municipality.code}
                    type="button"
                    onClick={() => handleSelectMunicipality(municipality)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex justify-between items-start border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{municipality.name}</div>
                      <div className="text-xs text-gray-500">{municipality.province} • {municipality.code}</div>
                    </div>
                    <div className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded ml-2 flex-shrink-0">
                      {municipality.code}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {searchingMunicipalities && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                <p className="text-sm text-gray-500">Searching...</p>
              </div>
            )}

            {showSuggestions && municipalitySearch.trim() && municipalitySuggestions.length === 0 && !searchingMunicipalities && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                <p className="text-sm text-gray-500">No municipalities found</p>
              </div>
            )}

            {/* Selected Municipality Code Display */}
            {municipalityCode && (
              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-700">
                  Selected code: <span className="font-mono font-bold text-blue-900">{municipalityCode}</span>
                </p>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">Search by city name or select from suggestions</p>
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
