'use client';

import { useState, useEffect, useRef } from 'react';
import { useSetup } from '@/context/SetupContext';
import { Department } from '@/types';
import { createDepartment, updateDepartment } from '@/lib/api/setupEndpoints';

declare global {
  interface Window {
    L: any;
  }
}

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  department?: Department | null;
  cityCode: string;
  cityId: string;
}

export function DepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  department,
  cityCode,
  cityId,
}: DepartmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactNumber: '',
    address: '',
    latitude: 0,
    longitude: 0,
  });

  // Initialize form with existing data if editing
  useEffect(() => {
    if (department) {
      setFormData({
        code: department.code,
        name: department.name,
        contactNumber: department.contactNumber || '',
        address: department.address || '',
        latitude: department.location?.lat || 0,
        longitude: department.location?.lng || 0,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        contactNumber: '',
        address: '',
        latitude: 0,
        longitude: 0,
      });
    }
    setError(null);
  }, [department, isOpen]);

  // Initialize and manage map
  useEffect(() => {
    if (!isOpen) return;

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
      if (!containerRef.current || mapInstanceRef.current) return;

      const L = window.L;

      // Get initial location
      const initialLat = formData.latitude || 14.5995;
      const initialLng = formData.longitude || 120.9842;

      // Create map
      mapInstanceRef.current = L.map(containerRef.current).setView([initialLat, initialLng], 13);

      // Ensure map has proper dimensions
      mapInstanceRef.current.invalidateSize();

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Add marker for current location if set
      if (initialLat !== 0 && initialLng !== 0 && (initialLat !== 14.5995 || initialLng !== 120.9842 || department)) {
        // Add marker
        markerRef.current = L.marker([initialLat, initialLng], {
          draggable: true,
        }).addTo(mapInstanceRef.current);

        markerRef.current.on('dragend', () => {
          const latlng = markerRef.current.getLatLng();
          setFormData((prev) => ({
            ...prev,
            latitude: latlng.lat,
            longitude: latlng.lng,
          }));
        });

        // Pan to marker location
        mapInstanceRef.current.setView([initialLat, initialLng], 13);
      }

      // Handle map click to add/move marker
      mapInstanceRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;

        // Remove old marker
        if (markerRef.current) {
          mapInstanceRef.current.removeLayer(markerRef.current);
        }

        // Add new marker
        markerRef.current = L.marker([lat, lng], {
          draggable: true,
        }).addTo(mapInstanceRef.current);

        markerRef.current.on('dragend', () => {
          const latlng = markerRef.current.getLatLng();
          setFormData((prev) => ({
            ...prev,
            latitude: latlng.lat,
            longitude: latlng.lng,
          }));
        });

        // Update form data
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
      });
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.contactNumber || !formData.address) {
      setError('All fields are required');
      return;
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      setError('Please select a location on the map');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const payload = {
        code: formData.code,
        name: formData.name,
        contactNumber: formData.contactNumber,
        address: formData.address,
        location: {
          lat: formData.latitude,
          lng: formData.longitude,
        },
        handlesIncidentTypes: ['fire', 'flood', 'earthquake', 'accident', 'medical', 'crime'],
        sosCapable: true,
        cityCode,
        cityId,
      };

      let response;
      if (department?._id) {
        response = await updateDepartment(department._id, payload);
      } else {
        response = await createDepartment(cityCode, payload);
      }

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to save department');
      }

      setFormData({
        code: '',
        name: '',
        contactNumber: '',
        address: '',
        latitude: 0,
        longitude: 0,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {department ? 'Edit Department' : 'Add New Department'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Code and Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., FIRE"
                required
                disabled={!!department}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Fire Department"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Contact Number and Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="e.g., +63-2-XXXX-XXXX"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 123 Main Street"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Map Container */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Location on Map <span className="text-red-500">*</span>
            </label>
            <div className="rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
              <div ref={containerRef} className="w-full h-96" style={{ position: 'relative' }} />
              <div className="bg-gray-50 px-4 py-3 text-xs text-gray-600 border-t">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Click on map to select location • Drag marker to adjust position</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location Coordinates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (Latitude & Longitude) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  placeholder="e.g., 14.5994"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  placeholder="e.g., 121.0122"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {isLoading ? 'Saving...' : department ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
