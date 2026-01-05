'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Municipality, searchSuggestions, retrieveSearchResult, SearchSuggestion } from '@/lib/api/geoEndpoints';

declare global {
  interface Window {
    L: any;
  }
}

interface MapSelectorProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
  selectedMunicipal?: Municipality | null;
  radiusKm?: number; // Optional radius in kilometers for SOS HQ visualization
}

export default function MapSelector({ lat, lng, onLocationChange, selectedMunicipal, radiusKm }: MapSelectorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [displayLat, setDisplayLat] = useState(lat);
  const [displayLng, setDisplayLng] = useState(lng);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sessionToken] = useState(() => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
  const debounceTimer = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamic import and initialization
    const initMap = async () => {
      try {
        // Only import in browser
        if (typeof window === 'undefined') return;
        
        const L = (await import('leaflet')).default;

        if (!mapContainer.current || mapInstance.current) return;

        // Create map
        mapInstance.current = L.map(mapContainer.current).setView([lat, lng], 12);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(mapInstance.current);

        // Create marker
        markerInstance.current = L.marker([lat, lng], {
          draggable: true,
        }).addTo(mapInstance.current);

        // Add radius circle if radiusKm is provided (for SOS HQ)
        if (radiusKm && radiusKm > 0) {
          radiusCircleRef.current = L.circle([lat, lng], {
            radius: radiusKm * 1000, // Convert km to meters
            color: '#3b82f6',
            fillColor: '#60a5fa',
            fillOpacity: 0.2,
            weight: 2,
          }).addTo(mapInstance.current);
        }

        // Handle marker drag
        markerInstance.current.on('dragend', (e: any) => {
          const newLat = e.target.getLatLng().lat;
          const newLng = e.target.getLatLng().lng;
          // Update radius circle position if it exists
          if (radiusCircleRef.current) {
            radiusCircleRef.current.setLatLng([newLat, newLng]);
          }
          onLocationChange(newLat, newLng);
        });

        // Handle map clicks
        mapInstance.current.on('click', (e: any) => {
          const newLat = e.latlng.lat;
          const newLng = e.latlng.lng;
          markerInstance.current.setLatLng([newLat, newLng]);
          // Update radius circle position if it exists
          if (radiusCircleRef.current) {
            radiusCircleRef.current.setLatLng([newLat, newLng]);
          }
          onLocationChange(newLat, newLng);
        });

        setIsLoaded(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, []);

  // Update marker when coordinates change externally (but don't zoom)
  useEffect(() => {
    if (markerInstance.current && isLoaded && mapInstance.current) {
      // Only update marker position, don't change zoom
      const currentZoom = mapInstance.current.getZoom();
      markerInstance.current.setLatLng([lat, lng]);
      
      // Only reset view if zoom is still at initial level (12)
      // This preserves user's custom zoom level but helps on initial load
      if (currentZoom === 12) {
        mapInstance.current.setView([lat, lng], 12);
      }
    }
    setDisplayLat(lat);
    setDisplayLng(lng);
  }, [lat, lng, isLoaded]);

  // Update radius circle when radiusKm changes (for SOS HQ)
  useEffect(() => {
    if (!mapInstance.current || !isLoaded) return;

    const L = window.L;
    if (!L) return;

    if (radiusKm && radiusKm > 0) {
      if (radiusCircleRef.current) {
        // Update existing circle radius
        radiusCircleRef.current.setRadius(radiusKm * 1000);
      } else {
        // Create new circle if it doesn't exist
        radiusCircleRef.current = L.circle([lat, lng], {
          radius: radiusKm * 1000, // Convert km to meters
          color: '#3b82f6',
          fillColor: '#60a5fa',
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(mapInstance.current);
      }
    } else if (radiusCircleRef.current) {
      // Remove circle if radius is not provided or is 0
      mapInstance.current.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }
  }, [radiusKm, isLoaded, lat, lng]);

  // When a new municipality is selected, zoom to that location
  useEffect(() => {
    if (selectedMunicipal && mapInstance.current && isLoaded) {
      // Use coordinates from Mapbox (will be in selectedMunicipal props via lat/lng)
      const targetLat = selectedMunicipal.lat || displayLat;
      const targetLng = selectedMunicipal.lng || displayLng;

      console.log('MapSelector updating for municipality:', selectedMunicipal.name, 'coordinates:', targetLat, targetLng);

      // Update marker and map view
      if (markerInstance.current) {
        markerInstance.current.setLatLng([targetLat, targetLng]);
      }
      mapInstance.current.setView([targetLat, targetLng], 13);
      
      // Note: Don't call onLocationChange here - the parent already updates formData.centerLocation
      // Calling it would create an infinite loop
    }
  }, [selectedMunicipal?.code, isLoaded]); // Use code instead of whole object to avoid dependency issues

  const handleSuggestionSearch = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    console.log('[MapSelector] Searching for:', query);
    try {
      const results = await searchSuggestions(query, sessionToken, {
        lat: displayLat,
        lng: displayLng,
      });
      console.log('[MapSelector] Got suggestions:', results);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('[MapSelector] Search suggestions error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: SearchSuggestion) => {
    try {
      setIsSearching(true);
      const result = await retrieveSearchResult(suggestion.mapbox_id, sessionToken);
      
      if (result) {
        // Update marker and map
        markerInstance.current?.setLatLng([result.lat, result.lng]);
        mapInstance.current?.setView([result.lat, result.lng], 15);
        onLocationChange(result.lat, result.lng);
        setDisplayLat(result.lat);
        setDisplayLng(result.lng);
        setSearchQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Retrieve result error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchPlace = async () => {
    if (!searchQuery.trim() || !mapInstance.current || !markerInstance.current) return;

    setIsSearching(true);
    try {
      // Use /retrieve endpoint if we have a selected suggestion, otherwise use /forward
      if (suggestions.length > 0) {
        const result = await retrieveSearchResult(suggestions[0].mapbox_id, sessionToken);
        if (result) {
          markerInstance.current.setLatLng([result.lat, result.lng]);
          mapInstance.current.setView([result.lat, result.lng], 15);
          onLocationChange(result.lat, result.lng);
          setDisplayLat(result.lat);
          setDisplayLng(result.lng);
          setSearchQuery('');
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the search (wait 300ms after user stops typing)
    if (value.trim()) {
      debounceTimer.current = setTimeout(() => {
        handleSuggestionSearch(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      
      {/* Search Box - Outside of map container */}
      <div className="bg-white rounded-lg shadow-xl border border-gray-200">
        <div className="flex items-center gap-2 p-3">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchPlace()}
            placeholder="Search for a place... (e.g., Manila, Quezon City)"
            disabled={isSearching}
            className="flex-1 px-3 py-2 border-0 rounded focus:outline-none focus:ring-0 disabled:bg-gray-100"
          />
          <button
            onClick={handleSearchPlace}
            type="button"
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-medium whitespace-nowrap"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Autocomplete suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="border-t border-gray-200 max-h-64 overflow-y-auto bg-white rounded-b-lg"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.mapbox_id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors text-sm"
              >
                <div className="font-medium text-gray-900">{suggestion.name}</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {suggestion.full_address || suggestion.place_formatted}
                </div>
                {suggestion.distance && (
                  <div className="text-xs text-gray-500 mt-1">
                    {(suggestion.distance / 1000).toFixed(1)} km away
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative w-full">
        <div
          ref={mapContainer}
          className="w-full h-80 rounded-lg border-2 border-gray-300 shadow-md"
        />
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Search:</strong> Type a place name in the search box above. 
          <strong> Drag the marker</strong> to adjust, or <strong>click the map</strong> to set a new location.
        </p>
      </div>
    </div>
  );
}
