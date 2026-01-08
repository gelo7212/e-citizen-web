'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Assignment, Incident } from '@/types';
import { getIncidentsByDepartment, getIncidentById } from '@/lib/api/endpoints';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Card } from '@/components/shared/Card';
import { SharedIncidentView } from './SharedIncidentView';

interface DepartmentIncidentsViewProps {
  cityCode: string;
  departmentCode: string;
  token: string;
  preselectedIncidentId?: string;
}

export function DepartmentIncidentsView({
  cityCode,
  departmentCode,
  token,
  preselectedIncidentId,
}: DepartmentIncidentsViewProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [incidents, setIncidents] = useState<Map<string, Incident>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(preselectedIncidentId || null);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const authConfig = useMemo(() => getAuthConfig(), [token]);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getIncidentsByDepartment(cityCode, departmentCode, authConfig);
        
        if (response.data) {
          const assignmentsList = Array.isArray(response.data) ? response.data : response.data || [];
          setAssignments(assignmentsList);

          // Get unique incident IDs
          const incidentIds = [...new Set(assignmentsList.map((a) => a.incidentId))];
          
          // Load each incident
          const incidentsMap = new Map<string, Incident>();
          for (const incidentId of incidentIds) {
            try {
              const incidentResponse = await getIncidentById(incidentId, authConfig);
              if (incidentResponse.data) {
                incidentsMap.set(incidentId, incidentResponse.data);
              }
            } catch (err) {
              console.error(`Failed to load incident ${incidentId}:`, err);
            }
          }
          
          setIncidents(incidentsMap);
          
          // Select preselected incident, or the first one by default
          if (!selectedIncidentId && incidentIds.length > 0) {
            setSelectedIncidentId(incidentIds[0]);
          }
        } else {
          setError(response.error?.message || 'Failed to load assignments');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load department incidents');
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [cityCode, departmentCode, authConfig]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold">Error loading incidents</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-admin-600 text-lg">No incidents assigned to your department</p>
      </Card>
    );
  }

  // Group assignments by incident
  const incidentAssignments = new Map<string, Assignment[]>();
  assignments.forEach((assignment) => {
    if (!incidentAssignments.has(assignment.incidentId)) {
      incidentAssignments.set(assignment.incidentId, []);
    }
    incidentAssignments.get(assignment.incidentId)!.push(assignment);
  });

  // If viewing a specific incident, show the full incident view
  if (selectedIncidentId && incidents.has(selectedIncidentId)) {
    const currentAssignments = incidentAssignments.get(selectedIncidentId) || [];
    const incident = incidents.get(selectedIncidentId)!;

    return (
      <div className="space-y-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedIncidentId(null)}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            ← Back to List
          </button>
        </div>

        <SharedIncidentView
          incidentId={selectedIncidentId}
          assignmentId={currentAssignments[0]?.id}
          departmentId={currentAssignments[0]?.departmentCode}
          cityCode={cityCode}
          token={token}
          isShared={true}
        />
      </div>
    );
  }

  // Show list of incidents
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <h2 className="text-xl font-semibold text-admin-900 mb-4">
          Incidents Assigned to Your Department ({incidentAssignments.size})
        </h2>

        {Array.from(incidentAssignments.entries()).map(([incidentId, incidentAssns]) => {
          const incident = incidents.get(incidentId);

          return (
            <div
              key={incidentId}
              onClick={() => setSelectedIncidentId(incidentId)}
              className="cursor-pointer hover:shadow-lg transition"
            >
              <Card
                className="p-6"
              >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-admin-900 mb-2">
                    {incident?.title || 'Unknown Incident'}
                  </h3>
                  <p className="text-sm text-admin-600 line-clamp-2">
                    {incident?.description || 'No description'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-xs text-admin-500 uppercase">Severity</p>
                  <p className="font-medium capitalize">{incident?.severity || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-admin-500 uppercase">Status</p>
                  <p className="font-medium capitalize">{incident?.status || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-admin-500 uppercase">Assignments</p>
                  <p className="font-medium">{incidentAssns.length}</p>
                </div>
                <div>
                  <p className="text-xs text-admin-500 uppercase">Created</p>
                  <p className="font-medium">
                    {incident ? new Date(incident.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {incidentAssns.map((assignment) => (
                  <span
                    key={assignment.id}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      assignment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : assignment.status === 'accepted'
                          ? 'bg-blue-100 text-blue-800'
                          : assignment.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {assignment.status.toUpperCase()}
                  </span>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIncidentId(incidentId);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  View & Manage
                </button>
              </div>
            </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
