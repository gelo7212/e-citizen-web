'use client';

import React, { useState, useEffect } from 'react';
import { Incident, Assignment } from '@/types';
import { updateIncidentStatus, createAssignment } from '@/lib/api/endpoints';
import { getDepartmentsByCity } from '@/lib/api/setupEndpoints';
import { Card } from '@/components/shared/Card';

interface IncidentUpdatePanelProps {
  incident: Incident;
  cityCode: string;
  onStatusUpdated: (incident: Incident) => void;
  onAssignmentCreated: () => void;
}

interface UpdateFormData {
  newStatus: string;
  departmentCode: string;
  departmentName: string;
  responderId: string;
  reason: string;
}

export function IncidentUpdatePanel({
  incident,
  cityCode,
  onStatusUpdated,
  onAssignmentCreated,
}: IncidentUpdatePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [formData, setFormData] = useState<UpdateFormData>({
    newStatus: incident.status,
    departmentCode: '',
    departmentName: '',
    responderId: '',
    reason: '',
  });

  // Load departments when component mounts
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepts(true);
        const response = await getDepartmentsByCity(cityCode);
        if (response.data) {
          setDepartments(Array.isArray(response.data) ? response.data : response.data || []);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoadingDepts(false);
      }
    };

    loadDepartments();
  }, [cityCode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDept = departments.find((d: any) => (d.id || d._id) === e.target.value);
    setFormData((prev) => ({
      ...prev,
      departmentCode: e.target.value,
      departmentName: selectedDept?.name || '',
    }));
  };

  // Check if any changes are made
  const hasStatusChange = formData.newStatus !== incident.status;
  const hasDepartmentAssignment = formData.departmentCode.trim() !== '';
  const hasChanges = hasStatusChange || hasDepartmentAssignment;

  // Reason is required if any change is made
  const isReasonRequired = hasChanges;
  const isReasonValid = !isReasonRequired || formData.reason.trim() !== '';

  // Submit button should be disabled if no changes or reason is missing
  const isSubmitDisabled = !hasChanges || !isReasonValid || loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      setError('Please make at least one change (status or department assignment)');
      return;
    }

    if (isReasonRequired && !isReasonValid) {
      setError('Reason is required when making changes');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Update status if it changed
      if (hasStatusChange) {
        const statusResponse = await updateIncidentStatus(incident.id, {
          status: formData.newStatus as any,
          reason: formData.reason,
        });

        if (!statusResponse.data) {
          setError(statusResponse.error?.message || 'Failed to update status');
          return;
        }

        onStatusUpdated(statusResponse.data);
      }

      // Step 2: Create assignment if department is selected
      if (hasDepartmentAssignment) {
        // Validate that both departmentCode and departmentName are present
        if (!formData.departmentCode.trim()) {
          setError('Department code is required');
          return;
        }

        if (!formData.departmentName.trim()) {
          setError('Department name is required. Please select a department from the list.');
          return;
        }

        // Note: responderId can be optional - letting backend handle validation
        const assignmentResponse = await createAssignment({
          incidentId: incident.id,
          cityCode,
          departmentCode: formData.departmentCode,
          departmentName: formData.departmentName,
          responderId: formData.responderId || '',
        });

        if (!assignmentResponse.data) {
          setError(assignmentResponse.error?.message || 'Failed to create assignment');
          return;
        }

        onAssignmentCreated();
      }

      // Reset form after successful submission
      setFormData({
        newStatus: incident.status,
        departmentCode: '',
        departmentName: '',
        responderId: '',
        reason: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-admin-900 mb-4">Update Incident</h3>

      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-800 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Status Section */}
        <div className="border-b pb-4">
          <h4 className="text-sm font-semibold text-admin-800 mb-3">Status Update (Optional)</h4>

          <div>
            <label className="block text-sm font-medium text-admin-900 mb-2">
              Change Status
            </label>
            <select
              name="newStatus"
              value={formData.newStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="open">Open</option>
              <option value="for_review">For Review</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            {hasStatusChange && (
              <p className="text-xs text-blue-600 mt-1">
                ✓ Status will be changed from <strong>{incident.status}</strong> to{' '}
                <strong>{formData.newStatus}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Department Assignment Section */}
        <div className="border-b pb-4">
          <h4 className="text-sm font-semibold text-admin-800 mb-3">Department Assignment (Optional)</h4>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-admin-900 mb-2">
                Select Department
              </label>
              <select
                name="departmentCode"
                value={formData.departmentCode}
                onChange={handleDepartmentChange}
                disabled={loadingDepts}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept: any) => (
                  <option key={dept.id || dept._id} value={dept.id || dept._id}>
                    {dept.name || dept.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-900 mb-2">
                Responder ID (Optional)
              </label>
              <input
                type="text"
                name="responderId"
                value={formData.responderId}
                onChange={handleChange}
                placeholder="e.g., responder-123"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {hasDepartmentAssignment && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs font-medium text-blue-800">
                ✓ Assignment will be created for <strong>{departments.find((d: any) => (d.id || d._id) === formData.departmentCode)?.name || formData.departmentCode}</strong>
                {formData.responderId && (
                  <>
                    {' '}
                    assigned to responder <strong>{formData.responderId}</strong>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Reason Section */}
        <div>
          <h4 className="text-sm font-semibold text-admin-800 mb-3">
            Update Reason {isReasonRequired && <span className="text-red-600">*</span>}
          </h4>

          <label className="block text-sm font-medium text-admin-900 mb-2">
            {isReasonRequired ? 'Reason (Required)' : 'Reason (Optional)'}
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder={isReasonRequired ? 'Required - Please explain the reason for this update' : 'Optional - Explain any additional context...'}
            rows={3}
            required={isReasonRequired}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
              isReasonRequired && !isReasonValid
                ? 'border-red-400 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {isReasonRequired && !isReasonValid && (
            <p className="text-xs text-red-600 mt-1">Reason is required when making changes</p>
          )}
        </div>

        {/* Summary */}
        {hasChanges && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-xs font-medium text-green-800">
              {hasStatusChange && hasDepartmentAssignment
                ? '✓ Status will be updated and assignment will be created'
                : hasStatusChange
                ? '✓ Status will be updated'
                : '✓ Assignment will be created'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`px-6 py-2 rounded font-medium text-white transition ${
              isSubmitDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {loading ? 'Updating...' : 'Update Incident'}
          </button>
          <p className="text-xs text-gray-600 self-center">
            {!hasChanges && 'Select status or department to enable updates'}
          </p>
        </div>
      </form>
    </Card>
  );
}
