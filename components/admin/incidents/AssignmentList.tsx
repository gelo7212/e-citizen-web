'use client';

import React, { useState } from 'react';
import { Assignment, AssignmentStatus } from '@/types';
import { acceptAssignment, rejectAssignment, completeAssignment } from '@/lib/api/endpoints';
import { Card } from '@/components/shared/Card';

interface AssignmentListProps {
  assignments: Assignment[];
}

export function AssignmentList({ assignments }: AssignmentListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusColors: Record<AssignmentStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
  };

  const handleStatusAction = async (assignmentId: string, action: 'accept' | 'reject' | 'complete') => {
    try {
      setUpdatingId(assignmentId);
      setError(null);
      
      switch (action) {
        case 'accept':
          await acceptAssignment(assignmentId);
          break;
        case 'reject':
          await rejectAssignment(assignmentId);
          break;
        case 'complete':
          await completeAssignment(assignmentId);
          break;
      }
      
      // Optionally reload or update the UI
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
    } finally {
      setUpdatingId(null);
    }
  };

  if (assignments.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-admin-600">No assignments yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {assignments.map((assignment) => (
        <Card key={assignment.id} className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold text-admin-900">Assignment ID: {assignment.id}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[assignment.status]}`}>
                  {assignment.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-admin-600 mb-2">
                <strong>Responder:</strong> {assignment.responderId}
              </p>
              <p className="text-sm text-admin-600 mb-2">
                <strong>Department:</strong> {assignment.departmentName}
              </p>
              {assignment.notes && (
                <p className="text-sm text-admin-600">
                  <strong>Notes:</strong> {assignment.notes}
                </p>
              )}
            </div>
          </div>

          {assignment.status === 'pending' && (
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => handleStatusAction(assignment.id, 'accept')}
                disabled={updatingId === assignment.id}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => handleStatusAction(assignment.id, 'reject')}
                disabled={updatingId === assignment.id}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}

          {assignment.status === 'accepted' && (
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => handleStatusAction(assignment.id, 'complete')}
                disabled={updatingId === assignment.id}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Complete
              </button>
            </div>
          )}

          <div className="text-xs text-admin-500 mt-4 pt-2 border-t">
            Created: {new Date(assignment.createdAt).toLocaleString()} | Updated: {new Date(assignment.updatedAt).toLocaleString()}
          </div>
        </Card>
      ))}
    </div>
  );
}
