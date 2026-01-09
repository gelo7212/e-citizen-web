'use client';

import React, { useState, useEffect } from 'react';
import { useSOS } from '@/hooks/useSOS';
import { Rescuer } from '@/lib/services/sosService';

interface AssignRescuerModalProps {
  sosId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Assign Rescuer Modal
 * Modal for assigning a rescuer/dispatcher to an SOS request
 */
export function AssignRescuerModal({
  sosId,
  isOpen,
  onClose,
  onSuccess,
}: AssignRescuerModalProps) {
  const { rescuers, isLoading, error, fetchRescuers, assignRescuer } = useSOS();
  const [selectedRescuerId, setSelectedRescuerId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Fetch rescuers when modal opens
  useEffect(() => {
    if (isOpen && rescuers.length === 0) {
      fetchRescuers();
    }
  }, [isOpen, rescuers.length, fetchRescuers]);

  const handleAssign = async () => {
    if (!selectedRescuerId) {
      setAssignError('Please select a rescuer');
      return;
    }

    setIsAssigning(true);
    setAssignError(null);
    setAssignSuccess(false);

    try {
      const success = await assignRescuer(sosId, selectedRescuerId);
      if (success) {
        setAssignSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 1500);
      } else {
        setAssignError('Failed to assign rescuer. Please try again.');
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedRescuerId('');
    setAssignError(null);
    setAssignSuccess(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const selectedRescuer = rescuers.find((r) => r.id === selectedRescuerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Assign Rescuer</h2>
          <p className="text-sm text-gray-600 mt-1">
            Assign a rescuer to SOS request: <span className="font-mono font-semibold">{sosId}</span>
          </p>
        </div>

        {/* Success Message */}
        {assignSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium text-center">✓ Rescuer assigned successfully!</p>
          </div>
        )}

        {/* Error Messages */}
        {(assignError || error) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{assignError || error}</p>
          </div>
        )}

        {/* Rescuer Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Select Rescuer <span className="text-red-500">*</span>
          </label>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading rescuers...</p>
            </div>
          ) : rescuers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No rescuers available</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
              {rescuers.map((rescuer) => (
                <label
                  key={rescuer.id}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rescuer"
                    value={rescuer.id}
                    checked={selectedRescuerId === rescuer.id}
                    onChange={(e) => {
                      setSelectedRescuerId(e.target.value);
                      setAssignError(null);
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900">{rescuer.displayName}</p>
                    <p className="text-xs text-gray-500">{rescuer.phone}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Selected Rescuer Details */}
        {selectedRescuer && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Selected Rescuer</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <span className="font-medium">Name:</span> {selectedRescuer.displayName}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {selectedRescuer.phone}
              </p>
              {selectedRescuer.department && (
                <p>
                  <span className="font-medium">Department:</span> {selectedRescuer.department}
                </p>
              )}
              <p>
                <span className="font-medium">Status:</span> {selectedRescuer.registrationStatus}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isAssigning}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-900 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={isAssigning || !selectedRescuerId || assignSuccess}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {isAssigning ? 'Assigning...' : assignSuccess ? 'Assigned!' : 'Assign Rescuer'}
          </button>
        </div>
      </div>
    </div>
  );
}
