import { fetchData, postData, deleteData } from './client';

interface CreateShareLinkRequest {
  cityId: string;
  departmentId: string;
  incidentId: string;
  scope: 'ASSIGNMENT_ONLY' | 'DEPT_ACTIVE';
  assignmentId?: string;
}

interface CreateShareLinkResponse {
  jwt: string;
  expiresAt: string;
}

interface ValidateShareLinkResponse {
  cityId: string;
  departmentId: string;
  scope: 'ASSIGNMENT_ONLY' | 'DEPT_ACTIVE';
  assignmentId?: string;
  expiresAt: string;
}

interface ShareLinkData {
  jwt: string;
  scope: 'ASSIGNMENT_ONLY' | 'DEPT_ACTIVE';
  assignmentId?: string;
  expiresAt: string;
}

/**
 * Create a shareable link for incident/assignment tracking
 * POST /api/sharelink/
 */
export async function createShareLink(data: CreateShareLinkRequest) {
  return postData<CreateShareLinkResponse>('/api/sharelink/', data);
}

/**
 * Validate a shareable link
 * GET /api/sharelink/validate/:hashToken
 */
export async function validateShareLink(hashToken: string) {
  return fetchData<ValidateShareLinkResponse>(`/api/sharelink/validate/${hashToken}`);
}

/**
 * Revoke a shareable link
 * DELETE /api/sharelink/revoke/:hashToken
 */
export async function revokeShareLink(hashToken: string) {
  return deleteData(`/api/sharelink/revoke/${hashToken}`);
}

/**
 * Get active links by department
 * GET /api/sharelink/department/:departmentId
 */
export async function getActiveLinksByDepartment(departmentId: string) {
  return fetchData<ShareLinkData[]>(`/api/sharelink/department/${departmentId}`);
}
