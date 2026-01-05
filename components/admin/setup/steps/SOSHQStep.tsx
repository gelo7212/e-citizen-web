'use client';

import React, { useState } from 'react';
import { useSetup } from '@/context/SetupContext';
import {
  createSOSHQ,
  updateSOSHQ,
  deleteSOSHQ,
  activateSOSHQ,
} from '@/lib/api/setupEndpoints';
import { Alert } from '@/components/shared/Alert';
import MapSelector from '@/components/admin/setup/MapSelector';
import StepContainer from '../StepContainer';
import { SOSHQData } from '@/types';

export default function SOSHQStep() {
  const { cityCode, cityData, departments, sosHQList, advanceStep, refetchSetupData, isLoading } =
    useSetup();
  const [isAddingHQ, setIsAddingHQ] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    lat: cityData?.centerLocation?.lat || 14.5994,
    lng: cityData?.centerLocation?.lng || 121.0122,
    coverageRadiusKm: 15,
    supportedDepartmentCodes: [] as string[],
    contactNumber: '',
    address: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePhilippinePhoneNumber = (phone: string): boolean => {
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Mobile number: +639XXXXXXXXX or 09XXXXXXXXX (11 digits)
    const mobileRegex = /^(?:\+639|\+63-9|09)\d{9}$/;
    
    // Landline: +6322XXXXXXXX or 022XXXXXXXX (8-10 digits after 02)
    const landlineRegex = /^(?:\+6322|\+63-2|022|02)\d{6,8}$/;
    
    // Check if it matches either pattern
    return mobileRegex.test(cleaned) || landlineRegex.test(cleaned);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDepartmentToggle = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      supportedDepartmentCodes: prev.supportedDepartmentCodes.includes(code)
        ? prev.supportedDepartmentCodes.filter((c) => c !== code)
        : [...prev.supportedDepartmentCodes, code],
    }));
  };

  const handleMapClick = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      lat,
      lng,
    }));
  };

  const handleAddSOSHQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!cityCode || !cityData) {
        throw new Error('City information not available');
      }

      if (formData.supportedDepartmentCodes.length === 0) {
        throw new Error('Please select at least one department');
      }

      if (!validatePhilippinePhoneNumber(formData.contactNumber)) {
        throw new Error('Please enter a valid Philippine phone number (e.g., 09XX-XXXX-XXXX or 02-XXXX-XXXX)');
      }

      const res = await createSOSHQ(cityCode, {
        scopeLevel: 'CITY',
        cityCode: cityCode,
        cityId: cityData.cityId,
        name: formData.name,
        location: {
          lat: formData.lat,
          lng: formData.lng,
        },
        coverageRadiusKm: formData.coverageRadiusKm,
        supportedDepartmentCodes: formData.supportedDepartmentCodes,
        contactNumber: formData.contactNumber,
        address: formData.address,
        isMain: true,
        isTemporary: false,
      });

      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to create SOS HQ');
      }

      // Activate the SOS HQ
      if (res.data?._id) {
        const activateRes = await activateSOSHQ(res.data._id);
        if (!activateRes.success) {
          throw new Error('Failed to activate SOS HQ');
        }
      }

      // Reset form
      setFormData({
        name: '',
        lat: 0,
        lng: 0,
        coverageRadiusKm: 15,
        supportedDepartmentCodes: [],
        contactNumber: '',
        address: '',
      });
      setIsAddingHQ(false);

      // Refresh data
      await refetchSetupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSOSHQ = async (hqId: string) => {
    if (!confirm('Are you sure you want to delete this SOS HQ?')) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await deleteSOSHQ(hqId);

      if (!res.success) {
        throw new Error('Failed to delete SOS HQ');
      }

      await refetchSetupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    setError(null);

    // Check if at least one main SOS HQ exists and is active
    const mainHQ = sosHQList.find((hq) => hq.isMain && hq.isActive);
    if (!mainHQ) {
      setError('Please create and activate a main SOS HQ');
      return;
    }

    try {
      await advanceStep('SETTINGS');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance');
    }
  };

  return (
    <StepContainer
      title="SOS Headquarters"
      description="Set up at least one main SOS HQ to handle emergency requests"
    >
      {error && <Alert type="error" title="Error" message={error} />}

      {/* SOS HQ List */}
      {sosHQList.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SOS Headquarters</h3>
          <div className="space-y-3">
            {sosHQList.map((hq) => (
              <div
                key={hq._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{hq.name}</h4>
                    {hq.isMain && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Main
                      </span>
                    )}
                    {hq.isActive && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Contact: {hq.contactNumber} • Address: {hq.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    Location: {hq.location.lat.toFixed(4)}, {hq.location.lng.toFixed(4)} •
                    Coverage: {hq.coverageRadiusKm}km
                  </p>
                  <p className="text-sm text-gray-600">
                    Departments: {hq.supportedDepartmentCodes.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => hq._id && handleDeleteSOSHQ(hq._id)}
                  disabled={isSubmitting}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:text-gray-400"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add SOS HQ Form */}
      {!isAddingHQ ? (
        <button
          onClick={() => setIsAddingHQ(true)}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
        >
          + Add SOS HQ
        </button>
      ) : (
        <form onSubmit={handleAddSOSHQ} className="space-y-6 p-4 bg-gray-50 rounded-lg">
          {/* Map Section */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">SOS HQ Location</h3>
            <p className="text-sm text-gray-600 mb-3">
              Search for a place using the search box on the map, click to set location, or drag the marker to adjust it.
            </p>
            <MapSelector
              lat={formData.lat}
              lng={formData.lng}
              onLocationChange={handleMapClick}
              selectedMunicipal={null}
              radiusKm={formData.coverageRadiusKm}
            />

            {/* Coverage Radius with Slider - Below Map */}
            <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <label className="block text-sm font-semibold text-gray-900">
                    Coverage Radius
                  </label>
                </div>
                <span className="text-lg font-bold text-blue-600 bg-white px-4 py-2 rounded-lg shadow-sm">
                  {formData.coverageRadiusKm} km
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={formData.coverageRadiusKm}
                onChange={(e) => handleInputChange('coverageRadiusKm', parseInt(e.target.value))}
                className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2 px-1 font-medium">
                <span>1 km</span>
                <span>50 km</span>
              </div>
              <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <strong>Real-time Coverage Visualization:</strong> The blue circle on the map shows the service coverage area. Drag the slider to adjust the radius.
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SOS HQ Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Main SOS HQ Calumpit"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              placeholder="e.g., +63-2-123-4567"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="e.g., 123 Main Street, City, Province"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Coordinates Display (Read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="text"
                value={formData.lat.toFixed(4)}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="text"
                value={formData.lng.toFixed(4)}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Departments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supported Departments <span className="text-red-500">*</span>
            </label>
            {departments.length === 0 ? (
              <p className="text-sm text-red-600">No departments available. Please complete the departments step first.</p>
            ) : (
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {departments.map((dept) => (
                    <button
                      key={dept._id}
                      type="button"
                      onClick={() => handleDepartmentToggle(dept.code)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.supportedDepartmentCodes.includes(dept.code)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {dept.name} ({dept.code})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || departments.length === 0 || formData.supportedDepartmentCodes.length === 0}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              title={formData.supportedDepartmentCodes.length === 0 ? 'Please select at least one department' : ''}
            >
              {isSubmitting ? 'Adding...' : 'Add SOS HQ'}
            </button>
            <button
              type="button"
              onClick={() => setIsAddingHQ(false)}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Continue Button */}
      {sosHQList.some((hq) => hq.isMain && hq.isActive) && (
        <div className="flex justify-end gap-4 pt-6 mt-8 border-t">
          <button
            onClick={handleContinue}
            disabled={isSubmitting || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </StepContainer>
  );
}
