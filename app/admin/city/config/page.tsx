'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSetup } from '@/context/SetupContext';
import { getCityByCode, getCityConfig, updateCityConfig } from '@/lib/api/setupEndpoints';

export default function CityConfigPage() {
  const { user } = useAuth();
  const { cityCode, cityData } = useSetup();
  
  // Fallback to user.cityCode if context cityCode is not set
  const effectiveCityCode = cityCode || user?.cityCode;

  const [formData, setFormData] = useState({
    cityName: '',
    cityCode: '',
    province: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    description: '',
    // Config settings
    allowAnonymousIncidents: false,
    allowOutsideCityReports: false,
    autoAssignDepartment: false,
    requireCityVerificationForResolve: false,
    allowSOSAnywhere: false,
    autoAssignNearestHQ: false,
    escalationMinutes: 30,
    allowProvinceFallback: false,
    showIncidentsOnPublicMap: false,
    showResolvedIncidents: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const hasFetched = useRef(false);

  // Fetch city configuration on mount
  useEffect(() => {
    // Skip if we're already fetching or have fetched
    if (hasFetched.current || !effectiveCityCode) return;
    hasFetched.current = true;

    const fetchCityData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [cityRes, configRes] = await Promise.all([
          getCityByCode(effectiveCityCode),
          getCityConfig(effectiveCityCode),
        ]);

        if (cityRes.success && cityRes.data) {
          setFormData((prev) => ({
            ...prev,
            cityName: cityRes.data.name || '',
            cityCode: cityRes.data.cityCode || '',
            province: cityRes.data.provinceCode || '',
          }));
        }

        if (configRes.success && configRes.data) {
          const config = configRes.data;
          setFormData((prev) => ({
            ...prev,
            // Incident settings
            allowAnonymousIncidents: config.incident?.allowAnonymous || false,
            allowOutsideCityReports: config.incident?.allowOutsideCityReports || false,
            autoAssignDepartment: config.incident?.autoAssignDepartment || false,
            requireCityVerificationForResolve: config.incident?.requireCityVerificationForResolve || false,
            // SOS settings
            allowSOSAnywhere: config.sos?.allowAnywhere || false,
            autoAssignNearestHQ: config.sos?.autoAssignNearestHQ || false,
            escalationMinutes: config.sos?.escalationMinutes || 30,
            allowProvinceFallback: config.sos?.allowProvinceFallback || false,
            // Visibility settings
            showIncidentsOnPublicMap: config.visibility?.showIncidentsOnPublicMap || false,
            showResolvedIncidents: config.visibility?.showResolvedIncidents || false,
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load city configuration');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCityData();
  }, [effectiveCityCode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checkedValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: checkedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!effectiveCityCode) {
      setError('City code not found');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const configPayload = {
        incident: {
          allowAnonymous: formData.allowAnonymousIncidents,
          allowOutsideCityReports: formData.allowOutsideCityReports,
          autoAssignDepartment: formData.autoAssignDepartment,
          requireCityVerificationForResolve: formData.requireCityVerificationForResolve,
        },
        sos: {
          allowAnywhere: formData.allowSOSAnywhere,
          autoAssignNearestHQ: formData.autoAssignNearestHQ,
          escalationMinutes: formData.escalationMinutes,
          allowProvinceFallback: formData.allowProvinceFallback,
        },
        visibility: {
          showIncidentsOnPublicMap: formData.showIncidentsOnPublicMap,
          showResolvedIncidents: formData.showResolvedIncidents,
        },
      };

      const response = await updateCityConfig(effectiveCityCode, configPayload);

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to save configuration');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 admin-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-admin-900 mb-2">City Configuration</h1>
        <p className="text-admin-600">Manage city settings and operational rules</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-admin-md text-blue-700 flex items-center gap-2">
          <span className="material-icons animate-spin">refresh</span>
          <span>Loading configuration...</span>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-admin-md text-red-700">
          <div className="flex items-center gap-2">
            <span className="material-icons text-red-600">error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-admin-md text-green-700">
          <div className="flex items-center gap-2">
            <span className="material-icons text-green-600">check_circle</span>
            <span>Configuration saved successfully!</span>
          </div>
        </div>
      )}

      {!isLoading && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* City Information */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-icons text-blue-600">location_city</span>
                <h2 className="text-xl font-bold text-admin-900">City Information</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-admin-700 mb-2">
                      City Name
                    </label>
                    <input
                      type="text"
                      name="cityName"
                      value={formData.cityName}
                      onChange={handleInputChange}
                      className="admin-input"
                      placeholder="Enter city name"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-admin-700 mb-2">
                      City Code
                    </label>
                    <input
                      type="text"
                      name="cityCode"
                      value={formData.cityCode}
                      onChange={handleInputChange}
                      className="admin-input"
                      placeholder="e.g., CITY001"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-2">
                    Province Code
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="admin-input"
                    placeholder="Enter province code"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-icons text-blue-600">contact_mail</span>
                <h2 className="text-xl font-bold text-admin-900">Contact Information</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-admin-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="admin-input"
                      placeholder="contact@city.gov"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-admin-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="admin-input"
                      placeholder="+63 XXX XXXX XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                    className="admin-input"
                    placeholder="https://city.gov.ph"
                  />
                </div>
              </div>
            </div>

            {/* Incident Configuration */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-icons text-orange-600">notifications</span>
                <h2 className="text-xl font-bold text-admin-900">Incident Settings</h2>
              </div>

              <div className="space-y-4">
                {/* Toggle Items */}
                {[
                  {
                    name: 'allowAnonymousIncidents',
                    label: 'Allow Anonymous Incident Reports',
                    description: 'Citizens can report incidents without providing identification',
                  },
                  {
                    name: 'allowOutsideCityReports',
                    label: 'Allow Outside City Reports',
                    description: 'Accept incident reports from outside city boundaries',
                  },
                  {
                    name: 'autoAssignDepartment',
                    label: 'Auto-assign Department',
                    description: 'Automatically assign incidents to appropriate departments',
                  },
                  {
                    name: 'requireCityVerificationForResolve',
                    label: 'Require Verification to Resolve',
                    description: 'City admin must verify incidents before marking as resolved',
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-start justify-between p-3 hover:bg-admin-50 rounded-admin-md transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-admin-900">{item.label}</p>
                      <p className="text-xs text-admin-600 mt-1">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        name={item.name}
                        checked={formData[item.name as keyof typeof formData] as boolean}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-admin-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* SOS Configuration */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-icons text-red-600">emergency</span>
                <h2 className="text-xl font-bold text-admin-900">SOS Settings</h2>
              </div>

              <div className="space-y-4">
                {[
                  {
                    name: 'allowSOSAnywhere',
                    label: 'Allow SOS Anywhere',
                    description: 'Users can trigger SOS from outside city coverage areas',
                  },
                  {
                    name: 'autoAssignNearestHQ',
                    label: 'Auto-assign to Nearest HQ',
                    description: 'Automatically route SOS to the nearest response center',
                  },
                  {
                    name: 'allowProvinceFallback',
                    label: 'Allow Province Fallback',
                    description: 'Escalate to provincial SOS center if city center unavailable',
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-start justify-between p-3 hover:bg-admin-50 rounded-admin-md transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-admin-900">{item.label}</p>
                      <p className="text-xs text-admin-600 mt-1">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        name={item.name}
                        checked={formData[item.name as keyof typeof formData] as boolean}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-admin-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}

                <div className="border-t border-admin-200 pt-4 mt-4">
                  <label className="block text-sm font-medium text-admin-700 mb-2">
                    Escalation Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    name="escalationMinutes"
                    value={formData.escalationMinutes}
                    onChange={handleInputChange}
                    className="admin-input"
                    min="1"
                    max="180"
                  />
                  <p className="text-xs text-admin-600 mt-2">
                    Time to wait before escalating to next available SOS center
                  </p>
                </div>
              </div>
            </div>

            {/* Visibility Configuration */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-icons text-green-600">visibility</span>
                <h2 className="text-xl font-bold text-admin-900">Visibility Settings</h2>
              </div>

              <div className="space-y-4">
                {[
                  {
                    name: 'showIncidentsOnPublicMap',
                    label: 'Show Incidents on Public Map',
                    description: 'Display active incidents on the public citizen map',
                  },
                  {
                    name: 'showResolvedIncidents',
                    label: 'Show Resolved Incidents',
                    description: 'Display resolved/closed incidents in public reports',
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-start justify-between p-3 hover:bg-admin-50 rounded-admin-md transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-admin-900">{item.label}</p>
                      <p className="text-xs text-admin-600 mt-1">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        name={item.name}
                        checked={formData[item.name as keyof typeof formData] as boolean}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-admin-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="admin-btn admin-btn-primary gap-2"
              >
                <span className="material-icons">save</span>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="admin-btn admin-btn-secondary gap-2"
              >
                <span className="material-icons">refresh</span>
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1">
          {/* Quick Stats */}
          <div className="admin-card p-6 mb-6">
            <h3 className="text-lg font-bold text-admin-900 mb-4">Configuration Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-admin-600 font-medium">City Code</p>
                <p className="text-sm font-semibold text-admin-900 mt-1">{formData.cityCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-admin-600 font-medium">City Name</p>
                <p className="text-sm font-semibold text-admin-900 mt-1">{formData.cityName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-admin-600 font-medium">Updated By</p>
                <p className="text-sm font-semibold text-admin-900 mt-1">{user?.email || 'Admin'}</p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-bold text-admin-900 mb-4 flex items-center gap-2">
              <span className="material-icons">help</span>
              Configuration Guide
            </h3>
            <div className="space-y-4 text-sm text-admin-600">
              <div>
                <p className="font-semibold text-admin-700 mb-1">Incident Settings</p>
                <p>Control how incidents are reported and processed in your city.</p>
              </div>
              <div>
                <p className="font-semibold text-admin-700 mb-1">SOS Settings</p>
                <p>Configure emergency response routing and escalation policies.</p>
              </div>
              <div>
                <p className="font-semibold text-admin-700 mb-1">Visibility Settings</p>
                <p>Determine what information is visible to the public.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
