'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSetup } from '@/context/SetupContext';
import { RoleGuard } from '@/components/shared/RoleGuard';
import { Alert } from '@/components/shared/Alert';
import { Card } from '@/components/shared/Card';
import { Department } from '@/types';
import { DepartmentModal } from '@/components/admin/departments/DepartmentModal';
import {
  getDepartmentsByCity,
  deleteDepartment,
} from '@/lib/api/setupEndpoints';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const { cityCode, cityId, isLoading: contextLoading } = useSetup();
  
  // Fallback to user.cityCode if context cityCode is not set
  const effectiveCityCode = cityCode || user?.cityCode;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasFetched = useRef(false);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    if (!effectiveCityCode) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await getDepartmentsByCity(effectiveCityCode);

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch departments');
      }

      setDepartments(response.data || []);
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
    fetchDepartments();
  }, [contextLoading, fetchDepartments]);

  const handleOpenAddModal = () => {
    setSelectedDepartment(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setSelectedDepartment(dept);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDepartment(null);
  };

  const handleModalSuccess = async () => {
    await fetchDepartments();
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const response = await deleteDepartment(id);

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete department');
      }

      await fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  if (contextLoading) {
    return (
      <RoleGuard requiredRoles={['city_admin', 'super_admin']}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-admin-600">Loading...</p>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRoles={['city_admin', 'super_admin']}>
      <div className="admin-page p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-admin-900">Departments</h1>
            <p className="text-admin-600 mt-2">Manage emergency response departments for your city</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add Department
          </button>
        </div>

        {error && <Alert type="error" title="Error" message={error} />}

        {/* Department Modal */}
        <DepartmentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          department={selectedDepartment}
          cityCode={cityCode || ''}
          cityId={cityId || ''}
        />

        {/* Departments List */}
        <Card>
          {isLoading ? (
            <div className="p-6 text-center text-admin-600">Loading departments...</div>
          ) : departments.length === 0 ? (
            <div className="p-6 text-center text-admin-600">
              No departments found. Click "Add Department" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-admin-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-admin-900 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-admin-900 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-admin-900 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-admin-900 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-admin-900 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-100">
                  {departments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-admin-50">
                      <td className="px-6 py-4 text-sm font-medium text-admin-900">{dept.code}</td>
                      <td className="px-6 py-4 text-sm text-admin-700">{dept.name}</td>
                      <td className="px-6 py-4 text-sm text-admin-700">{dept.contactNumber}</td>
                      <td className="px-6 py-4 text-sm text-admin-700">{dept.address}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(dept)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept._id || '')}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-800 font-medium disabled:text-admin-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </RoleGuard>
  );
}
