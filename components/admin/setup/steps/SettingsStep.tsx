'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSetup } from '@/context/SetupContext';
import { updateCityConfig } from '@/lib/api/setupEndpoints';
import { Alert } from '@/components/shared/Alert';
import StepContainer from '../StepContainer';

export default function SettingsStep() {
  const router = useRouter();
  const { cityCode, cityConfig, advanceStep, isLoading } = useSetup();

  const [formData, setFormData] = useState({
    // Incident rules
    allowAnonymous: cityConfig?.incident.allowAnonymous ?? true,
    allowOutsideCityReports: cityConfig?.incident.allowOutsideCityReports ?? false,
    autoAssignDepartment: cityConfig?.incident.autoAssignDepartment ?? true,
    requireCityVerificationForResolve:
      cityConfig?.incident.requireCityVerificationForResolve ?? true,

    // SOS rules
    allowAnywhere: cityConfig?.sos.allowAnywhere ?? true,
    autoAssignNearestHQ: cityConfig?.sos.autoAssignNearestHQ ?? true,
    escalationMinutes: cityConfig?.sos.escalationMinutes ?? 10,
    allowProvinceFallback: cityConfig?.sos.allowProvinceFallback ?? true,

    // Visibility
    showIncidentsOnPublicMap: cityConfig?.visibility.showIncidentsOnPublicMap ?? true,
    showResolvedIncidents: cityConfig?.visibility.showResolvedIncidents ?? true,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckboxChange = (field: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumberChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!cityCode) {
        throw new Error('City code not found');
      }

      // Update config
      const res = await updateCityConfig(cityCode, {
        incident: {
          allowAnonymous: formData.allowAnonymous,
          allowOutsideCityReports: formData.allowOutsideCityReports,
          autoAssignDepartment: formData.autoAssignDepartment,
          requireCityVerificationForResolve: formData.requireCityVerificationForResolve,
        },
        sos: {
          allowAnywhere: formData.allowAnywhere,
          autoAssignNearestHQ: formData.autoAssignNearestHQ,
          escalationMinutes: formData.escalationMinutes,
          allowProvinceFallback: formData.allowProvinceFallback,
        },
        visibility: {
          showIncidentsOnPublicMap: formData.showIncidentsOnPublicMap,
          showResolvedIncidents: formData.showResolvedIncidents,
        },
      });

      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to update config');
      }

      // Complete setup
      await advanceStep('COMPLETED');

      // Redirect to dashboard
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StepContainer
      title="City Configuration"
      description="Configure rules and settings for your city"
    >
      {error && <Alert type="error" title="Error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Incident Rules Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Rules</h3>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowAnonymous"
                checked={formData.allowAnonymous}
                onChange={(e) => handleCheckboxChange('allowAnonymous', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="allowAnonymous" className="ml-3">
                <span className="font-medium text-gray-900">Allow Anonymous Reports</span>
                <p className="text-sm text-gray-600">
                  Citizens can report incidents without providing their identity
                </p>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowOutsideCityReports"
                checked={formData.allowOutsideCityReports}
                onChange={(e) =>
                  handleCheckboxChange('allowOutsideCityReports', e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="allowOutsideCityReports" className="ml-3">
                <span className="font-medium text-gray-900">Allow Reports from Outside City</span>
                <p className="text-sm text-gray-600">
                  Accept incident reports from people outside the city boundaries
                </p>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoAssignDepartment"
                checked={formData.autoAssignDepartment}
                onChange={(e) => handleCheckboxChange('autoAssignDepartment', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="autoAssignDepartment" className="ml-3">
                <span className="font-medium text-gray-900">Auto Assign Department</span>
                <p className="text-sm text-gray-600">
                  System automatically assigns incidents to appropriate departments
                </p>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireCityVerification"
                checked={formData.requireCityVerificationForResolve}
                onChange={(e) =>
                  handleCheckboxChange('requireCityVerificationForResolve', e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="requireCityVerification" className="ml-3">
                <span className="font-medium text-gray-900">Require City Verification</span>
                <p className="text-sm text-gray-600">
                  City admin must verify incident resolution before closure
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* SOS Rules Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SOS Request Rules</h3>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowAnywhere"
                checked={formData.allowAnywhere}
                onChange={(e) => handleCheckboxChange('allowAnywhere', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="allowAnywhere" className="ml-3">
                <span className="font-medium text-gray-900">Allow SOS from Anywhere</span>
                <p className="text-sm text-gray-600">
                  Citizens can trigger SOS from outside city boundaries
                </p>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoAssignNearestHQ"
                checked={formData.autoAssignNearestHQ}
                onChange={(e) => handleCheckboxChange('autoAssignNearestHQ', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="autoAssignNearestHQ" className="ml-3">
                <span className="font-medium text-gray-900">Auto Assign Nearest HQ</span>
                <p className="text-sm text-gray-600">
                  System automatically routes SOS to the nearest headquarters
                </p>
              </label>
            </div>

            <div>
              <label htmlFor="escalationMinutes" className="block font-medium text-gray-900 mb-2">
                SOS Escalation Time (minutes)
              </label>
              <input
                type="number"
                id="escalationMinutes"
                min="1"
                value={formData.escalationMinutes}
                onChange={(e) => handleNumberChange('escalationMinutes', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-1">
                Time before SOS is escalated to higher authority
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowProvinceFallback"
                checked={formData.allowProvinceFallback}
                onChange={(e) => handleCheckboxChange('allowProvinceFallback', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="allowProvinceFallback" className="ml-3">
                <span className="font-medium text-gray-900">Allow Province Fallback</span>
                <p className="text-sm text-gray-600">
                  Allow escalation to provincial SOS if city HQ is unavailable
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Visibility Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Visibility Settings</h3>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showIncidentsOnPublicMap"
                checked={formData.showIncidentsOnPublicMap}
                onChange={(e) =>
                  handleCheckboxChange('showIncidentsOnPublicMap', e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="showIncidentsOnPublicMap" className="ml-3">
                <span className="font-medium text-gray-900">Show Incidents on Public Map</span>
                <p className="text-sm text-gray-600">
                  Public citizens can see incident locations on the city map
                </p>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showResolvedIncidents"
                checked={formData.showResolvedIncidents}
                onChange={(e) => handleCheckboxChange('showResolvedIncidents', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="showResolvedIncidents" className="ml-3">
                <span className="font-medium text-gray-900">Show Resolved Incidents</span>
                <p className="text-sm text-gray-600">
                  Include resolved incidents in public reports and history
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-8 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {isSubmitting ? 'Completing Setup...' : 'Complete Setup'}
          </button>
        </div>
      </form>
    </StepContainer>
  );
}
