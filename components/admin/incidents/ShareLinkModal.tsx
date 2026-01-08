'use client';

import React, { useState } from 'react';
import { Assignment } from '@/types';
import { createShareLink } from '@/lib/api/shareLinkEndpoints';
import { Card } from '@/components/shared/Card';

interface ShareLinkModalProps {
  incidentId: string;
  cityCode: string;
  assignments: Assignment[];
  onClose: () => void;
}

export function ShareLinkModal({
  incidentId,
  cityCode,
  assignments,
  onClose,
}: ShareLinkModalProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = selectedAssignment ? assignments.find((a) => a.id === selectedAssignment) : null;

  const handleCreateLink = async () => {
    if (!selected) {
      setError('Please select an assignment');
      return;
    }

    // Use departmentCode which is always populated
    const departmentCode = selected.departmentCode;
    if (!departmentCode) {
      setError('Department code is missing from this assignment.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await createShareLink({
        cityId: cityCode,
        departmentId: departmentCode,
        incidentId,
        scope: 'DEPT_ACTIVE',
        assignmentId: selected.id,
      });

      if (response.data) {
        // Generate full shareable URL with new path
        const shareUrl = `${window.location.origin}/incident/share?token=${response.data.jwt}`;
        setShareLink(shareUrl);
      } else {
        setError(response.error?.message || 'Failed to create share link');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (assignments.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg p-6">
          <h3 className="text-lg font-semibold text-admin-900 mb-4">Share Incident Report</h3>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              No assignments yet. Please create an assignment first before sharing this incident.
            </p>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-admin-900 rounded hover:bg-gray-300 font-medium"
            >
              Close
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-admin-900 mb-4">Share Incident Report</h3>

        {error && (
          <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-800 rounded">
            {error}
          </div>
        )}

        {!shareLink ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-admin-900 mb-2">
                Select Assignment to Share
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded p-3">
                {assignments.length === 0 ? (
                  <p className="text-sm text-admin-600">No assignments available</p>
                ) : (
                  assignments.map((assignment) => (
                    <label
                      key={assignment.id}
                      className="flex items-start p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="assignment"
                        value={assignment.id}
                        checked={selectedAssignment === assignment.id}
                        onChange={(e) => setSelectedAssignment(e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-admin-900">{assignment.departmentName || assignment.departmentCode}</p>
                        <p className="text-xs text-admin-600">
                          Status: <span className="capitalize">{assignment.status}</span>
                        </p>
                        {assignment.responderId && (
                          <p className="text-xs text-admin-600">
                            Responder: {assignment.responderId}
                          </p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {selected && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs font-medium text-blue-800">
                  ✓ Share access for <strong>{selected.departmentName || selected.departmentCode}</strong>
                </p>
              </div>
            )}

            <div className="pt-4 border-t flex gap-2">
              <button
                onClick={handleCreateLink}
                disabled={loading || !selected}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Creating...' : 'Create Share Link'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-800">
                ✓ Share link created successfully
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-900 mb-2">
                Share this link:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded font-medium transition ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-admin-900 hover:bg-gray-300'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Recipients can view the incident and update its status with a reason.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
