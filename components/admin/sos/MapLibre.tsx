'use client';

import React, { useEffect, useRef, useState } from 'react';
import { NearbySOS } from '@/lib/services/sosService';
import { useAuth } from '@/hooks/useAuth';
import { useSOSSocket, LocationBroadcast } from '@/hooks/useSOSSocket';

declare global {
  interface Window {
    L: any;
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
 * MapLibre Component for SOS Map Visualization
 *
 * Displays SOS locations on an interactive map with real-time responder tracking.
 * Listens to `location:broadcast` events from the WebSocket for live updates.
 *
 * WebSocket Events:
 * - `location:broadcast` - Real-time location updates from responders
 *
 * @see {@link docs/WEBSOCKET_CONFIG_SOS_ADMIN.md} for WebSocket configuration details
 */
export default function MapLibre({
  sosRequests,
  userLocation,
  hqLocation,
  coverageRadiusKm,
  onMarkerClick,
  sosId
}: MapLibreProps) {
  const { token } = useAuth();
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const responderMarkersRef = useRef<Map<string, any>>(new Map());
  const coverageCircleRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [responderLocations, setResponderLocations] = useState<Map<string, LocationBroadcast>>(new Map());

  // WebSocket connection for real-time responder location updates
  // See: docs/WEBSOCKET_CONFIG_SOS_ADMIN.md for event documentation
  useSOSSocket({
    token: token || undefined,
    sosId: sosId,
    enabled: !!token, // Only enable when token is available
    onLocationUpdate: (data: LocationBroadcast) => {
      // Update responder location from location:broadcast event
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

  // Initialize map only once
  useEffect(() => {
    // Load Leaflet CSS and JS dynamically
    const loadLeaflet = async () => {
      if (!window.L) {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = initMap;
        document.body.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!containerRef.current || mapRef.current) return;

      const L = window.L;

      // Ensure container has dimensions before creating map
      if (containerRef.current.offsetHeight === 0 || containerRef.current.offsetWidth === 0) {
        setTimeout(initMap, 100);
        return;
      }

      // Create map
      mapRef.current = L.map(containerRef.current, {
        attributionControl: true,
        preferCanvas: false, // Use SVG renderer to avoid canvas timing issues
      }).setView(
        [userLocation.latitude, userLocation.longitude],
        13
      );

      // Ensure map has proper dimensions
      mapRef.current.invalidateSize();

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add user location marker
      L.circleMarker([userLocation.latitude, userLocation.longitude], {
        radius: 8,
        fillColor: '#2563eb',
        color: '#1e40af',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .addTo(mapRef.current)
        .bindPopup('Your Location');

      // Mark map as ready - use multiple triggers to ensure it fires
      let readySet = false;
      const setReady = () => {
        if (!readySet && mapRef.current && containerRef.current) {
          readySet = true;
          console.log('Map ready!');
          mapRef.current.invalidateSize(true);
          setMapReady(true);
        }
      };

      // Listen for multiple map readiness events
      mapRef.current.on('load', setReady);
      mapRef.current.on('zoomend', setReady);
      mapRef.current.on('moveend', setReady);

      // Fallback: set ready after a short delay if events don't fire
      setTimeout(setReady, 300);
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        // Clean up coverage circle
        if (coverageCircleRef.current) {
          try {
            mapRef.current.removeLayer(coverageCircleRef.current);
          } catch (e) {
            // Silently ignore
          }
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [userLocation]);

  // Update responder markers based on real-time location updates
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const L = window.L;

    responderLocations.forEach((location) => {
      try {
        // Validate location data before processing
        if (!location || location.latitude === null || location.latitude === undefined || 
            location.longitude === null || location.longitude === undefined) {
          return;
        }

        let lat = location.latitude;
        let lng = location.longitude;

        // Convert strings to numbers if needed
        if (typeof lat === 'string') {
          lat = parseFloat(lat);
        }
        if (typeof lng === 'string') {
          lng = parseFloat(lng);
        }

        if (
          typeof lat !== 'number' ||
          typeof lng !== 'number' ||
          isNaN(lat) ||
          isNaN(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          return;
        }

        // Create LatLng object explicitly
        const latlng = L.latLng(lat, lng);
        if (!latlng || typeof latlng.lat !== 'number' || typeof latlng.lng !== 'number') {
          return;
        }

        // Check if marker already exists
        const existingMarker = responderMarkersRef.current.get(location.userId);
        
        if (existingMarker) {
          // Update existing marker position
          existingMarker.setLatLng(latlng);
        } else {
          // Create new responder marker (location:broadcast event)
          const responderMarker = L.marker(latlng, {
            icon: L.divIcon({
              html: `
                <div style="
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background-color: #06b6d4;
                  border: 2px solid #0891b2;
                  opacity: 0.9;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>
              `,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
              popupAnchor: [0, -8],
              className: 'responder-marker-icon'
            })
          });

          responderMarker.addTo(mapRef.current);
          responderMarker.bindPopup(`
            <div class="text-sm">
              <strong>Responder ${location.userId}</strong><br/>
              Accuracy: ${location.accuracy}m<br/>
              Last Update: ${new Date(location.timestamp).toLocaleTimeString()}
            </div>
          `);

          responderMarkersRef.current.set(location.userId, responderMarker);
        }
      } catch (err) {
        console.error('Error processing responder marker:', err, location);
      }
    });
  }, [mapReady, responderLocations]);

  // Update coverage radius circle when HQ location or radius changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || !hqLocation) {
      // Clean up existing coverage circle if HQ is removed
      if (coverageCircleRef.current && mapRef.current) {
        try {
          mapRef.current.removeLayer(coverageCircleRef.current);
          coverageCircleRef.current = null;
        } catch (e) {
          // Silently ignore
        }
      }
      return;
    }

    const L = window.L;

    // Validate coordinates
    let lat = hqLocation.latitude;
    let lng = hqLocation.longitude;

    if (typeof lat === 'string') {
      lat = parseFloat(lat);
    }
    if (typeof lng === 'string') {
      lng = parseFloat(lng);
    }

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      console.warn('Invalid HQ coordinates for coverage circle:', { lat, lng });
      return;
    }

    // Only draw coverage circle if radius is provided and valid
    if (coverageRadiusKm && coverageRadiusKm > 0) {
      // Use requestAnimationFrame to ensure map is fully rendered and has dimensions
      const frameId = requestAnimationFrame(() => {
        try {
          // Verify map container has dimensions
          if (!containerRef.current || containerRef.current.offsetHeight === 0 || containerRef.current.offsetWidth === 0) {
            console.warn('Map container has no dimensions yet, retrying coverage circle...');
            // Schedule retry after a short delay
            setTimeout(() => {
              if (mapRef.current && mapRef.current._container) {
                mapRef.current.invalidateSize();
              }
            }, 100);
            return;
          }

          // Verify map has valid size
          const mapSize = mapRef.current?.getSize?.();
          if (!mapSize || !mapSize.x || !mapSize.y || mapSize.x <= 0 || mapSize.y <= 0) {
            console.warn('Map size not valid yet:', mapSize);
            // Schedule retry after map has time to render
            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.invalidateSize(true);
              }
            }, 100);
            return;
          }

          // Verify map has valid bounds
          const bounds = mapRef.current?.getBounds?.();
          if (!bounds || !bounds.isValid?.()) {
            console.warn('Map bounds not valid yet:', bounds);
            return;
          }

          // Remove existing coverage circle if any
          if (coverageCircleRef.current) {
            try {
              mapRef.current.removeLayer(coverageCircleRef.current);
              coverageCircleRef.current = null;
            } catch (e) {
              // Silently ignore
            }
          }

          console.log('Adding coverage circle at:', lat, lng, 'with radius:', coverageRadiusKm, 'km');
          
          // Create circle in meters (Leaflet expects meters)
          const radiusInMeters = coverageRadiusKm * 1000;
          
          coverageCircleRef.current = L.circle([lat, lng], {
            radius: radiusInMeters,
            color: '#06b6d4',
            weight: 2,
            opacity: 0.3,
            fillColor: '#06b6d4',
            fillOpacity: 0.1,
            dashArray: '5, 5'
          });

          coverageCircleRef.current.addTo(mapRef.current);
          
          console.log('✅ Coverage circle added successfully:', {
            latitude: lat,
            longitude: lng,
            radiusKm: coverageRadiusKm,
            radiusMeters: radiusInMeters
          });
        } catch (err) {
          console.error('Error adding coverage circle:', err, { lat, lng, coverageRadiusKm });
        }
      });

      return () => {
        cancelAnimationFrame(frameId);
      };
    }
  }, [mapReady, hqLocation, coverageRadiusKm]);

  // Update HQ marker when hqLocation changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || !hqLocation) return;

    const L = window.L;

    // Remove existing HQ marker if any
    const existingHQMarker = (mapRef.current as any).__hqMarker;
    if (existingHQMarker) {
      try {
        mapRef.current.removeLayer(existingHQMarker);
      } catch (e) {
        // Silently ignore
      }
    }

    // Validate HQ location coordinates
    let lat = hqLocation.latitude;
    let lng = hqLocation.longitude;

    if (typeof lat === 'string') {
      lat = parseFloat(lat);
    }
    if (typeof lng === 'string') {
      lng = parseFloat(lng);
    }

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      console.warn('Invalid HQ coordinates:', { lat, lng });
      return;
    }

    console.log('Adding HQ marker at:', lat, lng);

    // Create HQ marker with distinctive styling (blue marker)
    const hqMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `
          <div style="
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: #3b82f6;
            border: 3px solid #1e40af;
            opacity: 0.95;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            font-weight: bold;
            color: white;
            font-size: 12px;
          ">HQ</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
        className: 'hq-marker-icon'
      })
    });

    hqMarker.addTo(mapRef.current);
    hqMarker.bindPopup('<div class="text-sm"><strong>SOS HQ Location</strong><br/>Lat: ' + lat.toFixed(6) + '<br/>Lng: ' + lng.toFixed(6) + '</div>');
    
    // Store reference to the HQ marker for cleanup
    (mapRef.current as any).__hqMarker = hqMarker;

    console.log('🔵 HQ marker added successfully:', {
      latitude: lat,
      longitude: lng,
      latFixed: lat.toFixed(6),
      lngFixed: lng.toFixed(6)
    });
  }, [mapReady, hqLocation]);

  // Update SOS markers when data changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || !sosRequests.length) return;

    const L = window.L;

    console.log('Adding SOS markers:', sosRequests.length);

    // Use requestAnimationFrame to ensure rendering
    const frameId = requestAnimationFrame(() => {
      try {
        // Verify map container has dimensions
        if (!containerRef.current || containerRef.current.offsetHeight === 0 || containerRef.current.offsetWidth === 0) {
          console.warn('Map container has no dimensions');
          return;
        }

        // Ensure map is properly initialized
        const mapSize = mapRef.current.getSize();
        if (!mapSize || mapSize.x <= 0 || mapSize.y <= 0) {
          console.warn('Map size invalid:', mapSize);
          mapRef.current.invalidateSize();
          return;
        }

        // Ensure map has valid bounds before adding markers
        const bounds = mapRef.current.getBounds();
        if (!bounds || !bounds.isValid?.()) {
          console.warn('Map bounds not valid yet, waiting...', bounds);
          // Schedule a retry after the map is properly initialized
          setTimeout(() => {
            mapRef.current?.invalidateSize(true);
          }, 100);
          return;
        }

        console.log('Map size valid:', mapSize, 'Bounds valid:', bounds);

        // Clear existing markers
        markersRef.current.forEach((marker) => {
          if (mapRef.current && marker) {
            try {
              mapRef.current.removeLayer(marker);
            } catch (e) {
              // Silently ignore errors
            }
          }
        });
        markersRef.current = [];

        // Add new markers
        sosRequests.forEach((sos) => {
          if (!mapRef.current) return;

          try {
            // Validate location exists first
            if (!sos.location) {
              console.warn('SOS record missing location:', sos);
              return;
            }

            if (sos.location.latitude === null || sos.location.latitude === undefined || 
                sos.location.longitude === null || sos.location.longitude === undefined) {
              console.warn('SOS location has null/undefined coordinates:', sos);
              return;
            }

            // Parse and validate coordinates
            let lat = sos.location.latitude;
            let lng = sos.location.longitude;

            // Convert strings to numbers if needed
            if (typeof lat === 'string') {
              lat = parseFloat(lat);
            }
            if (typeof lng === 'string') {
              lng = parseFloat(lng);
            }

            // Validate parsed coordinates
            if (typeof lat !== 'number' || typeof lng !== 'number') {
              console.warn('Invalid coordinate types after parsing:', { lat: typeof lat, lng: typeof lng });
              return;
            }

            if (isNaN(lat) || isNaN(lng)) {
              console.warn('Coordinates are NaN:', { lat, lng });
              return;
            }

            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
              console.warn('Coordinates out of bounds:', { lat, lng });
              return;
            }

            // Verify map is still valid before adding marker
            if (!mapRef.current || !mapRef.current._container) {
              console.warn('Map container no longer valid');
              return;
            }

            const color = sos.status === 'active' ? '#ef4444' : sos.status === 'resolved' ? '#22c55e' : '#9ca3af';

            // Create LatLng object explicitly
            const latlng = L.latLng(lat, lng);
            
            // Validate the created LatLng object
            if (!latlng || typeof latlng.lat !== 'number' || typeof latlng.lng !== 'number') {
              console.warn('Invalid LatLng object created:', latlng);
              return;
            }

            console.log('Creating marker at:', lat, lng);

            // Create a custom div icon for the marker
            const marker = L.marker(latlng, {
              icon: L.divIcon({
                html: `
                  <div style="
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background-color: ${color};
                    border: 2px solid ${color};
                    opacity: 0.9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  "></div>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -10],
                className: 'sos-marker-icon'
              })
            });

            // Ensure marker was created successfully
            if (!marker) {
              console.warn('Failed to create marker');
              return;
            }

            marker.addTo(mapRef.current);
            console.log('Marker added successfully');

            // FORCE: Only use HQ location for distance calculation - no fallback
            if (!hqLocation) {
              console.warn('HQ location not available - skipping marker', { lat, lng });
              markersRef.current.pop(); // Remove the marker
              mapRef.current.removeLayer(marker);
              return;
            }

            // Calculate distance from HQ using Haversine formula
            const R = 6371; // Earth's radius in km
            const dLat = (lat - hqLocation.latitude) * Math.PI / 180;
            const dLon = (lng - hqLocation.longitude) * Math.PI / 180;
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(hqLocation.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distanceKm = R * c;
            
            const displayDistance = distanceKm < 1
              ? `${(distanceKm * 1000).toFixed(0)}m`
              : `${distanceKm.toFixed(2)}km`;

            // Log distance calculation for verification
            console.log('📍 Distance Calculation:', {
              hqLocation: { lat: hqLocation.latitude, lng: hqLocation.longitude },
              sosLocation: { lat, lng },
              dLat: dLat,
              dLon: dLon,
              sinDLat2: Math.sin(dLat / 2),
              sinDLon2: Math.sin(dLon / 2),
              a: a,
              c: c,
              distanceKm: distanceKm,
              distanceM: distanceKm * 1000,
              displayDistance: displayDistance,
              sosId: sos.sosId,
              sosAddress: `${sos.address?.barangay}, ${sos.address?.city}`
            });

            marker.bindPopup(`
              <div class="text-sm">
                <strong>${sos.address?.barangay}, ${sos.address?.city}</strong><br/>
                Status: ${sos.status.toUpperCase()}<br/>
                Accuracy: ${sos.location?.accuracy}m<br/>
                Distance from HQ: ${displayDistance}
              </div>
            `);

            marker.on('click', () => {
              onMarkerClick?.(sos);
            });

            markersRef.current.push(marker);
          } catch (err) {
            console.error('Error adding marker:', err, sos);
          }
        });
      } catch (err) {
        console.error('Error updating markers:', err);
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [mapReady, sosRequests, onMarkerClick]);

  return <div ref={containerRef} className="w-full h-full relative z-0" />;
}
