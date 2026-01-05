'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSetup } from '@/context/SetupContext';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Alert } from '@/components/shared/Alert';
import CityProfileStep from './steps/CityProfileStep';
import DepartmentsStep from './steps/DepartmentsStep';
import SOSHQStep from './steps/SOSHQStep';
import SettingsStep from './steps/SettingsStep';
import SetupProgress from './SetupProgress';

export default function SetupWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cityCode,
    setupStatus,
    isLoading,
    error,
    resumeSetup,
    isSetupComplete,
    getCurrentStepNumber,
  } = useSetup();
  const [localError, setLocalError] = useState<string | null>(null);

  // Initialize setup resume on mount
  useEffect(() => {
    const initSetup = async () => {
      try {
        if (user?.cityCode && !cityCode) {
          await resumeSetup(user.cityCode);
        }
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Failed to load setup');
      }
    };

    initSetup();
  }, [user, cityCode, resumeSetup]);

  // Redirect if setup is complete
  useEffect(() => {
    if (setupStatus && setupStatus.currentStep === 'COMPLETED') {
      router.push('/admin/dashboard');
    }
  }, [setupStatus, router]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || localError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <Alert
          type="error"
          title="Setup Error"
          message={error || localError || 'An error occurred during setup'}
        />
      </div>
    );
  }

  if (!setupStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <Alert type="error" title="Error" message="Unable to load setup status" />
      </div>
    );
  }

  const currentStepIndex = getCurrentStepNumber();
  const steps = ['CITY_PROFILE', 'DEPARTMENTS', 'SOS_HQ', 'SETTINGS'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">City Admin Setup</h1>
          <p className="text-gray-600">
            Complete your city configuration to enable all features
          </p>
        </div>

        {/* Progress */}
        <SetupProgress currentStep={currentStepIndex} totalSteps={steps.length} />

        {/* Content */}
        <div className="mt-8">
          {setupStatus.currentStep === 'CITY_PROFILE' && <CityProfileStep />}
          {setupStatus.currentStep === 'DEPARTMENTS' && <DepartmentsStep />}
          {setupStatus.currentStep === 'SOS_HQ' && <SOSHQStep />}
          {setupStatus.currentStep === 'SETTINGS' && <SettingsStep />}
        </div>
      </div>
    </div>
  );
}
