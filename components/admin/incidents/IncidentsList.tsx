'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Incident, IncidentSeverity, IncidentStatus } from '@/types';
import { getIncidentsByCity } from '@/lib/api/endpoints';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Card } from '@/components/shared/Card';

interface IncidentsListProps {
  cityCode: string;
}

type SortField = 'createdAt' | 'severity' | 'status' | 'title';
type SortOrder = 'asc' | 'desc';

export function IncidentsList({ cityCode }: IncidentsListProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false); // Separate state for filter loading
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState(''); // Local input state
  const [searchQuery, setSearchQuery] = useState(''); // Debounced state for API
  const [severityFilter, setSeverityFilter] = useState<'low' | 'medium' | 'high' | ''>('');
  const [statusFilter, setStatusFilter] = useState<'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected' | 'cancelled' | ''>('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Calculate statistics from current page (estimate based on current results)
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

  // Memoize the statistics display to prevent layout flicker
  const statsDisplay = useMemo(() => {
    if (total === 0) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-2xl font-bold text-blue-900">{total}</div>
          <div className="text-sm text-blue-700">Total Incidents</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-2xl font-bold text-red-900">{stats.totalBySeverity.high}</div>
          <div className="text-sm text-red-700">High Severity</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="text-2xl font-bold text-yellow-900">{stats.totalBySeverity.medium}</div>
          <div className="text-sm text-yellow-700">Medium Severity</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-2xl font-bold text-purple-900">{stats.totalByStatus.in_progress}</div>
          <div className="text-sm text-purple-700">In Progress</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-2xl font-bold text-green-900">{stats.totalByStatus.resolved}</div>
          <div className="text-sm text-green-700">Resolved</div>
        </Card>
      </div>
    );
  }, [total, stats]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
      setSkip(0); // Reset pagination when search changes
    }, 500); // 500ms debounce
  }, []);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        // Only show full loading on initial load, not on filter changes
        if (skip === 0 && incidents.length === 0) {
          setLoading(true);
        } else {
          setIsFilterLoading(true);
        }
        
        setError(null);
        const response = await getIncidentsByCity(cityCode, {
          limit,
          skip,
          search: searchQuery || undefined,
          severity: (severityFilter || undefined) as any,
          status: (statusFilter || undefined) as any,
          startDate: dateFrom || undefined,
          endDate: dateTo || undefined,
          sortBy: sortField,
          sortOrder: sortOrder,
        });
        if (response.data) {
          setIncidents(response.data.data || []);
          setTotal(response.data.pagination?.total || 0);
        } else if (response.error) {
          setError(response.error?.message || 'Failed to load incidents');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load incidents');
      } finally {
        setLoading(false);
        setIsFilterLoading(false);
      }
    };

    loadIncidents();
  }, [cityCode, limit, skip, searchQuery, severityFilter, statusFilter, dateFrom, dateTo, sortField, sortOrder]);

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && skip + limit < total) {
      setSkip(skip + limit);
    } else if (direction === 'prev' && skip > 0) {
      setSkip(Math.max(0, skip - limit));
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setSkip(0); // Reset to first page
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setSeverityFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSkip(0);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Summary */}
      {statsDisplay}

      {/* Search and Filters */}
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-admin-900">Filters</h3>
          {(searchInput || severityFilter || statusFilter || dateFrom || dateTo) && (
            <button
              onClick={handleResetFilters}
              className="text-sm px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-admin-700 mb-2">
            Search by Title or Description
          </label>
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-admin-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <p className="text-xs text-admin-500 mt-1">Searching for: "{searchQuery}"</p>
          )}
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-admin-700 mb-2">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value as 'low' | 'medium' | 'high' | '');
                setSkip(0);
              }}
              className="w-full px-4 py-2 border border-admin-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-admin-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected' | 'cancelled' | '');
                setSkip(0);
              }}
              className="w-full px-4 py-2 border border-admin-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="for_review">For Review</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-admin-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setSkip(0);
              }}
              className="w-full px-4 py-2 border border-admin-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-admin-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setSkip(0);
              }}
              className="w-full px-4 py-2 border border-admin-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Items Per Page */}
        <div>
          <label className="block text-sm font-medium text-admin-700 mb-2">Items Per Page</label>
          <div className="flex gap-2">
            {[25, 50, 100].map((value) => (
              <button
                key={value}
                onClick={() => handleLimitChange(value)}
                className={`px-4 py-2 rounded transition ${
                  limit === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Header with Pagination and Sorting */}
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-admin-900">Incidents</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange('prev')}
            disabled={skip === 0}
            className="px-4 py-2 bg-admin-200 text-admin-900 rounded disabled:opacity-50 hover:bg-admin-300 transition"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-admin-600 whitespace-nowrap">
            {skip + 1} - {Math.min(skip + limit, total)} of {total}
          </span>
          <button
            onClick={() => handlePageChange('next')}
            disabled={skip + limit >= total}
            className="px-4 py-2 bg-admin-200 text-admin-900 rounded disabled:opacity-50 hover:bg-admin-300 transition"
          >
            Next
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-800 rounded">
          {error}
        </div>
      )}

      {incidents.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-admin-600">{searchInput || severityFilter || statusFilter ? 'No incidents match your filters' : 'No incidents found'}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Sort Options */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleSortChange('createdAt')}
              className={`px-3 py-2 rounded text-sm font-medium whitespace-nowrap transition ${
                sortField === 'createdAt'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={isFilterLoading}
            >
              Date {sortField === 'createdAt' && getSortIcon('createdAt')}
            </button>
            <button
              onClick={() => handleSortChange('severity')}
              className={`px-3 py-2 rounded text-sm font-medium whitespace-nowrap transition ${
                sortField === 'severity'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={isFilterLoading}
            >
              Severity {sortField === 'severity' && getSortIcon('severity')}
            </button>
            <button
              onClick={() => handleSortChange('status')}
              className={`px-3 py-2 rounded text-sm font-medium whitespace-nowrap transition ${
                sortField === 'status'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={isFilterLoading}
            >
              Status {sortField === 'status' && getSortIcon('status')}
            </button>
            <button
              onClick={() => handleSortChange('title')}
              className={`px-3 py-2 rounded text-sm font-medium whitespace-nowrap transition ${
                sortField === 'title'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={isFilterLoading}
            >
              Title {sortField === 'title' && getSortIcon('title')}
            </button>
          </div>

          {/* Incidents Grid with smooth fade transition */}
          <div className="relative">
            {isFilterLoading && (
              <div className="absolute top-0 right-0 z-10 flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                Updating...
              </div>
            )}
            <div className={`transition-all duration-300 ${isFilterLoading ? 'opacity-60' : 'opacity-100'}`}>
              <div className="grid gap-4">
              {incidents.map((incident) => (
                <Link key={incident.id} href={`/admin/city/incidents/${incident.id}`}>
                  <Card className={`p-6 hover:shadow-lg cursor-pointer transition-all duration-300 ${isFilterLoading ? 'hover:shadow-none' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-admin-900 mb-1">
                        {incident.title}
                      </h3>
                      <p className="text-sm text-admin-600">
                        {incident.description.substring(0, 100)}...
                      </p>
                      {incident.metadata?.reportCategory && (
                        <p className="text-xs text-admin-500 mt-2">📂 {incident.metadata.reportCategory}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${severityColors[incident.severity]}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${statusColors[incident.status]}`}>
                        {incident.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-admin-500">
                    <span>📍 {incident.location.cityCode}</span>
                    <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
                  </div>
                </Card>
              </Link>
            ))}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
