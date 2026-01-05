'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  SetupStep,
  SetupStatus,
  CitySetupData,
  Department,
  SOSHQData,
  CityConfig,
} from '@/types';
import {
  getSetupStatus,
  getCityByCode,
  getDepartmentsByCity,
  getSOSHQByCity,
  getCityConfig,
} from '@/lib/api/setupEndpoints';
import { useAuth } from '@/hooks/useAuth';

interface SetupContextType {
  // State
  cityCode: string | null;
  cityId: string | null;
  setupStatus: SetupStatus | null;
  cityData: CitySetupData | null;
  departments: Department[];
  sosHQList: SOSHQData[];
  cityConfig: CityConfig | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeSetup: (cityCode: string) => Promise<void>;
  resumeSetup: (cityCode: string) => Promise<void>;
  advanceStep: (step: SetupStep) => Promise<void>;
  isSetupComplete: () => boolean;
  getCurrentStepNumber: () => number;
  refetchSetupData: () => Promise<void>;
}

const SetupContext = createContext<SetupContextType | undefined>(undefined);

export function SetupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cityCode, setCityCode] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [cityData, setCityData] = useState<CitySetupData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sosHQList, setSOSHQList] = useState<SOSHQData[]>([]);
  const [cityConfig, setCityConfig] = useState<CityConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load setup data for a city
  const refetchSetupData = useCallback(async () => {
    if (!cityCode) return;

    setIsLoading(true);
    setError(null);

    try {
      const [statusRes, cityRes, deptsRes, sosRes, configRes] = await Promise.all([
        getSetupStatus(cityCode),
        getCityByCode(cityCode),
        getDepartmentsByCity(cityCode),
        getSOSHQByCity(cityCode),
        getCityConfig(cityCode),
      ]);

      if (statusRes.success && statusRes.data) {
        setSetupStatus(statusRes.data);
      }
      if (cityRes.success && cityRes.data) {
        setCityData(cityRes.data);
        // Extract and set cityId from the API response
        if (cityRes.data._id) {
          setCityId(cityRes.data._id);
        }
      }
      if (deptsRes.success && deptsRes.data) {
        setDepartments(deptsRes.data);
      }
      if (sosRes.success && sosRes.data) {
        setSOSHQList(sosRes.data);
      }
      if (configRes.success && configRes.data) {
        setCityConfig(configRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load setup data');
    } finally {
      setIsLoading(false);
    }
  }, [cityCode]);

  // Initialize setup for a new city
  const initializeSetup = useCallback(
    async (code: string) => {
      setCityCode(code);
      setIsLoading(true);
      setError(null);

      try {
        // First set the city code
        setCityCode(code);

        // Then fetch the data
        await refetchSetupData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize setup');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refetchSetupData]
  );

  // Resume setup from where it was left
  const resumeSetup = useCallback(
    async (code: string) => {
      setCityCode(code);
      setIsLoading(true);
      setError(null);

      try {
        // Check if city exists and get setup status
        const statusRes = await getSetupStatus(code);

        if (!statusRes.success) {
          throw new Error('Failed to load setup status. City may not exist.');
        }

        setSetupStatus(statusRes.data || null);

        // Load all related data
        const [cityRes, deptsRes, sosRes, configRes] = await Promise.all([
          getCityByCode(code),
          getDepartmentsByCity(code),
          getSOSHQByCity(code),
          getCityConfig(code),
        ]);

        if (cityRes.success && cityRes.data) {
          setCityData(cityRes.data);
          // Extract and set cityId from the API response
          if (cityRes.data._id) {
            setCityId(cityRes.data._id);
          }
        }
        if (deptsRes.success && deptsRes.data) {
          setDepartments(deptsRes.data);
        }
        if (sosRes.success && sosRes.data) {
          setSOSHQList(sosRes.data);
        }
        if (configRes.success && configRes.data) {
          setCityConfig(configRes.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resume setup');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Advance to next step
  const advanceStep = useCallback(
    async (step: SetupStep) => {
      if (!cityCode) {
        throw new Error('City code not set');
      }

      setIsLoading(true);
      setError(null);

      try {
        const { updateSetupStep } = await import('@/lib/api/setupEndpoints');
        const res = await updateSetupStep(cityCode, step);

        if (!res.success) {
          throw new Error('Failed to advance setup step');
        }

        setSetupStatus(res.data?.setup || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to advance step');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [cityCode]
  );

  // Check if setup is complete
  const isSetupComplete = useCallback(() => {
    return setupStatus?.currentStep === 'COMPLETED';
  }, [setupStatus]);

  // Get current step number (0-indexed, or 4 if complete)
  const getCurrentStepNumber = useCallback(() => {
    const steps: SetupStep[] = ['CITY_PROFILE', 'DEPARTMENTS', 'SOS_HQ', 'SETTINGS', 'COMPLETED'];
    return steps.indexOf(setupStatus?.currentStep || 'CITY_PROFILE');
  }, [setupStatus]);

  const value: SetupContextType = {
    cityCode,
    cityId,
    setupStatus,
    cityData,
    departments,
    sosHQList,
    cityConfig,
    isLoading,
    error,
    initializeSetup,
    resumeSetup,
    advanceStep,
    isSetupComplete,
    getCurrentStepNumber,
    refetchSetupData,
  };

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
}

export function useSetup() {
  const context = useContext(SetupContext);
  if (context === undefined) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
}
