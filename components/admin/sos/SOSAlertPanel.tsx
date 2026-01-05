'use client';

import React from 'react';
import { NearbySOS } from '@/lib/services/sosService';
import { Card } from '@/components/shared/Card';
import { AlertIcon, CheckIcon, DotIcon } from './SOSIcons';

interface SOSAlertPanelProps {
  sosRequests: NearbySOS[];
  onSelectSOS: (sos: NearbySOS) => void;
}

export default function SOSAlertPanel({ sosRequests, onSelectSOS }: SOSAlertPanelProps) {
  // Get most urgent SOS
  const activeSOS = sosRequests.filter((sos) => sos.status === 'active');
  const mostUrgent = activeSOS.length > 0 ? activeSOS[0] : null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500' };
      case 'inactive':
        return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-500' };
      case 'resolved':
        return { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-500' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-500' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      {mostUrgent && (
        <Card className={`border-2 ${getStatusColor(mostUrgent.status).border} bg-gradient-to-br from-red-50 to-red-100`}>
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 mt-1">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(mostUrgent.status).badge} animate-pulse`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Critical Alert</p>
              <h3 className="font-bold text-gray-900 mt-1 truncate">
                {mostUrgent.address?.barangay || 'Unknown'}, {mostUrgent.address?.city || 'Unknown'}
              </h3>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>Distance:</span>
              <span className="font-mono font-semibold text-gray-900">{mostUrgent.distance?.toFixed(2)}m</span>
            </div>
            <div className="flex justify-between">
              <span>Accuracy:</span>
              <span className="font-mono font-semibold text-gray-900">±{mostUrgent.location?.accuracy}m</span>
            </div>
          </div>

          <button
            onClick={() => onSelectSOS(mostUrgent)}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            <AlertIcon className="w-4 h-4" />
            View Details
          </button>
        </Card>
      )}

      {/* Active Alerts */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wider">Active Alerts ({activeSOS.length})</h3>
        {activeSOS.length === 0 ? (
          <Card className="bg-green-50 border-green-200 text-center py-4">
            <div className="flex items-center justify-center gap-2">
              <CheckIcon className="w-5 h-5 text-green-600" />
              <p className="text-green-700 text-sm font-medium">No active alerts</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activeSOS.slice(0, 5).map((sos) => (
              <button
                key={sos.sosId}
                onClick={() => onSelectSOS(sos)}
                className="w-full text-left p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <DotIcon className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sos.address?.barangay || 'Unknown Barangay'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{sos.distance?.toFixed(0)}m away</p>
                  </div>
                </div>
              </button>
            ))}
            {activeSOS.length > 5 && (
              <p className="text-xs text-gray-500 text-center py-2">+{activeSOS.length - 5} more</p>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <Card className="border-gray-200">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Statistics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Alerts:</span>
              <span className="font-semibold text-gray-900">{sosRequests.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Distance:</span>
              <span className="font-semibold text-gray-900">
                {sosRequests.length > 0
                  ? (sosRequests.reduce((sum, sos) => sum + (sos.distance || 0), 0) / sosRequests.length).toFixed(0)
                  : 0}
                m
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
