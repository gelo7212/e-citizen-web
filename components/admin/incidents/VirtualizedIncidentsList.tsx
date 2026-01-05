'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Incident, IncidentSeverity, IncidentStatus } from '@/types';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Card } from '@/components/shared/Card';

interface VirtualizedIncidentsListProps {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  severityFilter: 'low' | 'medium' | 'high' | '';
  statusFilter: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected' | 'cancelled' | 'for_review' | '';
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  sortField: 'createdAt' | 'severity' | 'status' | 'title';
  sortOrder: 'asc' | 'desc';
}

export function VirtualizedIncidentsList({
  incidents,
  loading,
  error,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  severityFilter,
  statusFilter,
  searchQuery,
  dateFrom,
  dateTo,
  sortField,
  sortOrder,
}: VirtualizedIncidentsListProps) {
  const severityColors: Record<IncidentSeverity, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const statusColors: Record<string, string> = {
    open: 'bg-gray-100 text-gray-800',
    for_review: 'bg-yellow-100 text-yellow-800',
    acknowledged: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-500 text-white',
  };

  // Server-side filtering is already done, so just calculate stats from current page
  const stats = useMemo(() => {
    const totalByStatus: Record<string, number> = {
      open: 0,
      for_review: 0,
      acknowledged: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      cancelled: 0,
    };
    const totalBySeverity = {
      low: 0,
      medium: 0,
      high: 0,
    };

    incidents.forEach((inc) => {
      if (inc.status in totalByStatus) totalByStatus[inc.status]++;
      totalBySeverity[inc.severity]++;
    });

    return { totalByStatus, totalBySeverity };
  }, [incidents]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {incidents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="bg-blue-50 p-2 rounded">
            <div className="font-bold text-blue-900">{total}</div>
            <div className="text-blue-700">Results</div>
          </div>
          <div className="bg-red-50 p-2 rounded">
            <div className="font-bold text-red-900">{stats.totalBySeverity.high}</div>
            <div className="text-red-700">High</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded">
            <div className="font-bold text-yellow-900">{stats.totalBySeverity.medium}</div>
            <div className="text-yellow-700">Medium</div>
          </div>
          <div className="bg-purple-50 p-2 rounded">
            <div className="font-bold text-purple-900">{stats.totalByStatus.in_progress}</div>
            <div className="text-purple-700">Progress</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="font-bold text-green-900">{stats.totalByStatus.resolved}</div>
            <div className="text-green-700">Resolved</div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-800 rounded text-sm">
          {error}
        </div>
      )}

      {incidents.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-admin-600">
            {searchQuery || severityFilter || statusFilter || dateFrom || dateTo
              ? 'No incidents match your filters'
              : 'No incidents found'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <Link key={incident.id} href={`/admin/city/incidents/${incident.id}`}>
              <div className="p-4 bg-white border border-admin-200 rounded-lg hover:shadow-md cursor-pointer transition-shadow">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-admin-900 truncate">{incident.title}</h3>
                    <p className="text-sm text-admin-600 line-clamp-2">{incident.description}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${severityColors[incident.severity]}`}>
                      {incident.severity.charAt(0).toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusColors[incident.status]}`}>
                      {incident.status.replace('_', ' ').substring(0, 8)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-admin-500">
                  <span>📍 {incident.location.cityCode}</span>
                  <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
