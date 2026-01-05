'use client';

import React, { useState } from 'react';
import { useSetup } from '@/context/SetupContext';
import { createDepartment, updateDepartment, deleteDepartment } from '@/lib/api/setupEndpoints';
import { Alert } from '@/components/shared/Alert';
import StepContainer from '../StepContainer';
import MapSelector from '@/components/admin/setup/MapSelector';
import { Department } from '@/types';

export default function DepartmentsStep() {
  const { cityCode, cityData, departments, advanceStep, refetchSetupData, isLoading } = useSetup();
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    handlesIncidentTypes: '',
    sosCapable: true,
    contactNumber: '',
    address: '',
    lat: cityData?.centerLocation?.lat || 14.5994,
    lng: cityData?.centerLocation?.lng || 121.0122,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiredIncidentTypes = [
    'fire',
    'flood',
    'earthquake',
    'accident',
    'medical',
    'crime',
    'other',
  ];

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

  const handleMapClick = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      lat,
      lng,
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!cityCode || !cityData) {
        throw new Error('City information not available');
      }

      const incidentTypes = formData.handlesIncidentTypes
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      if (incidentTypes.length === 0) {
        throw new Error('Please select at least one incident type');
      }

      if (!validatePhilippinePhoneNumber(formData.contactNumber)) {
        throw new Error('Please enter a valid Philippine phone number (e.g., 09XX-XXXX-XXXX or 02-XXXX-XXXX)');
      }

      const res = await createDepartment(cityCode, {
        code: formData.code,
        name: formData.name,
        handlesIncidentTypes: incidentTypes,
        sosCapable: formData.sosCapable,
        contactNumber: formData.contactNumber,
        address: formData.address,
        location: {
          lat: formData.lat,
          lng: formData.lng,
        },
        cityCode: cityCode,
        cityId: cityData.cityId,
      });

      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to create department');
      }

      // Reset form
      setFormData({
        code: '',
        name: '',
        handlesIncidentTypes: '',
        sosCapable: true,
        contactNumber: '',
        address: '',
        lat: 0,
        lng: 0,
      });
      setIsAddingDept(false);

      // Refresh data
      await refetchSetupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!confirm('Are you sure you want to delete this department?')) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await deleteDepartment(deptId);

      if (!res.success) {
        throw new Error('Failed to delete department');
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

    if (departments.length === 0) {
      setError('Please add at least one department');
      return;
    }

    try {
      await advanceStep('SOS_HQ');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance');
    }
  };

  return (
    <StepContainer
      title="Departments"
      description="Add departments that will handle incidents and SOS requests"
    >
      {error && <Alert type="error" title="Error" message={error} />}

      {/* Departments List */}
      {departments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Added Departments</h3>
          <div className="space-y-3">
            {departments.map((dept) => (
              <div
                key={dept._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{dept.name}</h4>
                  <p className="text-sm text-gray-600">
                    Code: {dept.code} • Types: {dept.handlesIncidentTypes.join(', ')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Contact: {dept.contactNumber} • Address: {dept.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    Location: {dept.location.lat.toFixed(4)}, {dept.location.lng.toFixed(4)}
                  </p>
                  {dept.sosCapable && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      SOS Capable
                    </span>
                  )}
                </div>
                <button
                  onClick={() => dept._id && handleDeleteDepartment(dept._id)}
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

      {/* Add Department Form */}
      {!isAddingDept ? (
        <button
          onClick={() => setIsAddingDept(true)}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
        >
          + Add Department
        </button>
      ) : (
        <form onSubmit={handleAddDepartment} className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="e.g., DRRMO, BFP"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Fire and Rescue Service"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Incident Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Types (comma-separated) <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {requiredIncidentTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const types = formData.handlesIncidentTypes
                      .split(',')
                      .map((t) => t.trim())
                      .filter((t) => t);

                    if (types.includes(type)) {
                      types.splice(types.indexOf(type), 1);
                    } else {
                      types.push(type);
                    }

                    handleInputChange('handlesIncidentTypes', types.join(', '));
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    formData.handlesIncidentTypes.includes(type)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.handlesIncidentTypes}
              onChange={(e) => handleInputChange('handlesIncidentTypes', e.target.value)}
              placeholder="fire, flood, medical, accident"
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

          {/* Location Coordinates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (Latitude & Longitude) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.lat}
                  onChange={(e) => handleInputChange('lat', parseFloat(e.target.value))}
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
                  value={formData.lng}
                  onChange={(e) => handleInputChange('lng', parseFloat(e.target.value))}
                  placeholder="e.g., 121.0122"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-4">Click on the map to set the department location</p>
              <MapSelector
                lat={formData.lat}
                lng={formData.lng}
                onLocationChange={handleMapClick}
              />
            </div>
          </div>

          {/* SOS Capable */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sosCapable"
              checked={formData.sosCapable}
              onChange={(e) => handleInputChange('sosCapable', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="sosCapable" className="ml-2 text-sm text-gray-700">
              This department can handle SOS requests
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {isSubmitting ? 'Adding...' : 'Add Department'}
            </button>
            <button
              type="button"
              onClick={() => setIsAddingDept(false)}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Continue Button */}
      {departments.length > 0 && (
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
