"use client";

import { useState, useEffect, useRef } from "react";
import { SOSHQData } from "@/types";
import { createSOSHQ, updateSOSHQ } from "@/lib/api/setupEndpoints";

declare global {
  interface Window {
    L: any;
  }
}

interface SOSHQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sosHQ?: SOSHQData | null;
  cityCode: string;
  cityId: string;
  departments: string[];
}

export function SOSHQModal({
  isOpen,
  onClose,
  onSuccess,
  sosHQ,
  cityCode,
  cityId,
  departments,
}: SOSHQModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contactNumber: "",
    coverageRadiusKm: 5,
    latitude: 0,
    longitude: 0,
  });

  // Initialize form with existing data if editing
  useEffect(() => {
    if (sosHQ) {
      setFormData({
        name: sosHQ.name,
        address: sosHQ.address,
        contactNumber: sosHQ.contactNumber,
        coverageRadiusKm: sosHQ.coverageRadiusKm || 5,
        latitude: sosHQ.location?.lat || 0,
        longitude: sosHQ.location?.lng || 0,
      });
      setSelectedDepartments(sosHQ.supportedDepartmentCodes || []);
    } else {
      resetForm();
    }
  }, [sosHQ, isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      contactNumber: "",
      coverageRadiusKm: 5,
      latitude: 0,
      longitude: 0,
    });
    setSelectedDepartments([]);
    setError(null);
  };

  // Initialize and manage map
  useEffect(() => {
    if (!isOpen) return;

    const loadLeaflet = async () => {
      if (!window.L) {
        // Load Leaflet CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => {
          // Ensure Leaflet is loaded
          if (window.L) {
            initMap();
          }
        };
        document.body.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!containerRef.current || mapInstanceRef.current) return;

      const L = window.L;
      if (!L) return; // Ensure L is defined

      // Get initial location from sosHQ if editing, otherwise use formData
      const initialLat = sosHQ?.location?.lat || formData.latitude || 14.5995;
      const initialLng = sosHQ?.location?.lng || formData.longitude || 120.9842;
      const initialRadius = sosHQ?.coverageRadiusKm || formData.coverageRadiusKm || 5;

      // Create map
      mapInstanceRef.current = L.map(containerRef.current).setView(
        [initialLat, initialLng],
        13
      );

      // Ensure map has proper dimensions
      mapInstanceRef.current.invalidateSize();

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Add circle and marker for coverage area visualization
      const hasLocation = (initialLat !== 0 && initialLng !== 0 && initialLat !== 14.5995) || initialLng !== 120.9842 || sosHQ;
      
      // Add circle for coverage radius (always add for SOS HQ)
      mapRef.current = L.circle([initialLat, initialLng], {
        radius: initialRadius * 1000, // Convert km to meters
        color: "#3b82f6",
        fillColor: "#60a5fa",
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(mapInstanceRef.current);

      // Add marker on top
      markerRef.current = L.marker([initialLat, initialLng], {
        draggable: true,
      }).addTo(mapInstanceRef.current);

      if (hasLocation) {
        // Zoom map to fit the circle
        try {
          const circleLatLng = L.latLng(initialLat, initialLng);
          const circleRadius = initialRadius * 1000; // Convert km to meters
          const tempCircle = L.circle(circleLatLng, circleRadius);
          const circleBounds = tempCircle.getBounds();
          // Use setTimeout to ensure map is ready
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.fitBounds(circleBounds, { padding: [50, 50] });
            }
          }, 0);
        } catch (err) {
          // If fitBounds fails, just use the initial setView
          console.warn("fitBounds failed:", err);
        }
      }

      markerRef.current.on("dragend", () => {
        const latlng = markerRef.current.getLatLng();
        setFormData((prev) => ({
          ...prev,
          latitude: latlng.lat,
          longitude: latlng.lng,
        }));
        // Update circle position
        if (mapRef.current) {
          mapRef.current.setLatLng(latlng);
        }
      });

      // Handle map click to add/move marker
      mapInstanceRef.current.on("click", (e: any) => {
        const { lat, lng } = e.latlng;

        // Remove old marker and circle if they exist
        if (markerRef.current) {
          mapInstanceRef.current.removeLayer(markerRef.current);
        }
        if (mapRef.current) {
          mapInstanceRef.current.removeLayer(mapRef.current);
        }

        // Add new circle for the coverage radius
        mapRef.current = L.circle([lat, lng], {
          radius: formData.coverageRadiusKm * 1000,
          color: "#3b82f6",
          fillColor: "#60a5fa",
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(mapInstanceRef.current);

        // Add new marker
        markerRef.current = L.marker([lat, lng], {
          draggable: true,
        }).addTo(mapInstanceRef.current);

        markerRef.current.on("dragend", () => {
          const latlng = markerRef.current.getLatLng();
          setFormData((prev) => ({
            ...prev,
            latitude: latlng.lat,
            longitude: latlng.lng,
          }));
          // Update circle position
          if (mapRef.current) {
            mapRef.current.setLatLng(latlng);
          }
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
  }, [isOpen, sosHQ]);

  // Update circle radius when coverage radius changes
  useEffect(() => {
    if (!mapRef.current || !isOpen) return;

    mapRef.current.setRadius(formData.coverageRadiusKm * 1000); // Convert km to meters
  }, [formData.coverageRadiusKm, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (
      name === "coverageRadiusKm" ||
      name === "latitude" ||
      name === "longitude"
    ) {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDepartmentToggle = (deptCode: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptCode)
        ? prev.filter((d) => d !== deptCode)
        : [...prev, deptCode]
    );
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("SOS HQ name is required");
      return false;
    }

    if (!formData.address.trim()) {
      setError("Address is required");
      return false;
    }

    if (!formData.contactNumber.trim()) {
      setError("Contact number is required");
      return false;
    }

    if (formData.latitude === 0 && formData.longitude === 0) {
      setError("Location coordinates are required");
      return false;
    }

    if (formData.coverageRadiusKm <= 0) {
      setError("Coverage radius must be greater than 0");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        contactNumber: formData.contactNumber,
        coverageRadiusKm: formData.coverageRadiusKm,
        location: {
          lat: formData.latitude,
          lng: formData.longitude,
        },
        supportedDepartmentCodes: selectedDepartments,
        scopeLevel: "CITY" as const,
        cityCode,
        cityId,
      };

      let response;

      if (sosHQ && sosHQ._id) {
        // Update existing
        response = await updateSOSHQ(sosHQ._id, payload);
      } else {
        // Create new
        response = await createSOSHQ(cityCode, payload);
      }

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to save SOS HQ");
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const isEditing = !!sosHQ;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit SOS HQ" : "Add New SOS HQ"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  SOS HQ Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Main Fire Station"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Full address of the SOS HQ"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Contact Number */}
              <div>
                <label
                  htmlFor="contactNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contact Number *
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., +63 2 1234 5678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900">Location</h3>

              <div className="rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                <div
                  ref={containerRef}
                  className="w-full h-80"
                  style={{ position: "relative" }}
                />
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 text-sm text-gray-700 border-t border-gray-300 font-medium">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Blue Circle:</strong> Coverage radius. Click on the map to set location, drag the marker to adjust, or use the slider above to change coverage area.</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Latitude */}
                <div>
                  <label
                    htmlFor="latitude"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Latitude *
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    placeholder="e.g., 14.5995"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Longitude */}
                <div>
                  <label
                    htmlFor="longitude"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Longitude *
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    placeholder="e.g., 120.9842"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Coverage Radius with Slider */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <label
                      htmlFor="coverageRadiusKm"
                      className="block text-sm font-semibold text-gray-900"
                    >
                      Coverage Radius
                    </label>
                  </div>
                  <span className="text-lg font-bold text-blue-600 bg-white px-4 py-2 rounded-lg shadow-sm">
                    {formData.coverageRadiusKm.toFixed(1)} km
                  </span>
                </div>
                <input
                  type="range"
                  id="coverageRadiusKm"
                  name="coverageRadiusKm"
                  value={formData.coverageRadiusKm}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0.1"
                  max="50"
                  className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-2 px-1 font-medium">
                  <span>0.1 km</span>
                  <span>50 km</span>
                </div>
                <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <strong>Real-time Coverage Visualization:</strong> The blue circle on the map updates as you adjust the slider, showing the service coverage area for this SOS HQ. Drag the slider to set your desired coverage radius.
                  </p>
                </div>
              </div>
            </div>

            {/* Departments */}
            {departments.length > 0 && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Supported Departments
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {departments.map((dept) => (
                    <label
                      key={dept}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(dept)}
                        onChange={() => handleDepartmentToggle(dept)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : isEditing
                    ? "Update SOS HQ"
                    : "Add SOS HQ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
