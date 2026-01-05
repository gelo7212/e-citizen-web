'use client';

import { useState, useEffect } from 'react';
import { useSOS } from '@/hooks/useSOS';
import { Card } from '@/components/shared/Card';
import SOSMessageThread from '@/components/admin/sos/SOSMessageThread';

interface SOSDetailProps {
  sosId: string;
  onClose?: () => void;
}

/**
 * SOS Detail Component
 * Shows complete SOS request details, status, and messaging interface
 */
export function SOSDetail({ sosId, onClose }: SOSDetailProps) {
  const { sosRequest, fetchSOSRequest, updateTag, closeSOS, isLoading, error } = useSOS();
  const [isUpdating, setIsUpdating] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showTagForm, setShowTagForm] = useState(false);

  useEffect(() => {
    fetchSOSRequest(sosId);
  }, [sosId]);

  useEffect(() => {
    if (sosRequest?.tag) {
      setTagInput(sosRequest.tag);
    }
  }, [sosRequest?.tag]);

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;

    setIsUpdating(true);
    try {
      const success = await updateTag(sosId, tagInput);
      if (success) {
        setShowTagForm(false);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseSOS = async () => {
    if (!confirm('Are you sure you want to close this SOS request?')) {
      return;
    }

    setIsUpdating(true);
    try {
      const success = await closeSOS(sosId);
      if (success) {
        alert('SOS request closed successfully');
        onClose?.();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'PENDING':
        return 'bg-red-100 text-red-800';
      case 'ASSIGNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && !sosRequest) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Loading SOS request...</p>
        </div>
      </Card>
    );
  }

  if (!sosRequest) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <p className="text-red-600">Failed to load SOS request</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">SOS Request #{sosRequest.id}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Created: {new Date(sosRequest.createdAt).toLocaleString()}
            </p>
          </div>
          <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(sosRequest.status)}`}>
            {sosRequest.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              <p>
                <span className="text-gray-600">Latitude:</span>
                <span className="ml-2 font-mono text-gray-900">{sosRequest.location.latitude}</span>
              </p>
              <p>
                <span className="text-gray-600">Longitude:</span>
                <span className="ml-2 font-mono text-gray-900">{sosRequest.location.longitude}</span>
              </p>
              <a
                href={`https://maps.google.com/?q=${sosRequest.location.latitude},${sosRequest.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-600 hover:text-blue-800 font-medium text-sm mt-2"
              >
                View on Google Maps →
              </a>
            </div>
          </div>

          {/* User Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">User Information</h3>
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              <p>
                <span className="text-gray-600">User ID:</span>
                <span className="ml-2 font-mono text-gray-900">{sosRequest.userId}</span>
              </p>
              <p>
                <span className="text-gray-600">Last Updated:</span>
                <span className="ml-2 text-gray-900">{new Date(sosRequest.updatedAt).toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tag Section */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Tag/Label</h3>
            <button
              onClick={() => setShowTagForm(!showTagForm)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showTagForm ? 'Cancel' : 'Edit Tag'}
            </button>
          </div>

          {showTagForm ? (
            <form onSubmit={handleUpdateTag} className="space-y-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g., High Priority, Follow-up Required"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  {isUpdating ? 'Updating...' : 'Save Tag'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              {sosRequest.tag ? (
                <p className="text-gray-900">{sosRequest.tag}</p>
              ) : (
                <p className="text-gray-500 italic">No tag assigned</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Messages */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Conversation</h3>
        <SOSMessageThread sosId={sosId} />
      </div>

      {/* Actions */}
      {sosRequest.status?.toUpperCase() !== 'CLOSED' && (
        <Card>
          <div className="flex gap-2">
            <button
              onClick={handleCloseSOS}
              disabled={isUpdating}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {isUpdating ? 'Closing...' : 'Close SOS Request'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 px-4 rounded-lg transition"
              >
                Back
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}
    </div>
  );
}
