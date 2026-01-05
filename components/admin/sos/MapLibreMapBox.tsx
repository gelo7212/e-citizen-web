'use client';

import React, { useEffect, useRef, useState } from 'react';
import { NearbySOS } from '@/lib/services/sosService';
import { useAuth } from '@/hooks/useAuth';
import { useSOSSocket, LocationBroadcast } from '@/hooks/useSOSSocket';

// Add CSS animations for coverage circle pulse effect
const addPulseAnimation = () => {
  const styleId = 'coverage-circle-pulse-animation';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes coveragePulse {
        0% {
          opacity: 0;
          transform: scale(0);
        }
        50% {
          opacity: 0.4;
        }
        100% {
          opacity: 0;
          transform: scale(1);
        }
      }
      @keyframes radiusGradientPulse {
        0% {
          fill-opacity: 0.3;
        }
        50% {
          fill-opacity: 0.05;
        }
        100% {
          fill-opacity: 0.3;
        }
      }
    `;
    document.head.appendChild(style);
  }
};

declare global {
  interface Window {
    mapboxgl: any;
  }
}

interface MapLibreProps {
  sosRequests: NearbySOS[];
  userLocation: { latitude: number; longitude: number };
  hqLocation?: { latitude: number; longitude: number };
  coverageRadiusKm?: number;
  onMarkerClick?: (sos: NearbySOS) => void;
  sosId?: string;
}

/**
 * MapBox Component for SOS Map Visualization
 *
 * Displays SOS locations on an interactive map with real-time responder tracking.
 * Uses MapBox GL JS for better performance and native radius circle support.
 *
 * WebSocket Events:
 * - `location:broadcast` - Real-time location updates from responders
 *
 * Features:
 * - Coverage radius circle rendering
 * - Real-time responder markers
 * - SOS incident markers with status
 * - HQ location marker
 */
export default function MapLibreMapBox({
  sosRequests,
  userLocation,
  hqLocation,
  coverageRadiusKm,
  onMarkerClick,
  sosId
}: MapLibreProps) {
  const { token } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const responderMarkersRef = useRef<Map<string, any>>(new Map());
  const sosMarkersRef = useRef<Map<string, any>>(new Map());
  const layersRef = useRef<Set<string>>(new Set());
  const [mapReady, setMapReady] = useState(false);
  const [responderLocations, setResponderLocations] = useState<Map<string, LocationBroadcast>>(new Map());

  // WebSocket connection for real-time responder location updates
  useSOSSocket({
    token: token || undefined,
    sosId: sosId,
    enabled: !!token,
    onLocationUpdate: (data: LocationBroadcast) => {
      setResponderLocations((prev) => {
        const updated = new Map(prev);
        updated.set(data.userId, data);
        return updated;
      });
    },
    onError: (error) => {
      console.error('Map WebSocket error:', error);
    },
  });

  // Initialize MapBox map
  useEffect(() => {
    // Add pulse animation styles to document
    addPulseAnimation();

    const loadMapBox = async () => {
      if (!window.mapboxgl) {
        // Load MapBox GL JS
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.async = true;
        script.onload = initMap;
        document.body.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!mapContainer.current || map.current) return;

      const mapboxgl = window.mapboxgl;
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      if (!mapboxToken) {
        console.error('MapBox token not configured');
        return;
      }

      mapboxgl.accessToken = mapboxToken;

      // Ensure container has dimensions
      if (mapContainer.current.offsetHeight === 0 || mapContainer.current.offsetWidth === 0) {
        setTimeout(initMap, 100);
        return;
      }

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 12,
          pitch: 0,
          bearing: 0,
        });

        map.current.on('load', () => {
          console.log('MapBox map loaded and ready');
          setMapReady(true);
        });

        map.current.on('error', (e: any) => {
          console.error('MapBox error:', e);
        });
      } catch (err) {
        console.error('Error initializing MapBox:', err);
      }
    };

    loadMapBox();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [userLocation]);

  // Add user location marker - DISABLED
  // useEffect(() => {
  //   if (!mapReady || !map.current || !userLocation) return;

  //   const mapboxgl = window.mapboxgl;

  //   // Remove existing user marker if any
  //   const existingMarker = (map.current as any).__userMarker;
  //   if (existingMarker) {
  //     existingMarker.remove();
  //   }

  //   try {
  //     const el = document.createElement('div');
  //     el.style.backgroundImage = `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb" stroke="%231e40af" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4" fill="%231e40af"/></svg>')`;
  //     el.style.backgroundSize = '100%';
  //     el.style.width = '24px';
  //     e.style.height = '24px';

  //     const marker = new mapboxgl.Marker(el)
  //       .setLngLat([userLocation.longitude, userLocation.latitude])
  //       .setPopup(new mapboxgl.Popup().setText('Your Location'))
  //       .addTo(map.current);

  //     (map.current as any).__userMarker = marker;
  //   } catch (err) {
  //     console.error('Error adding user marker:', err);
  //   }
  // }, [mapReady, userLocation]);

  // Add HQ marker and coverage circle
  useEffect(() => {
    if (!mapReady || !map.current || !hqLocation) {
      // Remove HQ marker and coverage layer if HQ is removed
      const existingMarker = (map.current as any)?.__hqMarker;
      if (existingMarker) {
        existingMarker.remove();
        (map.current as any).__hqMarker = null;
      }
      if (map.current && map.current.getLayer?.('coverage-circle')) {
        try {
          map.current.removeLayer('coverage-circle');
          map.current.removeSource('coverage-circle');
          layersRef.current.delete('coverage-circle');
        } catch (e) {
          // Silently ignore
        }
      }
      return;
    }

    const mapboxgl = window.mapboxgl;

    // Validate coordinates
    let lat = hqLocation.latitude;
    let lng = hqLocation.longitude;

    if (typeof lat === 'string') lat = parseFloat(lat);
    if (typeof lng === 'string') lng = parseFloat(lng);

    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Invalid HQ coordinates:', { lat, lng });
      return;
    }

    // Use requestAnimationFrame to ensure map is fully rendered
    const frameId = requestAnimationFrame(() => {
      try {
        // Verify container has dimensions
        if (!mapContainer.current || mapContainer.current.offsetHeight === 0 || mapContainer.current.offsetWidth === 0) {
          console.warn('Map container has no dimensions');
          return;
        }

        // Remove existing HQ marker
        const existingMarker = (map.current as any)?.__hqMarker;
        if (existingMarker) {
          existingMarker.remove();
        }

        // Add HQ marker
        const hqEl = document.createElement('div');
        hqEl.style.backgroundImage = `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231e40af"><circle cx="12" cy="12" r="11" fill="%233b82f6"/><circle cx="12" cy="12" r="9" fill="%2360a5fa"/><rect x="10" y="8" width="4" height="8" fill="white"/><rect x="8" y="14" width="8" height="2" fill="white"/></svg>')`;
        hqEl.style.backgroundSize = '100%';
        hqEl.style.width = '36px';
        hqEl.style.height = '36px';
        hqEl.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

        const hqMarker = new mapboxgl.Marker(hqEl)
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(
            `<div class="text-sm"><strong>SOS HQ Location</strong><br/>Lat: ${lat.toFixed(6)}<br/>Lng: ${lng.toFixed(6)}</div>`
          ))
          .addTo(map.current);

        (map.current as any).__hqMarker = hqMarker;
        console.log('✅ HQ marker added:', { lat, lng });

        // Add coverage circle if radius is provided
        if (coverageRadiusKm && coverageRadiusKm > 0) {
          addCoverageCircle(lng, lat, coverageRadiusKm);
        }
      } catch (err) {
        console.error('Error adding HQ marker or coverage circle:', err);
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [mapReady, hqLocation, coverageRadiusKm]);

  const addCoverageCircle = (lng: number, lat: number, radiusKm: number) => {
    if (!map.current) return;

    try {
      console.log('Adding coverage circle:', { lng, lat, radiusKm });

      // Remove existing coverage circle if it exists
      if (map.current.getLayer?.('coverage-circle')) {
        try {
          map.current.removeLayer('coverage-circle');
          map.current.removeSource('coverage-circle');
        } catch (e) {
          // Silently ignore
        }
      }

      // Remove existing pulse waves
      for (let i = 1; i <= 3; i++) {
        try {
          if (map.current.getLayer?.(`coverage-pulse-wave-${i}`)) {
            map.current.removeLayer(`coverage-pulse-wave-${i}`);
            map.current.removeSource(`coverage-pulse-wave-${i}`);
          }
        } catch (e) {
          // Silently ignore
        }
      }

      // Create circle as GeoJSON
      const radiusInMeters = radiusKm * 1000;
      const circle = createCircleGeoJSON(lng, lat, radiusInMeters);

      // Add main coverage circle source
      map.current.addSource('coverage-circle', {
        type: 'geojson',
        data: circle,
      });

      // Add main coverage circle layer with darker colors
      map.current.addLayer({
        id: 'coverage-circle',
        type: 'fill',
        source: 'coverage-circle',
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': 0.12,
        },
      });

      // Add outline
      map.current.addLayer({
        id: 'coverage-circle-outline',
        type: 'line',
        source: 'coverage-circle',
        paint: {
          'line-color': '#0284c7',
          'line-width': 1.5,
          'line-dasharray': [5, 5],
          'line-opacity': 0.25,
        },
      });

      // Add pulsing wave layers for expanding animation effect
      for (let waveIndex = 1; waveIndex <= 3; waveIndex++) {
        // Start with a small circle for each wave
        const waveCircle = createCircleGeoJSON(lng, lat, 100); // Start small
        
        map.current.addSource(`coverage-pulse-wave-${waveIndex}`, {
          type: 'geojson',
          data: waveCircle,
        });

        map.current.addLayer({
          id: `coverage-pulse-wave-${waveIndex}`,
          type: 'fill',
          source: `coverage-pulse-wave-${waveIndex}`,
          paint: {
            'fill-color': '#0284c7',
            'fill-opacity': 0.16,
          },
        });

        // Animate the wave expanding from center to end
        animateWave(waveIndex, lng, lat, radiusInMeters);
      }

      layersRef.current.add('coverage-circle');
      layersRef.current.add('coverage-circle-outline');
      for (let i = 1; i <= 3; i++) {
        layersRef.current.add(`coverage-pulse-wave-${i}`);
      }

      console.log('✅ Coverage circle added successfully with pulsing animation:', { lng, lat, radiusKm });
    } catch (err) {
      console.error('Error adding coverage circle:', err);
    }
  };

  const animateWave = (waveIndex: number, lng: number, lat: number, maxRadius: number) => {
    const duration = 3500; // 3.5 second expansion
    const delay = waveIndex * 700; // Stagger waves by 700ms
    const startTime = Date.now() + delay;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }

      if (!map.current?.getSource?.(`coverage-pulse-wave-${waveIndex}`)) {
        return; // Source was removed
      }

      const progress = (elapsed % duration) / duration;
      // Expand from center (0 radius) to full radius
      const currentRadius = maxRadius * progress;
      // Fade out as it expands
      const opacity = Math.max(0, 0.16 * (1 - progress));

      try {
        // Update the circle to expand
        const expandingCircle = createCircleGeoJSON(lng, lat, currentRadius);
        map.current.getSource(`coverage-pulse-wave-${waveIndex}`).setData(expandingCircle);
        
        // Update opacity to fade out
        map.current.setPaintProperty(
          `coverage-pulse-wave-${waveIndex}`,
          'fill-opacity',
          opacity
        );
      } catch (e) {
        // Source might be removed, silently fail
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  };

  // Update responder markers
  useEffect(() => {
    if (!mapReady || !map.current) return;

    responderLocations.forEach((location) => {
      try {
        if (!location || location.latitude === null || location.latitude === undefined ||
            location.longitude === null || location.longitude === undefined) {
          return;
        }

        let lat = location.latitude;
        let lng = location.longitude;

        if (typeof lat === 'string') lat = parseFloat(lat);
        if (typeof lng === 'string') lng = parseFloat(lng);

        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng) ||
            lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return;
        }

        const markerId = `responder-${location.userId}`;
        let marker = responderMarkersRef.current.get(markerId);

        if (marker) {
          marker.setLngLat([lng, lat]);
        } else {
          const el = document.createElement('div');
          el.style.backgroundImage = `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2306b6d4" stroke="%230891b2" stroke-width="2"><circle cx="12" cy="12" r="6"/></svg>')`;
          el.style.backgroundSize = '100%';
          el.style.width = '16px';
          el.style.height = '16px';

          const responderMarker = new window.mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(new window.mapboxgl.Popup().setHTML(
              `<div class="text-sm"><strong>Responder ${location.userId}</strong><br/>Accuracy: ${location.accuracy}m<br/>Last Update: ${new Date(location.timestamp).toLocaleTimeString()}</div>`
            ))
            .addTo(map.current);

          responderMarkersRef.current.set(markerId, responderMarker);
        }
      } catch (err) {
        console.error('Error processing responder marker:', err);
      }
    });
  }, [mapReady, responderLocations]);

  // Update SOS markers
  useEffect(() => {
    if (!mapReady || !map.current || !sosRequests.length) return;

    const frameId = requestAnimationFrame(() => {
      try {
        // Remove old markers
        sosMarkersRef.current.forEach((marker) => {
          marker.remove();
        });
        sosMarkersRef.current.clear();

        // Add new markers
        sosRequests.forEach((sos) => {
          try {
            if (!sos.location || sos.location.latitude === null || sos.location.latitude === undefined ||
                sos.location.longitude === null || sos.location.longitude === undefined) {
              return;
            }

            let lat = sos.location.latitude;
            let lng = sos.location.longitude;

            if (typeof lat === 'string') lat = parseFloat(lat);
            if (typeof lng === 'string') lng = parseFloat(lng);

            if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng) ||
                lat < -90 || lat > 90 || lng < -180 || lng > 180) {
              return;
            }

            const color = sos.status === 'active' ? '#ef4444' : sos.status === 'resolved' ? '#22c55e' : '#9ca3af';

            const el = document.createElement('div');
            // Create an SOS pin with exclamation mark for better identification
            el.style.backgroundImage = `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="${encodeURIComponent(color)}"/><circle cx="12" cy="12" r="10" fill="white"/><circle cx="12" cy="12" r="9" fill="${encodeURIComponent(color)}"/><text x="12" y="16" fill="white" font-weight="bold" font-size="14" font-family="Arial" text-anchor="middle">!</text></svg>')`;
            el.style.backgroundSize = '100%';
            el.style.width = '40px';
            el.style.height = '40px';
            el.style.cursor = 'pointer';
            el.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))';

            const marker = new window.mapboxgl.Marker(el)
              .setLngLat([lng, lat])
              .addTo(map.current);

            // Calculate distance if HQ location available
            let distanceHtml = '';
            if (hqLocation) {
              const R = 6371;
              const dLat = (lat - hqLocation.latitude) * Math.PI / 180;
              const dLon = (lng - hqLocation.longitude) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(hqLocation.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distanceKm = R * c;
              const displayDistance = distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)}m` : `${distanceKm.toFixed(2)}km`;
              distanceHtml = `<br/>Distance from HQ: ${displayDistance}`;
            }

            marker.setPopup(new window.mapboxgl.Popup().setHTML(
              `<div class="text-sm"><strong>${sos.address?.barangay}, ${sos.address?.city}</strong><br/>Status: ${sos.status.toUpperCase()}<br/>Accuracy: ${sos.location?.accuracy}m${distanceHtml}</div>`
            ));

            marker.getElement().addEventListener('click', () => {
              onMarkerClick?.(sos);
            });

            sosMarkersRef.current.set(sos.sosId, marker);
          } catch (err) {
            console.error('Error adding SOS marker:', err);
          }
        });
      } catch (err) {
        console.error('Error updating SOS markers:', err);
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [mapReady, sosRequests, hqLocation, onMarkerClick]);

  return <div ref={mapContainer} className="w-full h-full" />;
}

// Helper function to create a circle as GeoJSON
function createCircleGeoJSON(centerLng: number, centerLat: number, radiusInMeters: number) {
  const steps = 64;
  const coordinates = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const lat = centerLat + (radiusInMeters / 111320) * Math.cos(angle);
    const lng = centerLng + (radiusInMeters / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
    coordinates.push([lng, lat]);
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };
}
