'use client';

import React from 'react';
import { InviteRole } from '@/types';

interface FilterBarProps {
  role?: InviteRole;
  municipalityCode?: string;
  onRoleChange?: (role: InviteRole | undefined) => void;
  onMunicipalityChange?: (code: string) => void;
}

export default function InvitesFilterBar({
  role,
  municipalityCode,
  onRoleChange,
  onMunicipalityChange,
}: FilterBarProps) {
  const roleOptions: { label: string; value: InviteRole }[] = [
    { label: 'City Admin', value: 'CITY_ADMIN' },
    { label: 'SOS Admin', value: 'SOS_ADMIN' },
    { label: 'SK Admin', value: 'SK_ADMIN' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="filter-role" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Role
          </label>
          <select
            id="filter-role"
            value={role || ''}
            onChange={(e) => onRoleChange?.(e.target.value ? (e.target.value as InviteRole) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-municipality" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Municipality
          </label>
          <input
            id="filter-municipality"
            type="text"
            value={municipalityCode || ''}
            onChange={(e) => onMunicipalityChange?.(e.target.value)}
            placeholder="e.g., QZN"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
          />
        </div>
      </div>
    </div>
  );
}
