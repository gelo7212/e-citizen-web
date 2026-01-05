'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { Alert } from '@/components/shared/Alert';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useRequireAuth } from '@/hooks/useAuth';

export default function RescuerMapPage() {
  const auth = useRequireAuth();
  const [sosLocations, setSosLocations] = useState<any[]>([]);
  const [wsMessage, setWsMessage] = useState<string | null>(null);

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';
  const { isConnected } = useWebSocket({
    url: WS_URL,
    onMessage: (data) => {
      if (data.type === 'sos_location_update') {
        setSosLocations((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((s) => s.id === data.sosId);
          if (idx >= 0) {
            updated[idx] = data.location;
          } else {
            updated.push({ id: data.sosId, ...data.location });
          }
          return updated;
        });
      }
    },
    onError: (error) => setWsMessage('Connection error'),
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Live Map</h1>

      {!isConnected && (
        <Alert
          type="warning"
          message="Trying to reconnect to live map..."
          dismissible={false}
        />
      )}

      <Card>
        <div className="h-96 bg-gray-200 rounded flex items-center justify-center">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-medium">Map will be displayed here</p>
            <p className="text-sm mt-2">Leaflet/Mapbox integration</p>
            <p className="text-sm mt-2">
              {isConnected ? '✓ Connected' : '○ Connecting...'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
