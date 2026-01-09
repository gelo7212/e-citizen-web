'use client';

import React, { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useSOSSocket } from '@/hooks/useSOSSocket';
import RescuerMap from '@/components/admin/rescuer/RescuerMap';
import { getAuthToken } from '@/lib/auth/store';
import { Alert } from '@/components/shared/Alert';

interface RescuerLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  deviceId: string;
  userRole?: 'RESCUER' | 'CITIZEN' | 'SOS_ADMIN';
}

export default function RescuerMapPage() {
  const auth = useRequireAuth();
  const token = getAuthToken();
  const [locations, setLocations] = useState<Map<string, RescuerLocation>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [rescuerLocation, setRescuerLocation] = useState<RescuerLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Listen to all SOS incidents without joining a specific one
  const { isConnected } = useSOSSocket({
    token: token || '',
    enabled: !!token,
    onLocationUpdate: (data: any) => {
      setLocations((prev) => new Map(prev).set(data.userId, data as RescuerLocation));
    },
    onError: (err) => {
      console.error('WebSocket error:', err);
      setError(`Connection error: ${err.message}`);
    },
  });

  // Watch user's location
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = position.timestamp;

        setRescuerLocation({
          userId: auth.user?.id || '',
          latitude,
          longitude,
          accuracy,
          timestamp,
          deviceId: 'current-device',
          userRole: 'RESCUER',
        });

        setLocationError(null);
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        setLocationError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [auth.isAuthenticated, auth.user?.id]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900">Live Rescuer Map</h1>
        <p className="text-gray-600 text-sm mt-1">Real-time location tracking of all rescuers</p>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <Alert
            type="warning"
            message="Connecting to live map... Please wait."
            dismissible={false}
          />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <Alert
            type="error"
            message={error}
            dismissible={true}
          />
        </div>
      )}

      {/* Location Error */}
      {locationError && (
        <div className="bg-orange-50 border-b border-orange-200 p-4">
          <Alert
            type="warning"
            message={`Location error: ${locationError}`}
            dismissible={true}
          />
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative min-h-0">
        {!isConnected ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Connecting to WebSocket...</p>
              <p className="text-sm text-gray-500 mt-1">Establishing real-time connection</p>
            </div>
          </div>
        ) : (
          <RescuerMap
            locations={rescuerLocation ? [rescuerLocation, ...Array.from(locations.values())] : Array.from(locations.values())}
            mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            centerLatitude={rescuerLocation?.latitude}
            centerLongitude={rescuerLocation?.longitude}
            initialZoom={13}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t border-gray-200 p-4 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? '✓ Connected' : '○ Disconnected'}</span>
          </div>
          <div>📍 {locations.size + (rescuerLocation ? 1 : 0)} rescuers on map</div>
        </div>
      </div>
    </div>
  );
}
