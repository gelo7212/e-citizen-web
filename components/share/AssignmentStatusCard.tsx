'use client';

import React, { useState } from 'react';
import { Assignment } from '@/types';
import { acceptAssignment, rejectAssignment, completeAssignment } from '@/lib/api/endpoints';
import { RejectReasonsModal } from './RejectReasonsModal';

interface AssignmentStatusCardProps {
  assignment: Assignment;
  incidentId: string;
  onStatusChanged: () => Promise<void>;
  authConfig?: { headers: { Authorization: string } };
}

export function AssignmentStatusCard({
  assignment,
  incidentId,
  onStatusChanged,
  authConfig,
}: AssignmentStatusCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
  };

  const handleAccept = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      await acceptAssignment(assignment.id, authConfig);
      await onStatusChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept assignment');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (notes: string) => {
    try {
      setIsUpdating(true);
      setError(null);
      await rejectAssignment(assignment.id, { notes }, authConfig);
      await onStatusChanged();
      setShowRejectModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject assignment');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleComplete = async () => {
    if (!completeNotes.trim()) {
      setError('Notes are required to complete assignment');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      await completeAssignment(assignment.id, { notes: completeNotes }, authConfig);
      await onStatusChanged();
      setShowCompleteForm(false);
      setCompleteNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete assignment');
    } finally {
      setIsUpdating(false);
    }
  };

  const isActionDisabled = isUpdating || assignment.status !== 'pending';

  return (
    <>
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-admin-900">Assignment Status</h3>
          <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${statusColors[assignment.status] || 'bg-gray-100 text-gray-800'}`}>
            {assignment.status.toUpperCase()}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-800 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-admin-500 uppercase">Assignment ID</p>
            <p className="text-sm font-mono">{assignment.id}</p>
          </div>
          <div>
            <p className="text-xs text-admin-500 uppercase">Department</p>
            <p className="text-sm">{assignment.departmentName || assignment.departmentCode}</p>
          </div>
          {assignment.responderId && (
            <div>
              <p className="text-xs text-admin-500 uppercase">Assigned To</p>
              <p className="text-sm">{assignment.responderId}</p>
            </div>
          )}
          {assignment.createdAt && (
            <div>
              <p className="text-xs text-admin-500 uppercase">Created</p>
              <p className="text-sm">{new Date(assignment.createdAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Display notes if assignment has been completed or has notes */}
        {(assignment?.notes || assignment.notes) && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-xs text-blue-600 uppercase font-semibold">Notes</p>
            <p className="text-sm text-blue-900 mt-1">{assignment?.notes || assignment.notes}</p>
          </div>
        )}

        {assignment.status === 'pending' && (
          <div className="space-y-4">
            <p className="text-sm text-admin-600">
              This assignment is pending. You can accept, reject, or mark it as completed.
            </p>

            {!showCompleteForm ? (
              <div className="flex gap-2">
                <button
                  onClick={handleAccept}
                  disabled={isActionDisabled}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Processing...' : 'Accept'}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isActionDisabled}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => setShowCompleteForm(true)}
                  disabled={isActionDisabled}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Processing...' : 'Complete'}
                </button>
              </div>
            ) : (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-admin-900 mb-2">
                  Completion Notes (Required)
                </label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="Add notes about the completion of this assignment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleComplete}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Completing...' : 'Confirm Complete'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCompleteForm(false);
                      setCompleteNotes('');
                    }}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {assignment.status === 'accepted' && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              This assignment has been accepted.
            </div>
            
            {!showCompleteForm ? (
              <button
                onClick={() => setShowCompleteForm(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Mark as Complete
              </button>
            ) : (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-admin-900 mb-2">
                  Completion Notes (Required)
                </label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="Add notes about the completion of this assignment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleComplete}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Completing...' : 'Confirm Complete'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCompleteForm(false);
                      setCompleteNotes('');
                    }}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {assignment.status === 'rejected' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            This assignment has been rejected.
          </div>
        )}

        {assignment.status === 'completed' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            This assignment has been completed.
          </div>
        )}
      </div>

      <RejectReasonsModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        isLoading={isUpdating}
      />
    </>
  );
}
