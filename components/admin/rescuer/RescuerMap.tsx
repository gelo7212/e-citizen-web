'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RescuerLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  deviceId: string;
  userRole?: 'RESCUER' | 'CITIZEN' | 'SOS_ADMIN';
}

interface RouteData {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: {
    coordinates: [number, number][];
  };
}

interface RescuerMapProps {
  locations: RescuerLocation[];
  centerLatitude?: number;
  centerLongitude?: number;
  initialZoom?: number;
  mapboxToken?: string;
  viewType?: 'map' | 'street';
}

/**
 * RescuerMap Component
 * 
 * A reusable, mobile-first map component for tracking rescuer locations in real-time.
 * 
 * Features:
 * - Real-time location updates with animated markers
 * - Responsive design (mobile-first)
 * - Auto-zoom to fit all rescuers
 * - User-specific marker colors and styling
 * - Accuracy radius visualization
 * - Touch-friendly controls
 * 
 * @component
 */
const RescuerMap: React.FC<RescuerMapProps> = ({
  locations,
  centerLatitude = 40.7128,
  centerLongitude = -74.0060,
  initialZoom = 13,
  mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  viewType = 'map',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; popup: mapboxgl.Popup }>>(new Map());
  const circlesRef = useRef<Set<string>>(new Set());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!mapboxToken) {
      console.warn('⚠️ Mapbox token not provided. Map may not load.');
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: viewType === 'street' ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-v9',
        center: [centerLongitude, centerLatitude],
        zoom: initialZoom,
        pitch: 0,
        bearing: 0,
        // Mobile-optimized controls
        attributionControl: true,
        interactive: true,
        doubleClickZoom: true,
        dragRotate: false, // Disable on mobile
        touchZoomRotate: true,
      });

      // Add navigation controls (mobile-friendly)
      const nav = new mapboxgl.NavigationControl({
        visualizePitch: false,
        showZoom: true,
        showCompass: false,
      });
      map.current.addControl(nav, 'top-right');

      // Add geolocate control for mobile
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: false,
        showUserHeading: false,
      });
      map.current.addControl(geolocate, 'top-right');

      map.current.on('load', () => {
        console.log('✓ Map loaded successfully');
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e.error);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      // Cleanup not needed here as we maintain the map reference
    };
  }, [mapboxToken, centerLatitude, centerLongitude, initialZoom]);

  // Change map style when viewType changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const newStyle = viewType === 'street' ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-v9';
    map.current.setStyle(newStyle);
  }, [viewType, mapLoaded]);

  // Helper: Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch route on demand
  const fetchRoute = async () => {
    if (!map.current || !mapLoaded || locations.length < 2) return;

    const rescuerLoc = locations.find(loc => loc.userRole === 'RESCUER');
    const citizenLoc = locations.find(loc => loc.userRole === 'CITIZEN');

    if (!rescuerLoc || !citizenLoc) return;

    const distanceBetween = calculateDistance(
      rescuerLoc.latitude,
      rescuerLoc.longitude,
      citizenLoc.latitude,
      citizenLoc.longitude
    );

    if (distanceBetween < 50) {
      console.log('✓ Rescuer reached SOS location (distance:', distanceBetween.toFixed(0), 'm)');
      setRouteData(null);
      if (map.current?.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }
      return;
    }

    setLoadingRoute(true);
    try {
      const start = [rescuerLoc.longitude, rescuerLoc.latitude];
      const end = [citizenLoc.longitude, citizenLoc.latitude];
      
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?access_token=${mapboxToken}&geometries=geojson&overview=full`;

      const response = await fetch(directionsUrl);
      if (!response.ok) {
        console.warn('Failed to fetch route:', response.status, response.statusText);
        setRouteData(null);
        return;
      }

      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geometry = route.geometry;

        setRouteData({
          distance: route.distance,
          duration: route.duration,
          geometry,
        });

        // Add or update route layer
        if (map.current!.getSource('route')) {
          (map.current!.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            geometry,
            properties: {},
          });
        } else {
          map.current!.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry,
              properties: {},
            },
          });

          map.current!.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3B82F6',
              'line-width': 4,
              'line-opacity': 0.8,
              'line-dasharray': [2, 2],
            },
          });
        }

        console.log('✓ Route displayed:', {
          distance: (route.distance / 1000).toFixed(2) + ' km',
          duration: (route.duration / 60).toFixed(0) + ' min',
        });
      } else {
        console.warn('No routes found in response');
        setRouteData(null);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setRouteData(null);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Handle show/hide route
  const handleToggleRoute = () => {
    if (showRoute) {
      // Hide route
      setShowRoute(false);
      if (map.current?.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }
      setRouteData(null);
    } else {
      // Show route
      setShowRoute(true);
      fetchRoute();
    }
  };

  // Update locations on map
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const colorMap: { [key: string]: string } = {
      'RESCUER': '#3B82F6',    // Blue
      'CITIZEN': '#EF4444',    // Red
      'SOS_ADMIN': '#A855F7',  // Purple
    };

    // Get user roles from locations (default to RESCUER)
    const locationMap = new Map(locations.map(loc => [loc.userId, loc]));

    // Remove markers for users no longer in locations
    markersRef.current.forEach((markerData, userId) => {
      if (!locationMap.has(userId)) {
        markerData.marker.remove();
        markerData.popup.remove();
        markersRef.current.delete(userId);

        // Remove accuracy circle
        if (map.current && map.current.getSource(`circle-${userId}`)) {
          map.current.removeLayer(`circle-${userId}`);
          map.current.removeSource(`circle-${userId}`);
        }
        circlesRef.current.delete(userId);
      }
    });

    // Update or create markers for each location
    locations.forEach((location) => {
      const userRole = location.userRole || 'RESCUER';
      const baseColor = colorMap[userRole] || colorMap['RESCUER'];
      const existingMarker = markersRef.current.get(location.userId);

      if (existingMarker) {
        // Update existing marker position with smooth animation
        existingMarker.marker.setLngLat([location.longitude, location.latitude]);
        existingMarker.popup.setLngLat([location.longitude, location.latitude]);
      } else {
        // Create new marker element with custom pin design
        const el = document.createElement('div');
        el.className = 'rescuer-marker-container';
        
        // Create SVG-based pin for better visual appeal
        const pinSvg = `
          <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Pin shape -->
            <path d="M20 0C11.16 0 4 7.16 4 16c0 9 16 32 16 32s16-23 16-32c0-8.84-7.16-16-16-16z" fill="${baseColor}"/>
            <!-- Inner circle -->
            <circle cx="20" cy="16" r="8" fill="white"/>
            <!-- Center dot -->
            <circle cx="20" cy="16" r="4" fill="${baseColor}"/>
          </svg>
        `;
        
        el.style.cssText = `
          width: 40px;
          height: 48px;
          cursor: pointer;
          transition: transform 0.2s ease-out, filter 0.2s ease-out;
          user-select: none;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        `;
        el.innerHTML = pinSvg;
        el.onmouseenter = () => {
          el.style.transform = 'scale(1.2)';
          el.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))';
        };
        el.onmouseleave = () => {
          el.style.transform = 'scale(1)';
          el.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))';
        };

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: false,
        }).setHTML(`
          <div class="rescuer-popup" style="padding: 8px; max-width: 200px;">
            <div style="font-weight: bold; color: ${baseColor}; margin-bottom: 4px;">
              ${location.userId.slice(0, 12)}...
            </div>
            <div style="font-size: 12px; color: #666;">
              <div>📍 ${(location.latitude ?? 0).toFixed(4)}, ${(location.longitude ?? 0).toFixed(4)}</div>
              <div>📏 Accuracy: ${(location.accuracy ?? 0).toFixed(0)}m</div>
              <div>⏱️ ${new Date(location.timestamp || Date.now()).toLocaleTimeString()}</div>
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker(el, {
          anchor: 'bottom', // Anchor the pin at the bottom point
          offset: [0, 0], // No additional offset needed
        })
          .setLngLat([location.longitude, location.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        // Add click to show popup
        el.addEventListener('click', () => {
          popup.addTo(map.current!);
        });

        markersRef.current.set(location.userId, { marker, popup });
      }

      // Add or update accuracy circle
      if (!circlesRef.current.has(location.userId)) {
        const sourceId = `circle-${location.userId}`;
        const layerId = `circle-${location.userId}`;

        // Create accuracy circle GeoJSON
        const circleRadius = (location.accuracy / 111000) * 1000; // Convert meters to degrees

        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude],
            },
            properties: {},
          },
        });

        map.current!.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 20, 50],
            'circle-color': baseColor,
            'circle-opacity': 0.15,
            'circle-stroke-width': 2,
            'circle-stroke-color': baseColor,
            'circle-stroke-opacity': 0.4,
          },
        });

        circlesRef.current.add(location.userId);
      } else {
        // Update circle position
        const sourceId = `circle-${location.userId}`;
        if (map.current!.getSource(sourceId)) {
          (map.current!.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude],
            },
            properties: {},
          });
        }
      }
    });

    // Auto-fit bounds to show all markers (mobile-friendly padding)
    if (locations.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(loc => {
        bounds.extend([loc.longitude, loc.latitude]);
      });

      const isMobile = window.innerWidth < 768;
      const padding = isMobile ? { top: 100, bottom: 150, left: 50, right: 50 } : { top: 100, bottom: 100, left: 400, right: 50 };

      map.current.fitBounds(bounds, {
        padding,
        maxZoom: 18,
        duration: 750,
      });
    }
  }, [locations, mapLoaded]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20 rounded-lg pointer-events-none">
          <div className="text-center">
            <div className="animate-spin mb-2">🗺️</div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}

      <div
        ref={mapContainer}
        className="w-full h-full relative"
        style={{
          minHeight: '400px',
          position: 'relative',
        }}
      />

      {/* Mobile-specific UI hint */}
      {locations.length === 0 && mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center text-gray-400">
            <p className="text-lg mb-2">📍</p>
            <p className="text-sm">Waiting for rescuer locations...</p>
          </div>
        </div>
      )}

      {/* Mobile zoom hint */}
      <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-lg text-xs text-gray-600 lg:hidden pointer-events-none shadow-md z-10">
        Use two fingers to rotate
      </div>

      {/* Route info card */}
      {routeData && showRoute && (
        <div className="absolute top-2 right-11 bg-white rounded-lg shadow-lg p-4 max-w-xs z-20">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-sm">📍 Route to SOS</h3>
            <button
              onClick={() => handleToggleRoute()}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              title="Close"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-semibold text-gray-900">
                {(routeData.distance / 1000).toFixed(2)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Est. Time:</span>
              <span className="font-semibold text-gray-900">
                {Math.round(routeData.duration / 60)} min
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
            Shortest driving route via Mapbox
          </div>
        </div>
      )}

      {/* Show Route Button */}
      {!(routeData && showRoute) && (
        <button
          onClick={handleToggleRoute}
          disabled={loadingRoute || locations.length < 2}
          className={`absolute top-4 right-11 z-20 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            showRoute
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Show shortest path to SOS"
        >
          {loadingRoute ? (
            <>
              <span className="inline-block animate-spin">⟳</span>
              Calculating...
            </>
          ) : (
            <>
              <span>🛣️</span>
              {showRoute ? 'Hide Route' : 'Show Route'}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default RescuerMap;
