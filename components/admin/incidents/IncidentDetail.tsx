'use client';

import React, { useState, useEffect } from 'react';
import { Incident, Assignment } from '@/types';
import { getIncidentById, getAssignmentsByIncident, updateIncidentStatus, createAssignment } from '@/lib/api/endpoints';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Card } from '@/components/shared/Card';
import { AssignmentList } from './AssignmentList';
import { AssignmentForm } from './AssignmentForm';
import { IncidentMap } from './IncidentMap';

interface IncidentDetailProps {
  incidentId: string;
  cityCode: string;
}

export function IncidentDetail({ incidentId, cityCode }: IncidentDetailProps) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const incidentResp = await getIncidentById(incidentId);
        if (incidentResp.data) {
          setIncident(incidentResp.data);
        } else {
          setError('Failed to load incident');
        }

        const assignmentsResp = await getAssignmentsByIncident(incidentId);
        if (assignmentsResp.data) {
          setAssignments(assignmentsResp.data.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load incident details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [incidentId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!incident) return;
    
    try {
      setStatusUpdating(true);
      const response = await updateIncidentStatus(incidentId, { status: newStatus as any });
      if (response.data) {
        setIncident(response.data);
      } else {
        setError(response.error?.message || 'Failed to update status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssignmentCreated = async () => {
    const assignmentsResp = await getAssignmentsByIncident(incidentId);
    if (assignmentsResp.data) {
      setAssignments(assignmentsResp.data.data || []);
    }
    setShowAssignmentForm(false);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!incident) {
    return <div className="text-red-600">Incident not found</div>;
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
              <select
                value={incident.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusUpdating}
                className={`px-3 py-1 rounded text-sm font-medium border ${statusColors[incident.status]}`}
              >
                <option value="open">Open</option>
                <option value="for_review">For Review</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
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

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-admin-900">Assignments</h3>
        <button
          onClick={() => setShowAssignmentForm(!showAssignmentForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showAssignmentForm ? 'Cancel' : 'New Assignment'}
        </button>
      </div>

      {showAssignmentForm && (
        <AssignmentForm
          incidentId={incidentId}
          cityCode={cityCode}
          onSuccess={handleAssignmentCreated}
        />
      )}

      <AssignmentList assignments={assignments} />
    </div>
  );
}
