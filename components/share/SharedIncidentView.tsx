'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Incident, Assignment } from '@/types';
import { getIncidentById, getAssignmentById } from '@/lib/api/endpoints';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Card } from '@/components/shared/Card';
import { IncidentMap } from '@/components/admin/incidents/IncidentMap';
import { AssignmentStatusCard } from './AssignmentStatusCard';

interface SharedIncidentViewProps {
  incidentId: string;
  cityCode: string;
  token?: string;
  assignmentId?: string;
  departmentId?: string;
  isShared?: boolean;
}

export function SharedIncidentView({ 
  incidentId, 
  cityCode, 
  token, 
  assignmentId,
  departmentId,
  isShared 
}: SharedIncidentViewProps) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthConfig = () => {
    if (token) {
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
    return undefined;
  };

  const authConfig = useMemo(() => getAuthConfig(), [token]);

  useEffect(() => {
    const loadIncident = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getIncidentById(incidentId, authConfig);
        if (response.data) {
          setIncident(response.data);
        } else {
          setError('Failed to load incident');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load incident');
      } finally {
        setLoading(false);
      }
    };

    const loadAssignment = async () => {
      if (!assignmentId) return;
      try {
        setAssignmentLoading(true);
        console.log('Loading assignment:', assignmentId, 'with auth config:', !!authConfig?.headers?.Authorization);
        const response = await getAssignmentById(assignmentId, authConfig);
        console.log('Assignment response:', response);
        if (response.data) {
          setAssignment(response.data);
        } else {
          console.error('Failed to load assignment:', response.error);
        }
      } catch (err) {
        console.error('Failed to load assignment:', err);
      } finally {
        setAssignmentLoading(false);
      }
    };

    loadIncident();
    loadAssignment();
  }, [incidentId, assignmentId, authConfig]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!incident) {
    return (
      <div className="p-8">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold">Incident not found</p>
          <p className="text-sm mt-2">The incident you're looking for doesn't exist or access has been revoked.</p>
        </div>
      </div>
    );
  }

  const severityColors: Record<string, string> = {
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
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-800 rounded">
          {error}
        </div>
      )}

      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-admin-900 mb-4">{incident.title}</h2>
          <p className="text-admin-600 mb-6">{incident.description}</p>

          {incident.metadata?.reportCategory && (
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <p className="text-sm text-blue-800">
                <strong>Category:</strong> {incident.metadata.reportCategory}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs text-admin-500 uppercase">Severity</p>
              <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${severityColors[incident.severity]}`}>
                {incident.severity.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-admin-500 uppercase">Status</p>
              <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${statusColors[incident.status]}`}>
                {incident.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-admin-500 uppercase">Created</p>
              <p className="text-sm font-medium">{new Date(incident.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-admin-500 uppercase">Updated</p>
              <p className="text-sm font-medium">{new Date(incident.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <IncidentMap location={incident.location} title={`${incident.title} - Location`} />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold text-admin-900 mb-3">Location Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-admin-500 uppercase">Latitude</p>
                <p className="text-sm">{incident.location.lat}</p>
              </div>
              <div>
                <p className="text-xs text-admin-500 uppercase">Longitude</p>
                <p className="text-sm">{incident.location.lng}</p>
              </div>
              <div>
                <p className="text-xs text-admin-500 uppercase">City Code</p>
                <p className="text-sm">{incident.location.cityCode}</p>
              </div>
              {incident.location.barangayCode && (
                <div>
                  <p className="text-xs text-admin-500 uppercase">Barangay Code</p>
                  <p className="text-sm">{incident.location.barangayCode}</p>
                </div>
              )}
            </div>
          </div>

          {incident.reporter && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold text-admin-900 mb-3">Reporter</h3>
              <div className="grid grid-cols-3 gap-4">
                {incident.reporter.name && (
                  <div>
                    <p className="text-xs text-admin-500 uppercase">Name</p>
                    <p className="text-sm">{incident.reporter.name}</p>
                  </div>
                )}
                {incident.reporter.userId && (
                  <div>
                    <p className="text-xs text-admin-500 uppercase">User ID</p>
                    <p className="text-sm font-mono">{incident.reporter.userId}</p>
                  </div>
                )}
                {incident.reporter.role && (
                  <div>
                    <p className="text-xs text-admin-500 uppercase">Role</p>
                    <p className="text-sm capitalize">{incident.reporter.role}</p>
                  </div>
                )}
                {incident.reporter.contact && (
                  <div>
                    <p className="text-xs text-admin-500 uppercase">Contact</p>
                    <p className="text-sm">{incident.reporter.contact}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Shared View - Assignment Info Section */}
      {isShared && assignmentId && (
        assignment ? (
          <AssignmentStatusCard
            assignment={assignment}
            incidentId={incidentId}
            onStatusChanged={async () => {
              // Reload assignment after status change
              try {
                const response = await getAssignmentById(assignmentId, authConfig);
                if (response.data) {
                  setAssignment(response.data);
                }
              } catch (err) {
                console.error('Failed to reload assignment:', err);
              }
            }}
            authConfig={authConfig}
          />
        ) : (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-admin-900 mb-4">Assignment Status</h3>
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">
                Loading assignment details... Assignment ID: <span className="font-mono font-semibold">{assignmentId}</span>
              </p>
            </div>
            
            {/* Show loading spinner or message */}
            <div className="text-center py-8">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-8 w-8 border border-gray-300 border-t-blue-600"></div>
              </div>
              <p className="text-sm text-gray-600 mt-3">Loading assignment details...</p>
            </div>
          </Card>
        )
      )}
    </div>
  );
}

