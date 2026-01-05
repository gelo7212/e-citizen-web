'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createCity, initializeSetup } from '@/lib/api/setupEndpoints';
import { getProvinces, getMunicipalities, geocodeMunicipality, type Province, type Municipality } from '@/lib/api/geoEndpoints';
import { Alert } from '@/components/shared/Alert';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import MapSelector from '@/components/admin/setup/MapSelector';

export default function CreateCityPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    cityCode: '',
    name: '',
    provinceCode: '',
    centerLocation: { lat: 14.5994, lng: 121.0122 }, // Default to Philippines center
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>('');
  const [selectedMunicipal, setSelectedMunicipal] = useState<Municipality | null>(null);
  const [searchProvince, setSearchProvince] = useState<string>('');
  const [searchCity, setSearchCity] = useState<string>('');
  const [showProvinceDropdown, setShowProvinceDropdown] = useState<boolean>(false);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load municipalities when province changes
  useEffect(() => {
    if (selectedProvinceName) {
      loadMunicipalities(selectedProvinceName);
    } else {
      setMunicipalities([]);
    }
  }, [selectedProvinceName]);

  const loadProvinces = async () => {
    try {
      setIsLoadingGeo(true);
      const res = await getProvinces();
      if (res.success && res.data) {
        setProvinces(res.data);
      }
    } catch (err) {
      console.error('Error loading provinces:', err);
    } finally {
      setIsLoadingGeo(false);
    }
  };

  const loadMunicipalities = async (provinceName: string) => {
    try {
      setIsLoadingGeo(true);
      const res = await getMunicipalities(provinceName);
      if (res.success && res.data) {
        setMunicipalities(res.data);
      }
    } catch (err) {
      console.error('Error loading municipalities:', err);
    } finally {
      setIsLoadingGeo(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      centerLocation: { lat, lng },
    }));
  };

  const handleSelectMunicipality = async (mun: Municipality) => {
    setSearchCity('');
    setShowCityDropdown(false);

    // Fetch coordinates from Mapbox
    const coordinates = await geocodeMunicipality(mun.name, selectedProvinceName);
    console.log('Mapbox geocoding result for', mun.name, ':', coordinates);
    
    // Update selectedMunicipal with coordinates for map
    const munWithCoordinates = coordinates 
      ? { ...mun, lat: coordinates.lat, lng: coordinates.lng }
      : mun;
    
    console.log('Setting selectedMunicipal with:', munWithCoordinates);
    setSelectedMunicipal(munWithCoordinates);
    
    // Update form data
    setFormData((prev) => ({
      ...prev,
      cityCode: mun.code,
      name: mun.name,
      provinceCode: mun.province,
      centerLocation: coordinates || prev.centerLocation,
    }));
  };

  // Filter provinces based on search
  const filteredProvinces = provinces.filter((prov) =>
    prov.name.toLowerCase().includes(searchProvince.toLowerCase()) ||
    prov.code.toLowerCase().includes(searchProvince.toLowerCase())
  );

  // Filter municipalities based on search
  const filteredMunicipalities = municipalities.filter((mun) =>
    mun.name.toLowerCase().includes(searchCity.toLowerCase()) ||
    mun.code.toLowerCase().includes(searchCity.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.cityCode.trim()) {
        throw new Error('City/Municipality is required');
      }
      if (!formData.name.trim()) {
        throw new Error('City name is required');
      }
      if (!formData.provinceCode.trim()) {
        throw new Error('Province is required');
      }
      if (formData.centerLocation.lat === undefined || formData.centerLocation.lng === undefined) {
        throw new Error('City center location is required');
      }

      // Create city with the _id from the geo API as cityId
      const createRes = await createCity({
        cityCode: formData.cityCode.toUpperCase().trim(),
        cityId: selectedMunicipal?._id, // Get _id from geo API
        name: formData.name.trim(),
        provinceCode: formData.provinceCode.toUpperCase().trim(),
        centerLocation: formData.centerLocation,
      });

      if (!createRes.success) {
        throw new Error(createRes.error?.message || 'Failed to create city');
      }

      const cityCode = createRes.data?.cityCode;
      const cityId = createRes.data?.cityId;
      if (!cityCode || !cityId) {
        throw new Error('City code or ID not returned from server');
      }

      // Initialize setup with both cityCode and cityId
      const initRes = await initializeSetup(cityCode, user.id);

      if (!initRes.success) {
        throw new Error('Failed to initialize setup');
      }

      console.log('City created successfully with ID:', cityId);
      
      // Redirect to setup wizard
      router.push('/admin/setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check auth
  if (authLoading) {
    return <LoadingSkeleton />;
  }

  if (!user || user.role !== 'city_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <Alert
          type="error"
          title="Unauthorized"
          message="You must be logged in as a City Admin"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Your City</h1>
          <p className="text-gray-600">
            Register your city to begin the setup process
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6">
              <Alert type="error" title="Error" message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Province and Municipality Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Province Searchable */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Search or select province..."
                  value={selectedProvinceName || searchProvince}
                  onChange={(e) => {
                    setSearchProvince(e.target.value);
                    setSelectedProvinceName('');
                    setShowProvinceDropdown(true);
                  }}
                  onFocus={() => setShowProvinceDropdown(true)}
                  disabled={isLoadingGeo}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  required
                />
                
                {/* Province Dropdown */}
                {showProvinceDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredProvinces.length > 0 ? (
                      filteredProvinces.map((prov) => (
                        <button
                          key={prov.code}
                          type="button"
                          onClick={() => {
                            setSelectedProvinceName(prov.name);
                            setSearchProvince('');
                            setShowProvinceDropdown(false);
                            setSelectedMunicipal(null);
                            setSearchCity('');
                            setMunicipalities([]);
                            loadMunicipalities(prov.name);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-200 last:border-b-0 text-sm"
                        >
                          <div className="font-medium text-gray-900">{prov.name}</div>
                          <div className="text-xs text-gray-500">{prov.code} • {prov.region}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No provinces found
                      </div>
                    )}
                  </div>
                )}
                
                {selectedProvinceName && (
                  <p className="mt-2 text-sm text-green-600">✓ {selectedProvinceName} selected</p>
                )}
              </div>

              {/* City/Municipality Searchable */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City/Municipality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Search or select city..."
                  value={selectedMunicipal?.name || searchCity}
                  onChange={(e) => {
                    setSearchCity(e.target.value);
                    setSelectedMunicipal(null);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => selectedProvinceName && setShowCityDropdown(true)}
                  disabled={!selectedProvinceName || isLoadingGeo}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 cursor-not-allowed"
                  required
                />
                
                {/* City Dropdown */}
                {showCityDropdown && selectedProvinceName && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredMunicipalities.length > 0 ? (
                      filteredMunicipalities.map((mun) => (
                        <button
                          key={mun.code}
                          type="button"
                          onClick={() => handleSelectMunicipality(mun)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-200 last:border-b-0 text-sm"
                        >
                          <div className="font-medium text-gray-900">{mun.name}</div>
                          <div className="text-xs text-gray-500">{mun.code} • {mun.type} • District {mun.district}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        {isLoadingGeo ? 'Loading cities...' : 'No cities found'}
                      </div>
                    )}
                  </div>
                )}
                
                {selectedMunicipal && (
                  <p className="mt-2 text-sm text-green-600">✓ {selectedMunicipal.name} selected</p>
                )}
              </div>
            </div>

            {/* Auto-filled fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* City Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City Code
                </label>
                <input
                  type="text"
                  value={formData.cityCode}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500">Auto-filled from selection</p>
              </div>

              {/* City Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500">Auto-filled from selection</p>
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-4">Select City Center on Map</h3>
              <p className="text-sm text-gray-600 mb-4">
                The map will automatically center on your selected city. You can adjust the marker by dragging or clicking on the map.
              </p>
              <MapSelector
                lat={formData.centerLocation.lat}
                lng={formData.centerLocation.lng}
                onLocationChange={handleMapClick}
                selectedMunicipal={selectedMunicipal}
              />
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoadingGeo}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isSubmitting ? 'Creating City...' : 'Create City & Start Setup'}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Need help?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Search and select your province from the dropdown</li>
              <li>• Search and select your city/municipality from the dropdown</li>
              <li>• The map will automatically center on your city with coordinates from Mapbox</li>
              <li>• Adjust the marker by dragging it or clicking on the map if needed</li>
              <li>• Click "Create City & Start Setup" to proceed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
