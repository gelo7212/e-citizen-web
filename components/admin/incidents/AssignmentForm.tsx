    'use client';

import React, { useState } from 'react';
import { createAssignment } from '@/lib/api/endpoints';
import { Card } from '@/components/shared/Card';

interface AssignmentFormProps {
  incidentId: string;
  cityCode: string;
  onSuccess: () => void;
}

export function AssignmentForm({ incidentId, cityCode, onSuccess }: AssignmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    departmentCode: '',
    responderId: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const response = await createAssignment({
        incidentId,
        cityCode,
        departmentCode: formData.departmentCode,
        responderId: formData.responderId,
        notes: formData.notes,
      });

      if (response.data) {
        onSuccess();
      } else {
        setError(response.error?.message || 'Failed to create assignment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-admin-900 mb-4">Create New Assignment</h3>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-800 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-admin-900 mb-1">
            Department Code
          </label>
          <input
            type="text"
            name="departmentCode"
            value={formData.departmentCode}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="e.g., FIRE_DEPT"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-admin-900 mb-1">
            Responder ID
          </label>
          <input
            type="text"
            name="responderId"
            value={formData.responderId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="e.g., user-123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-admin-900 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows={3}
            placeholder="Additional notes for responder..."
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </Card>
  );
}
