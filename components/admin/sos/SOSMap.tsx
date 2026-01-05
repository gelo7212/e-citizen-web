'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { NearbySOS } from '@/lib/services/sosService';

// Dynamically import MapBox map component to avoid SSR issues
const DynamicMapComponent = dynamic(() => import('./MapLibreMapBox'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100">Loading map...</div>
});

/**
 * SOS Map Component Wrapper
 *
 * Displays emergency SOS requests on an interactive map with:
 * - Real-time responder location tracking via WebSocket `location:broadcast`
 * - SOS incident markers with status indicators
 * - Click handlers for marker interactions
 * - HQ-based distance calculations
 *
 * WebSocket Integration:
 * - Subscribes to `location:broadcast` for live responder positions
 * - Updates responder markers in real-time on the map
 *
 * @see {@link docs/WEBSOCKET_CONFIG_SOS_ADMIN.md} for WebSocket event details
 * @see {SOSMapComponent}
 */
interface SOSMapComponentProps {
  sosRequests: NearbySOS[];
  userLocation: { latitude: number; longitude: number };
  hqLocation?: { latitude: number; longitude: number };
  coverageRadiusKm?: number;
  onMarkerClick?: (sos: NearbySOS) => void;
}

/**
 * Renders a map component that tracks SOS locations
 * Uses dynamic import to avoid SSR issues with map libraries
 */

export default function SOSMapComponent({
  sosRequests,
  userLocation,
  hqLocation,
  coverageRadiusKm,
  onMarkerClick
}: SOSMapComponentProps) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative z-0">
      <DynamicMapComponent 
        sosRequests={sosRequests}
        userLocation={userLocation}
        hqLocation={hqLocation}
        coverageRadiusKm={coverageRadiusKm}
        onMarkerClick={onMarkerClick}
      />
    </div>
  );
}
