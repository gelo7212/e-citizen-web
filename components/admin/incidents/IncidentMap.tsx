'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { IncidentLocation } from '@/types';
import 'leaflet/dist/leaflet.css';

interface IncidentMapProps {
  location: IncidentLocation;
  title?: string;
}

// Fix for Leaflet marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

export function IncidentMap({ location, title = 'Incident Location' }: IncidentMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      // Create the map
      const map = L.map(mapContainer.current).setView([location.lat, location.lng], 16);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create custom red marker for incident
      const redMarker = L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjZWYzNTM1IiBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJjMCA3IDEwIDExIDEwIDExczEwLTQgMTAtMTFjMC01LjUyLTQuNDgtMTAtMTAtMTB6bTAgMTZjLTMuMzEgMC02LTIuNjktNi02czIuNjktNiA2LTYgNiAyLjY5IDYgNi0yLjY5IDYtNiA2eiIvPjwvc3ZnPg==',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [32, 40],
        shadowSize: [41, 41],
        iconAnchor: [16, 40],
        shadowAnchor: [13, 41],
        popupAnchor: [0, -40],
      });

      // Add marker at incident location
      L.marker([location.lat, location.lng], { icon: redMarker })
        .bindPopup(`
          <div class="p-3">
            <p class="font-bold text-sm mb-2">${title}</p>
            ${location.cityCode ? `<p class="text-xs text-gray-600 mt-2">City: ${location.cityCode}</p>` : ''}
            ${location.barangayCode ? `<p class="text-xs text-gray-600">Barangay: ${location.barangayCode}</p>` : ''}
          </div>
        `)
        .openPopup()
        .addTo(map);

      mapRef.current = map;
      setMapLoaded(true);

      // Return cleanup function
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to load map:', error);
    }
  }, [location, title]);

  const openStreetView = () => {
    const streetViewUrl = `https://www.google.com/maps/@${location.lat},${location.lng},3a,75y,0h,90t/data=!3m6!1e1!3m4!1s_default!2e0!7i16384!8i8192`;
    window.open(streetViewUrl, '_blank');
  };

  const openGoogleMaps = () => {
    const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-admin-900">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={openStreetView}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            title="Open in Google Street View"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
            Street View
          </button>
          <button
            onClick={openGoogleMaps}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            title="Open in Google Maps"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
            </svg>
            Maps
          </button>
        </div>
      </div>

      <div
        ref={mapContainer}
        className="w-full rounded-lg border border-gray-300 overflow-hidden shadow-md z-0"
        style={{ height: '400px' }}
      >
        {!mapLoaded && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-600">Loading map...</p>
          </div>
        )}
      </div>
    </div>
  );
}
