'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/shared/Card';
import { Alert } from '@/components/shared/Alert';
import { getAssignedSos } from '@/lib/api/endpoints';
import { useRequireAuth } from '@/hooks/useAuth';
import { getAuthToken } from '@/lib/auth/store';
import type { SosAssignment } from '@/types';

export default function RescuerDashboard() {
  const auth = useRequireAuth();
  const router = useRouter();
  const token = getAuthToken();

  const [assignment, setAssignment] = useState<SosAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Load assigned SOS
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const loadAssignedSos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAssignedSos();
        
        // Handle new assignment API response format
        if (response.success && response.data) {
          setAssignment(response.data);
          // Check if already a participant
          await checkParticipationStatus(response.data.sosId);
        } else if (response.data) {
          // In case it returns data directly
          setAssignment(response.data);
          // Check if already a participant
          await checkParticipationStatus(response.data.sosId);
        } else {
          setError('No active assignment');
        }
      } catch (err) {
        console.error('Error loading assignment:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assignment');
      } finally {
        setIsLoading(false);
      }
    };

    const checkParticipationStatus = async (sosId: string) => {
      if (!token || !auth.user?.id) return;

      try {
        const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
        const response = await fetch(
          `${bffUrl}/api/sos/${sosId}/participants/${auth.user.id}/check`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const isActive = data.data?.isActive === true || data.isActive === true;
          if (isActive) {
            // Already a participant, navigate directly to incident
            router.push(`/rescuer/incident/${sosId}`);
          }
        }
      } catch (err) {
        console.error('Error checking participation:', err);
      }
    };

    loadAssignedSos();
    // Refresh every 5 seconds to check for new assignments
    const interval = setInterval(loadAssignedSos, 5000);
    return () => clearInterval(interval);
  }, [auth.isAuthenticated, auth.user?.id, token, router]);

  // Handle accept assignment - join then navigate
  const handleAcceptAssignment = async () => {
    if (!assignment || !token) return;

    setIsAccepting(true);
    setAcceptError(null);

    try {
      const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
      const response = await fetch(`${bffUrl}/api/sos/${assignment.sosId}/participants/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userType: 'rescuer' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to join incident');
      }

      // Navigate only after successful join
      router.push(`/rescuer/incident/${assignment.sosId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join incident';
      setAcceptError(message);
      console.error('Error joining incident:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    setAssignment(null);
    setError('Assignment declined');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_ROUTE':
        return 'bg-blue-100 text-blue-800';
      case 'ARRIVED':
        return 'bg-green-100 text-green-800';
      case 'ASSISTING':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Assigned SOS</h1>

      {isLoading ? (
        <Card>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading your assignment...</p>
            </div>
          </div>
        </Card>
      ) : error && !assignment ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No active SOS assignment</p>
            <p className="text-gray-400 text-sm mt-2">Waiting for an SOS incident to be assigned to you...</p>
          </div>
        </Card>
      ) : assignment ? (
        <div className="space-y-6">
          {acceptError && (
            <Alert type="error" message={acceptError} />
          )}

          <Card>
            <div className="space-y-6">
              {/* SOS ID and Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    SOS #{assignment.sosId.slice(-8).toUpperCase()}
                  </h2>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Target Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Latitude</p>
                    <p className="text-gray-900 font-semibold">{assignment.target.lat.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Longitude</p>
                    <p className="text-gray-900 font-semibold">{assignment.target.lng.toFixed(6)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={handleAcceptAssignment}
                  disabled={isAccepting}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAccepting ? 'Accepting...' : '✓ Accept Assignment'}
                </button>
                {/* <button
                  onClick={handleDecline}
                  disabled={isAccepting}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Decline
                </button> */}
              </div>

              <p className="text-sm text-gray-500 text-center">
                Once you accept, the map will load showing all incident participants
              </p>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
