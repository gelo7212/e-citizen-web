'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { IncidentsList } from '@/components/admin/incidents/IncidentsList';
import { Card } from '@/components/shared/Card';
import { getIncidentsByCity } from '@/lib/api/endpoints';
import { Incident } from '@/types';

export default function IncidentsPage() {
  const { user, isLoading } = useAuth();
  const [emergencyIncidents, setEmergencyIncidents] = useState<Incident[]>([]);
  const [emergencyLoading, setEmergencyLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load emergency incidents (high severity)
  const loadEmergencies = async (cityCode: string) => {
    try {
      setEmergencyLoading(true);
      const response = await getIncidentsByCity(cityCode, {
        severity: 'high',
        status: 'open',
        limit: 50,
        skip: 0,
      });
      if (response.data) {
        setEmergencyIncidents(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load emergency incidents:', err);
    } finally {
      setEmergencyLoading(false);
    }
  };

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!user?.cityCode) return;

    // Initial load
    loadEmergencies(user.cityCode);

    // Set up interval for auto-refresh
    refreshIntervalRef.current = setInterval(() => {
      loadEmergencies(user.cityCode);
    }, 15000); // 15 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user?.cityCode]);

  if (isLoading) {
    return (
      <div className="p-8 admin-page">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.cityCode) {
    return <div className="text-red-600">City code not found</div>;
  }

  return (
    <div className="p-8 admin-page bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-admin-900 mb-2">Incident Management</h1>
        <p className="text-admin-600">View and manage all incidents reported in your city</p>
      </div>

      {/* Main Layout: Incidents on left, Emergency Concerns on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Incidents List - Takes 3 columns */}
        <div className="lg:col-span-3">
          <IncidentsList cityCode={user.cityCode} />
        </div>

        {/* Emergency Concerns Panel - Sticky right sidebar - Takes 1 column */}
        <div className="lg:sticky lg:top-8 lg:h-fit">
          <Card className="p-6 bg-white shadow-lg rounded-lg">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="text-2xl">🚨</div>
              <h2 className="text-xl font-bold text-red-700">Emergency</h2>
            </div>

            {/* Emergency Count Badge */}
            {emergencyIncidents.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-3xl font-bold text-red-700">{emergencyIncidents.length}</div>
                <div className="text-xs text-red-600 font-semibold">HIGH SEVERITY</div>
              </div>
            )}

            {/* Emergency Status Breakdown */}
            {emergencyIncidents.length > 0 && (
              <div className="mb-4 space-y-2 text-sm">
                {emergencyIncidents.filter(i => i.status === 'open').length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                    <span className="text-orange-700 font-medium text-xs">⚠️ Unacknowledged</span>
                    <span className="bg-orange-200 text-orange-900 font-bold px-2 py-1 rounded text-xs">
                      {emergencyIncidents.filter(i => i.status === 'open').length}
                    </span>
                  </div>
                )}
                {emergencyIncidents.filter(i => i.status === 'in_progress').length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200">
                    <span className="text-purple-700 font-medium text-xs">⚙️ Progress</span>
                    <span className="bg-purple-200 text-purple-900 font-bold px-2 py-1 rounded text-xs">
                      {emergencyIncidents.filter(i => i.status === 'in_progress').length}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Emergency List */}
            {emergencyLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : emergencyIncidents.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">✨</div>
                <p className="text-sm text-gray-600 font-medium">No Emergencies</p>
                <p className="text-xs text-gray-500">All clear!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {emergencyIncidents
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((incident) => (
                    <Link
                      key={incident.id}
                      href={`/admin/city/incidents/${incident.id}`}
                      className="block group"
                    >
                      <div className="p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer">
                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-red-700">
                          {incident.title}
                        </h3>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1 mb-2">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              incident.status === 'in_progress'
                                ? 'bg-purple-100 text-purple-800'
                                : incident.status === 'acknowledged'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {incident.status === 'open'
                              ? '⚠️ Unacknowledged'
                              : incident.status === 'acknowledged'
                              ? '👁️ Acked'
                              : '⚙️ Progress'}
                          </span>
                        </div>

                        {/* Time */}
                        <div className="text-xs text-gray-500">
                          🕐 {new Date(incident.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            )}

            {/* Refresh Indicator */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                ⟳ Updates every 15s
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
