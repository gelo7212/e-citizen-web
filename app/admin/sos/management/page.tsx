'use client';

import React, { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useScopes } from '@/hooks/useScopes';
import { AssignRescuerModal } from '@/components/admin/sos/AssignRescuerModal';
import type { NearbySOS } from '@/lib/services/sosService';

export default function SOSManagementPage() {
  const auth = useRequireAuth();
  const scopes = useScopes();
  const [sosRequests, setSOSRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSOSId, setSelectedSOSId] = useState<string | null>(null);

  // Note: Typically you'd fetch SOS requests here
  // For now, displaying the structure to work with actual SOS data

  if (!auth.isAuthenticated) {
    return <div className="p-4">Loading...</div>;
  }

  const handleAssignClick = (sosId: string) => {
    setSelectedSOSId(sosId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSOSId(null);
  };

  // Filter and search
  let filteredRequests = sosRequests;

  if (filterStatus !== 'all') {
    filteredRequests = filteredRequests.filter((sos) => sos.status === filterStatus.toUpperCase());
  }

  if (searchQuery) {
    filteredRequests = filteredRequests.filter(
      (sos) =>
        sos.sosId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sos.citizenId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Calculate statistics
  const stats = {
    total: sosRequests.length,
    pending: 0,
    assigned: 0,
    resolved: sosRequests.filter((sos) => sos.status === 'resolved').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 border-b border-red-800">
        <h1 className="text-4xl font-bold text-white">Request Management</h1>
        <p className="text-red-100 mt-2">Manage and track all SOS requests</p>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm text-blue-100 mb-2">Total Requests</p>
            <p className="text-4xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm text-yellow-100 mb-2">Pending</p>
            <p className="text-4xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm text-orange-100 mb-2">Assigned</p>
            <p className="text-4xl font-bold">{stats.assigned}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm text-green-100 mb-2">Resolved</p>
            <p className="text-4xl font-bold">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by SOS ID or User ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                    SOS ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                    Notes
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No SOS requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((sos) => (
                    <tr key={sos.sosId} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-red-400 font-medium">
                        {sos.sosId}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {sos.citizenId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                            sos.status === 'active'
                              ? 'bg-red-500/20 text-red-300'
                              : sos.status === 'inactive'
                              ? 'bg-orange-500/20 text-orange-300'
                              : sos.status === 'resolved'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-slate-600/50 text-slate-300'
                          }`}
                        >
                          {sos.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {sos.location.latitude.toFixed(4)}, {sos.location.longitude.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {sos.address?.barangay || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(sos.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleAssignClick(sos.sosId)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors whitespace-nowrap"
                        >
                          Assign Rescue
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 text-red-300">
            {error}
          </div>
        </div>
      )}

      {/* Assign Rescuer Modal */}
      {selectedSOSId && (
        <AssignRescuerModal
          sosId={selectedSOSId}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={() => {
            // Optionally refresh the list or show a success message
            console.log('Rescuer assigned successfully');
          }}
        />
      )}
    </div>
  );
}
