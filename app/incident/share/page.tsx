'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getTokenInfo } from '@/lib/utils/shareTokenUtils';
import { Card } from '@/components/shared/Card';
import { SharedIncidentView } from '@/components/share/SharedIncidentView';
import { DepartmentIncidentsView } from '@/components/share/DepartmentIncidentsView';

export default function SharePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validToken, setValidToken] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          setError('No access token provided');
          return;
        }

        // First decode and check client-side
        const decoded = getTokenInfo(token);
        if (!decoded) {
          setError('Invalid token format');
          return;
        }

        if (decoded.isExpired) {
          setError('Access link has expired');
          return;
        }

        if (!decoded.isValid) {
          setError('Invalid access token');
          return;
        }

        // Token is valid, set it directly
        setValidToken(true);
        setTokenData(decoded);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to validate token');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold text-admin-900">Loading shared incident...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-md mx-auto">
          <Card className="p-8 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-2v2m0-2v2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-admin-900 mb-2">Access Denied</h2>
            <p className="text-admin-600 mb-4">{error}</p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Home
            </a>
          </Card>
        </div>
      </div>
    );
  }

  if (!validToken || !tokenData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-md mx-auto">
          <Card className="p-8 text-center">
            <p className="text-admin-600">Unable to access shared incident</p>
          </Card>
        </div>
      </div>
    );
  }

  // If department-level access, show all incidents for the department
  if (tokenData.isDepartmentLevel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-admin-900 mb-2">Department Incidents</h1>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Department Access:</strong> You have access to view and manage all incidents assigned to your department.
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Expires at: {tokenData.expiresAt?.toLocaleString()}
                </p>
                {tokenData.assignmentId && (
                  <p className="text-xs text-blue-700 mt-1">
                    You can also manage individual assignments for all department incidents.
                  </p>
                )}
              </div>
            </div>

            <DepartmentIncidentsView
              cityCode={tokenData.cityCode!}
              departmentCode={tokenData.departmentId!}
              token={token!}
              preselectedIncidentId={tokenData.incidentId}
            />
          </div>
        </div>
      </div>
    );
  }

  // Single incident access
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-admin-900 mb-2">Shared Incident Assignment</h1>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Assignment Access:</strong> You have been granted access to this incident assignment by your department.
                You can view the details and update the assignment status with a reason.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Expires at: {tokenData.expiresAt?.toLocaleString()}
              </p>
            </div>
          </div>

          <SharedIncidentView
            incidentId={tokenData.incidentId!}
            assignmentId={tokenData.assignmentId}
            departmentId={tokenData.departmentId}
            cityCode={tokenData.cityCode!}
            token={token!}
            isShared={true}
          />
        </div>
      </div>
    </div>
  );
}
