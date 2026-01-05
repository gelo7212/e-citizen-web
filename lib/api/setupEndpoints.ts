import { fetchData, postData, updateData, deleteData, patchData } from './client';
import {
  CitySetupData,
  Department,
  SOSHQData,
  CityConfig,
  SetupStatus,
  CompleteSetup,
} from '@/types';

const CITIES_BASE = '/api/admin/cities';

/**
 * CITIES ENDPOINTS
 */

export async function listCities(filters?: { isActive?: boolean; provinceCode?: string }) {
  const params = new URLSearchParams();
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.provinceCode) params.append('provinceCode', filters.provinceCode);
  
  const query = params.toString();
  return fetchData<CitySetupData[]>(`${CITIES_BASE}${query ? `?${query}` : ''}`);
}

export async function getCityByCode(cityCode: string) {
  return fetchData<CitySetupData>(`${CITIES_BASE}/${cityCode}`);
}

/**
 * Fetch city ID by city code - extracts _id from city data
 */
export async function getCityIdByCode(cityCode: string) {
  const response = await fetchData<CitySetupData>(`${CITIES_BASE}/${cityCode}`);
  if (response.success && response.data?._id) {
    return { success: true, data: response.data._id, error: null };
  }
  return { success: false, data: null, error: response.error };
}

export async function createCity(data: Partial<CitySetupData>) {
  return postData<CitySetupData>(CITIES_BASE, data);
}

export async function updateCity(cityCode: string, data: Partial<CitySetupData>) {
  return updateData<CitySetupData>(`${CITIES_BASE}/${cityCode}`, data);
}

export async function deleteCity(cityCode: string) {
  return deleteData(`${CITIES_BASE}/${cityCode}`);
}

/**
 * DEPARTMENTS ENDPOINTS
 */

export async function getDepartmentsByCity(cityCode: string, filters?: { sosCapable?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.sosCapable !== undefined) params.append('sosCapable', String(filters.sosCapable));
  
  const query = params.toString();
  return fetchData<Department[]>(
    `${CITIES_BASE}/${cityCode}/departments${query ? `?${query}` : ''}`
  );
}

export async function createDepartment(cityCode: string, data: Partial<Department>) {
  return postData<Department>(`${CITIES_BASE}/${cityCode}/departments`, data);
}

export async function updateDepartment(departmentId: string, data: Partial<Department>) {
  return updateData<Department>(`${CITIES_BASE}/departments/${departmentId}`, data);
}

export async function deleteDepartment(departmentId: string) {
  return deleteData(`${CITIES_BASE}/departments/${departmentId}`);
}

/**
 * SOS HQ ENDPOINTS
 */

export async function getSOSHQByCity(cityCode: string) {
  return fetchData<SOSHQData[]>(`${CITIES_BASE}/${cityCode}/sos-hq`);
}

export async function createSOSHQ(cityCode: string, data: Partial<SOSHQData>) {
  return postData<SOSHQData>(`${CITIES_BASE}/${cityCode}/sos-hq`, data);
}

export async function updateSOSHQ(sosHQId: string, data: Partial<SOSHQData>) {
  return updateData<SOSHQData>(`${CITIES_BASE}/sos-hq/${sosHQId}`, data);
}

export async function deleteSOSHQ(sosHQId: string) {
  return deleteData(`${CITIES_BASE}/sos-hq/${sosHQId}`);
}

export async function activateSOSHQ(sosHQId: string) {
  return patchData<SOSHQData>(`${CITIES_BASE}/sos-hq/${sosHQId}/activate`, {});
}

export async function deactivateSOSHQ(sosHQId: string) {
  return patchData<SOSHQData>(`${CITIES_BASE}/sos-hq/${sosHQId}/deactivate`, {});
}

/**
 * CITY CONFIG ENDPOINTS
 */

export async function getCityConfig(cityCode: string) {
  return fetchData<CityConfig>(`${CITIES_BASE}/${cityCode}/config`);
}

export async function updateCityConfig(cityCode: string, data: Partial<CityConfig>) {
  return updateData<CityConfig>(`${CITIES_BASE}/${cityCode}/config`, data);
}

export async function updateIncidentRules(
  cityCode: string,
  data: Partial<CityConfig['incident']>
) {
  return patchData<CityConfig>(`${CITIES_BASE}/${cityCode}/config/incident-rules`, data);
}

export async function updateSOSRules(cityCode: string, data: Partial<CityConfig['sos']>) {
  return patchData<CityConfig>(`${CITIES_BASE}/${cityCode}/config/sos-rules`, data);
}

export async function updateVisibilityRules(
  cityCode: string,
  data: Partial<CityConfig['visibility']>
) {
  return patchData<CityConfig>(`${CITIES_BASE}/${cityCode}/config/visibility-rules`, data);
}

/**
 * SETUP WORKFLOW ENDPOINTS
 */

export async function initializeSetup(cityCode: string, userId: string) {
  return postData<{ setup: SetupStatus }>(`${CITIES_BASE}/${cityCode}/setup/initialize`, {
    userId,
  });
}

export async function updateSetupStep(cityCode: string, step: string) {
  return patchData<{ setup: SetupStatus }>(`${CITIES_BASE}/${cityCode}/setup/step`, {
    step,
  });
}

export async function getSetupStatus(cityCode: string) {
  return fetchData<SetupStatus>(`${CITIES_BASE}/${cityCode}/setup/status`);
}

export async function getCompleteSetup(cityCode: string) {
  return fetchData<CompleteSetup>(`${CITIES_BASE}/${cityCode}/complete-setup`);
}
