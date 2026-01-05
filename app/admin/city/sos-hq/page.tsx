'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSetup } from '@/context/SetupContext';
import { RoleGuard } from '@/components/shared/RoleGuard';
import { Alert } from '@/components/shared/Alert';
import { Card } from '@/components/shared/Card';
import { SOSHQData } from '@/types';
import { getSOSHQByCity, updateSOSHQ, deleteSOSHQ } from '@/lib/api/setupEndpoints';
import { SOSHQModal } from '@/components/admin/sos/SOSHQModal';

export default function SOSHQPage() {
  const { user } = useAuth();
  const { cityCode, cityId, isLoading: contextLoading, departments } = useSetup();
  
  // Fallback to user.cityCode if context cityCode is not set
  const effectiveCityCode = cityCode || user?.cityCode;
  const [sosHQs, setSOSHQs] = useState<SOSHQData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSOSHQ, setSelectedSOSHQ] = useState<SOSHQData | null>(null);
  const hasFetched = useRef(false);

  // Fetch SOS HQs
  const fetchSOSHQs = useCallback(async () => {
    if (!effectiveCityCode) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await getSOSHQByCity(effectiveCityCode);

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch SOS HQs');
      }

      setSOSHQs(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCityCode]);

  useEffect(() => {
    // Skip if already fetched or still loading context
    if (hasFetched.current || contextLoading) return;
    hasFetched.current = true;
    fetchSOSHQs();
  }, [contextLoading, fetchSOSHQs]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setError(null);

      const response = await updateSOSHQ(id, {
        isActive: !currentStatus,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update status');
      }

      await fetchSOSHQs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSetMain = async (id: string) => {
    try {
      setError(null);

      const response = await updateSOSHQ(id, {
        isMain: true,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to set main HQ');
      }

      await fetchSOSHQs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SOS HQ?')) {
      return;
    }

    try {
      setError(null);

      const response = await deleteSOSHQ(id);

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete SOS HQ');
      }

      await fetchSOSHQs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleOpenAddModal = () => {
    setSelectedSOSHQ(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sosHQ: SOSHQData) => {
    setSelectedSOSHQ(sosHQ);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSOSHQ(null);
  };

  const handleModalSuccess = () => {
    fetchSOSHQs();
  };

  if (contextLoading) {
    return (
      <RoleGuard requiredRoles={['city_admin', 'super_admin']}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRoles={['city_admin', 'super_admin']}>
      <div className="space-y-6 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SOS Headquarters</h1>
            <p className="text-gray-600 mt-1">Manage SOS response centers and headquarters locations for your city</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add New SOS HQ
          </button>
        </div>

        {error && <Alert type="error" title="Error" message={error} />}

        {/* SOS HQs Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-gray-500">Loading SOS HQs...</p>
          </div>
        ) : sosHQs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">No SOS HQs found. Add locations during city setup.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sosHQs.map((hq) => (
              <Card key={hq._id} className="p-6 space-y-4">
                {/* Header with Status Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">{hq.name}</h2>
                  </div>
                  <div className="text-right space-y-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        hq.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {hq.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {hq.isMain && (
                      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full ml-2">
                        Main HQ
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="border-t pt-4 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Latitude</p>
                      <p className="font-mono text-gray-900">{hq.location?.lat?.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Longitude</p>
                      <p className="font-mono text-gray-900">{hq.location?.lng?.toFixed(6)}</p>
                    </div>
                  </div>

                  {hq.coverageRadiusKm && (
                    <div>
                      <p className="text-gray-600">Coverage Radius</p>
                      <p className="text-gray-900">{hq.coverageRadiusKm} km</p>
                    </div>
                  )}

                  {hq.supportedDepartmentCodes && hq.supportedDepartmentCodes.length > 0 && (
                    <div>
                      <p className="text-gray-600 mb-2">Supported Departments</p>
                      <div className="flex flex-wrap gap-1">
                        {hq.supportedDepartmentCodes.map((code: string) => (
                          <span
                            key={code}
                            className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t pt-4 flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(hq)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(hq._id || '', hq.isActive || false)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    {hq.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  {!hq.isMain && (
                    <button
                      onClick={() => handleSetMain(hq._id || '')}
                      className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                    >
                      Set as Main
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(hq._id || '')}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SOS HQ Modal */}
      <SOSHQModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        sosHQ={selectedSOSHQ}
        cityCode={cityCode || ''}
        cityId={cityId || ''}
        departments={departments.map((dept) => dept.code)}
      />
    </RoleGuard>
  );
}
