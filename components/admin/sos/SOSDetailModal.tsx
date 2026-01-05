'use client';

import React, { useEffect, useState } from 'react';
import { useSOS } from '@/hooks/useSOS';
import { NearbySOS } from '@/lib/services/sosService';
import { AlertIcon, LocationIcon, CheckIcon } from './SOSIcons';

interface SOSDetailModalProps {
  sos: NearbySOS;
  onClose: () => void;
  onOpenChat?: () => void;
}

export default function SOSDetailModal({ sos, onClose, onOpenChat }: SOSDetailModalProps) {
  const { fetchSOSRequest, sosRequest, isLoading } = useSOS();
  const [activeTab, setActiveTab] = useState<'info' | 'location'>('info');

  useEffect(() => {
    fetchSOSRequest(sos.sosId);
  }, [sos.sosId, fetchSOSRequest]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-500' };
      case 'inactive':
        return { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'bg-gray-500' };
      case 'resolved':
        return { bg: 'bg-green-100', text: 'text-green-800', badge: 'bg-green-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'bg-gray-500' };
    }
  };

  const statusColor = getStatusColor(sos.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white w-full md:max-w-3xl md:rounded-xl rounded-t-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`${statusColor.bg} border-b border-gray-200 px-6 py-5 flex items-center justify-between sticky top-0`}>
          <div className="flex items-center gap-3 flex-1">
            <AlertIcon className="w-6 h-6 text-gray-900 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">SOS Request Details</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                  {sos.status.toUpperCase()}
                </span>
                <p className="text-xs text-gray-600">{sos.address?.barangay}, {sos.address?.city}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-light text-3xl leading-none transition-colors flex-shrink-0"
          >
            ×
          </button>
        </div>

        {isLoading && !sosRequest ? (
          <div className="p-6 text-center flex-1 flex items-center justify-center">
            <p className="text-gray-500">Loading details...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex gap-2 px-6 pt-6 border-b border-gray-200">
              {(['info', 'location'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'info' && 'ℹ️ Info'}
                  {tab === 'location' && '📍 Location'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'info' && (
                <div className="space-y-4 max-h-full overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">SOS ID</p>
                      <p className="text-sm text-gray-900 font-mono mt-1">{sos.sosId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text} mt-1`}>
                        {sos.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Citizen ID</p>
                      <p className="text-sm text-gray-900 font-mono mt-1">{sos.citizenId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
                      <p className="text-sm text-gray-900 mt-1">{sos.address?.barangay}, {sos.address?.city}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Distance</p>
                      <p className="text-sm text-gray-900 font-mono mt-1">
                        {(() => {
                          const distanceKm = ((sos as any).distanceKm || sos.distance! / 1000);
                          return distanceKm < 1
                            ? `${(distanceKm * 1000).toFixed(0)}m`
                            : `${distanceKm.toFixed(2)}km`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Accuracy</p>
                      <p className="text-sm text-gray-900 font-mono mt-1">±{sos.location?.accuracy}m</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Created</p>
                    <p className="text-sm text-gray-900 mt-1">{new Date(sos.createdAt).toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Last Update</p>
                    <p className="text-sm text-gray-900 mt-1">{new Date(sos.lastLocationUpdate).toLocaleString()}</p>
                  </div>

                  {sosRequest && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Tag/Notes</p>
                      <div className="bg-gray-50 p-3 rounded-lg mt-1 text-sm text-gray-900 border border-gray-200">
                        {sosRequest.tag || <span className="text-gray-500 italic">No tag assigned</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'location' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Coordinates</p>
                    <div className="space-y-2 text-sm font-mono text-gray-900">
                      <p>📍 Latitude: <span className="text-blue-600">{sos.location?.latitude}</span></p>
                      <p>📍 Longitude: <span className="text-blue-600">{sos.location?.longitude}</span></p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Open on Map</p>
                    <a
                      href={`https://maps.google.com/?q=${sos.location?.latitude},${sos.location?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <LocationIcon className="w-4 h-4" />
                      View on Google Maps
                    </a>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Device Info</p>
                    <p className="text-sm text-gray-900">Device ID: <span className="font-mono text-blue-600">{sos.location?.deviceId}</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
              {onOpenChat && (
                <button
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                  onClick={() => {
                    onOpenChat();
                    onClose();
                  }}
                >
                  💬 Send Message
                </button>
              )}
              {sosRequest && sosRequest.status?.toUpperCase() !== 'CLOSED' && (
                <>
                  <button
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                    onClick={() => alert('Resolve functionality to be implemented')}
                  >
                    <CheckIcon className="w-4 h-4" />
                    Mark Resolved
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
                    onClick={() => alert('Close functionality to be implemented')}
                  >
                    Close SOS
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg transition-colors text-sm"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
