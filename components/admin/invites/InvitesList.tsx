'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getInvites } from '@/lib/api/endpoints';
import { DataTable } from '@/components/shared/DataTable';
import { Invite, InviteRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface InvitesListProps {
  role?: InviteRole;
  municipalityCode?: string;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

export default function InvitesList({
  role,
  municipalityCode,
  onRefresh,
  refreshTrigger = 0,
}: InvitesListProps) {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const lastRequestParams = useRef<string>('');
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const loadInvites = async () => {
      // Create a unique key for this request
      const requestKey = JSON.stringify({ role, municipalityCode, page, limit, refreshTrigger });
      
      // Skip if this exact request is already in progress or was just completed
      if (lastRequestParams.current === requestKey && isFetchingRef.current) {
        return;
      }
      
      // Skip if request hasn't changed since last successful fetch
      if (lastRequestParams.current === requestKey && !isFetchingRef.current && total > 0) {
        return;
      }

      lastRequestParams.current = requestKey;
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const response = await getInvites({
          role,
          municipalityCode,
          page,
          limit,
        });

        if (response.success && response.data) {
          setInvites(response.data.invites);
          setTotal(response.data.total);
        } else {
          setError(response.error?.message || 'Failed to load invites');
        }
      } catch (err: any) {
        const message = err.response?.data?.error?.message || 'Failed to load invites';
        setError(message);
        console.error('Error loading invites:', err);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    };

    loadInvites();
  }, [page, limit, role, municipalityCode, refreshTrigger]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'USED':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (inviteRole: InviteRole) => {
    const labels: Record<InviteRole, string> = {
      CITY_ADMIN: 'City Admin',
      SOS_ADMIN: 'SOS Admin',
      SK_ADMIN: 'SK Admin',
    };
    return labels[inviteRole];
  };

  const handleCopyLink = (invite: Invite) => {
    const inviteLink = `${window.location.origin}/invites/${invite.id}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const columns = [
    {
      key: 'id',
      header: 'Invite ID',
      width: '20%',
      render: (value: string) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{value}</code>,
    },
    {
      key: 'code',
      header: 'Code',
      width: '12%',
      render: (value: string) => (
        <code className="text-sm font-mono font-semibold text-gray-900">{value}</code>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: '15%',
      render: (value: InviteRole) => (
        <span className="text-sm font-medium text-gray-700">{getRoleLabel(value)}</span>
      ),
    },
    {
      key: 'municipalityCode',
      header: 'Municipality',
      width: '12%',
      render: (value: string) => <span className="font-medium text-gray-900">{value}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '12%',
      render: (value: string) => (
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expires At',
      width: '18%',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{new Date(value).toLocaleString()}</span>
      ),
    },
    {
      key: 'usedAt',
      header: 'Used At',
      width: '18%',
      render: (value: string | null) =>
        value ? (
          <span className="text-sm text-gray-600">{new Date(value).toLocaleString()}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '12%',
      render: (value: string, row: Invite) => (
        <button
          onClick={() => handleCopyLink(row)}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition ${
            copiedId === value
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          <span className="material-icons text-sm">
            {copiedId === value ? 'check' : 'content_copy'}
          </span>
          {copiedId === value ? 'Copied!' : 'Copy Link'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={invites}
        isLoading={isLoading}
        emptyState={
          <div className="text-center py-8">
            <p className="text-gray-500">No invites found</p>
          </div>
        }
      />

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-medium">
              {(page - 1) * limit + 1}-{Math.min(page * limit, total)}
            </span>{' '}
            of <span className="font-medium">{total}</span> invites
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-700">
              Page {page}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * limit >= total || isLoading}
              className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
