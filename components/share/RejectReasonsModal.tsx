'use client';

import React, { useState } from 'react';

interface RejectReasonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  isLoading?: boolean;
}

const QUICK_REASONS = [
  'Not Applicable',
  'Must Assign to Proper Department',
  'Duplicate Report',
  'Cannot Be Resolved',
  'Requires More Information',
  'Already Resolved',
];

export function RejectReasonsModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: RejectReasonsModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [customNotes, setCustomNotes] = useState('');

  const toggleReason = (reason: string) => {
    const newReasons = new Set(selectedReasons);
    if (newReasons.has(reason)) {
      newReasons.delete(reason);
    } else {
      newReasons.add(reason);
    }
    setSelectedReasons(newReasons);
  };

  const handleConfirm = async () => {
    const notes = [
      Array.from(selectedReasons),
      customNotes.trim(),
    ]
      .filter(Boolean)
      .join(' | ');

    if (!notes.trim()) {
      alert('Please select a reason or add custom notes');
      return;
    }

    await onConfirm(notes);
    handleClose();
  };

  const handleClose = () => {
    setSelectedReasons(new Set());
    setCustomNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-admin-900 mb-4">Rejection Reason</h2>
        
        <div className="mb-6">
          <p className="text-sm text-admin-600 mb-3">Select one or more reasons:</p>
          <div className="space-y-2">
            {QUICK_REASONS.map((reason) => (
              <label key={reason} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedReasons.has(reason)}
                  onChange={() => toggleReason(reason)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <span className="ml-3 text-sm text-admin-700">{reason}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-admin-900 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="Add any additional information..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
