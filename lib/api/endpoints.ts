import { fetchData, postData, updateData, deleteData, patchData } from './client';
import { AxiosRequestConfig } from 'axios';
import {
  Report,
  Announcement,
  SosEvent,
  YouthStudent,
  YouthAssistance,
  City,
  YouthProgram,
  CizenNews,
  DashboardKPI,
  Invite,
  InviteResponse,
  ValidateInviteResponse,
  AcceptInviteRequest,
  AcceptInviteResponse,
  InviteRole,
  RegisterWithInviteRequest,
  RegisterWithInviteResponse,
  Incident,
  IncidentsResponse,
  ReportTypesResponse,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  UpdateIncidentStatusRequest,
  Assignment,
  AssignmentsResponse,
  CreateAssignmentRequest,
  AssignmentActionRequest,
} from '@/types';

// ADMIN ENDPOINTS

/**
 * Dashboard KPIs
 */
export async function getDashboardKPIs(cityId?: string) {
  const params = cityId ? `?cityId=${cityId}` : '';
  return fetchData<DashboardKPI>(`/admin/dashboard/kpis${params}`);
}

/**
 * Reports
 */
export async function getReports(filters?: { cityId?: string; status?: string; page?: number }) {
  const query = new URLSearchParams(filters as any).toString();
  return fetchData<Report[]>(`/admin/reports${query ? `?${query}` : ''}`);
}

export async function getReport(id: string) {
  return fetchData<Report>(`/admin/reports/${id}`);
}

export async function createReport(data: Partial<Report>) {
  return postData<Report>('/admin/reports', data);
}

export async function updateReport(id: string, data: Partial<Report>) {
  return updateData<Report>(`/admin/reports/${id}`, data);
}

export async function deleteReport(id: string) {
  return deleteData(`/admin/reports/${id}`);
}

/**
 * Announcements
 */
export async function getAnnouncements(cityId?: string) {
  const params = cityId ? `?cityId=${cityId}` : '';
  return fetchData<Announcement[]>(`/admin/announcements${params}`);
}

export async function createAnnouncement(data: Partial<Announcement>) {
  return postData<Announcement>('/admin/announcements', data);
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>) {
  return updateData<Announcement>(`/admin/announcements/${id}`, data);
}

export async function deleteAnnouncement(id: string) {
  return deleteData(`/admin/announcements/${id}`);
}

/**
 * SOS Monitoring
 */
export async function getSosEvents(filters?: { status?: string; page?: number }) {
  const query = new URLSearchParams(filters as any).toString();
  return fetchData<SosEvent[]>(`/admin/sos/events${query ? `?${query}` : ''}`);
}

export async function getSosEvent(id: string) {
  return fetchData<SosEvent>(`/admin/sos/events/${id}`);
}

/**
 * Youth Module
 */
export async function getStudents(cityId?: string) {
  const params = cityId ? `?cityId=${cityId}` : '';
  return fetchData<YouthStudent[]>(`/admin/youth/students${params}`);
}

export async function createStudent(data: Partial<YouthStudent>) {
  return postData<YouthStudent>('/admin/youth/students', data);
}

export async function updateStudent(id: string, data: Partial<YouthStudent>) {
  return updateData<YouthStudent>(`/admin/youth/students/${id}`, data);
}

export async function getAssistanceApplications(filters?: { status?: string }) {
  const query = new URLSearchParams(filters as any).toString();
  return fetchData<YouthAssistance[]>(`/admin/youth/assistance${query ? `?${query}` : ''}`);
}

export async function approveAssistance(id: string, data: Partial<YouthAssistance>) {
  return updateData<YouthAssistance>(`/admin/youth/assistance/${id}/approve`, data);
}

// RESCUE ENDPOINTS

/**
 * Assigned SOS for rescuer
 * Uses new endpoint: /api/sos/rescuer/assignment
 */
export async function getAssignedSos() {
  const bffUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
  const response = await fetch(`${bffUrl}/api/sos/rescuer/assignment`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch assigned SOS');
  }
  
  return response.json();
}

/**
 * Update rescuer status
 */
export async function updateRescuerStatus(sosId: string, status: string, notes?: string) {
  return postData(`/rescue/sos/${sosId}/status`, { status, notes });
}

// CITIZEN ENDPOINTS

/**
 * News & Announcements (public)
 */
export async function getNews(cityId?: string) {
  const params = cityId ? `?cityId=${cityId}` : '';
  return fetchData<CizenNews[]>(`/citizen/news${params}`);
}

export async function getNewsItem(id: string) {
  return fetchData<CizenNews>(`/citizen/news/${id}`);
}

export async function getAnnouncements_Public(cityId?: string) {
  const params = cityId ? `?cityId=${cityId}` : '';
  return fetchData<Announcement[]>(`/citizen/announcements${params}`);
}

/**
 * Programs (public)
 */
export async function getPrograms(cityId?: string) {
  const params = cityId ? `?cityId=${cityId}` : '';
  return fetchData<YouthProgram[]>(`/citizen/programs${params}`);
}

export async function joinProgram(programId: string) {
  return postData(`/citizen/programs/${programId}/join`, {});
}

/**
 * Invites Management
 */
export async function createInvite(data: { role: InviteRole; municipalityCode: string }) {
  return postData<InviteResponse>('/api/invites', data);
}

export async function getInvites(filters?: {
  role?: InviteRole;
  municipalityCode?: string;
  page?: number;
  limit?: number;
}) {
  // Filter out undefined values
  const cleanFilters = filters ? Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined)
  ) : {};
  
  const query = new URLSearchParams(cleanFilters as any).toString();
  return fetchData<{
    invites: Invite[];
    total: number;
    page: number;
    limit: number;
  }>(`/api/invites${query ? `?${query}` : ''}`);
}

export async function validateInvite(inviteId: string) {
  return fetchData<ValidateInviteResponse>(`/api/invites/${inviteId}`);
}

export async function acceptInvite(inviteId: string, data: AcceptInviteRequest) {
  return postData<AcceptInviteResponse>(`/api/invites/${inviteId}/accept`, data);
}

/**
 * Register new user with invite
 * POST /api/identity/admin/register
 */
export async function registerWithInvite(
  firebaseToken: string,
  data: RegisterWithInviteRequest
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
  
  try {
    const response = await fetch(`${apiUrl}/api/identity/admin/register`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`,
        'x-client-id': 'gov-ph-admin-client',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error?.message || `Registration failed: ${response.statusText}`,
      };
    }

    const result = await response.json();
    return {
      success: result.success !== false,
      data: result.data || result,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}
/**
 * Incident Management Endpoints
 */

/**
 * Get Report Categories Lookup
 * GET /api/incidents/reports/types/lookup?category=emergency&suggestion=true
 */
export async function getReportTypesLookup(filters?: { category?: string; suggestion?: boolean }) {
  const query = new URLSearchParams();
  if (filters?.category) query.append('category', filters.category);
  if (filters?.suggestion !== undefined) query.append('suggestion', String(filters.suggestion));
  
  return fetchData<ReportTypesResponse>(`/api/incidents/reports/types/lookup${query.toString() ? `?${query.toString()}` : ''}`);
}

/**
 * Get Incidents by City with filters
 * GET /api/incidents/reports/city/:cityCode?search=text&severity=high&status=open&startDate=2024-01-01&endDate=2024-12-31&sortBy=createdAt&sortOrder=desc&limit=50&skip=0
 */
export async function getIncidentsByCity(
  cityCode: string,
  filters?: {
    limit?: number;
    skip?: number;
    search?: string;
    severity?: 'low' | 'medium' | 'high';
    status?: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected' | 'cancelled';
    startDate?: string; // ISO 8601 format
    endDate?: string; // ISO 8601 format
    sortBy?: 'severity' | 'status' | 'title' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }
) {
  const query = new URLSearchParams();
  if (filters?.limit) query.append('limit', String(filters.limit));
  if (filters?.skip) query.append('skip', String(filters.skip));
  if (filters?.search) query.append('search', filters.search);
  if (filters?.severity) query.append('severity', filters.severity);
  if (filters?.status) query.append('status', filters.status);
  if (filters?.startDate) query.append('startDate', filters.startDate);
  if (filters?.endDate) query.append('endDate', filters.endDate);
  if (filters?.sortBy) query.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) query.append('sortOrder', filters.sortOrder);
  
  const response = await fetchData<any>(`/api/incidents/reports/city/${cityCode}${query.toString() ? `?${query.toString()}` : ''}`);
  
  // The API returns { success, data: [...], pagination: {...} }
  // But fetchData wraps it, so we need to access response.data
  if (response.success && response.data) {
    const rawResponse = response.data as any;
    
    return {
      success: true,
      data: {
        data: (Array.isArray(rawResponse) ? rawResponse : rawResponse.data || []) as Incident[],
        pagination: {
          total: rawResponse.pagination?.total || 0,
          limit: rawResponse.pagination?.limit || 50,
          skip: rawResponse.pagination?.skip || 0,
        },
      } as IncidentsResponse,
    };
  }
  
  return response;
}

/**
 * Get Incident by ID
 * GET /api/incidents/reports/:id
 */
export async function getIncidentById(id: string, config?: any) {
  return fetchData<Incident>(`/api/incidents/reports/${id}`, config);
}

/**
 * Update Incident Status
 * PATCH /api/incidents/reports/:id/status
 */
export async function updateIncidentStatus(id: string, data: UpdateIncidentStatusRequest, config?: any) {
  return patchData<Incident>(`/api/incidents/reports/${id}/status`, data, config);
}

/**
 * Update Incident
 * PUT /api/incidents/reports/:id
 */
export async function updateIncident(id: string, data: UpdateIncidentRequest) {
  return updateData<Incident>(`/api/incidents/reports/${id}`, data);
}

/**
 * Create Assignment
 * POST /api/incidents/assignments
 */
export async function createAssignment(data: CreateAssignmentRequest) {
  return postData<Assignment>('/api/incidents/assignments', data);
}

/**
 * Get Assignment by ID
 * GET /api/incidents/assignments/:id
 */
export async function getAssignmentById(id: string, config?: AxiosRequestConfig) {
  return fetchData<Assignment>(`/api/incidents/assignments/${id}`, config);
}

/**
 * Get Assignments by Incident
 * GET /api/incidents/assignments/incident/:incidentId
 */
export async function getAssignmentsByIncident(incidentId: string) {
  return fetchData<AssignmentsResponse>(`/api/incidents/assignments/incident/${incidentId}`);
}

/**
 * Get Assignments by Department
 * GET /api/incidents/assignments/department/:cityCode/:departmentCode?status=pending&limit=50&skip=0
 */
export async function getAssignmentsByDepartment(
  cityCode: string,
  departmentCode: string,
  filters?: { status?: string; limit?: number; skip?: number }
) {
  const query = new URLSearchParams();
  if (filters?.status) query.append('status', filters.status);
  if (filters?.limit) query.append('limit', String(filters.limit));
  if (filters?.skip) query.append('skip', String(filters.skip));
  
  return fetchData<AssignmentsResponse>(
    `/api/incidents/assignments/department/${cityCode}/${departmentCode}${query.toString() ? `?${query.toString()}` : ''}`
  );
}

/**
 * Get Assignments by Responder
 * GET /api/incidents/assignments/responder/:responderId?status=accepted&limit=50&skip=0
 */
export async function getAssignmentsByResponder(
  responderId: string,
  filters?: { status?: string; limit?: number; skip?: number }
) {
  const query = new URLSearchParams();
  if (filters?.status) query.append('status', filters.status);
  if (filters?.limit) query.append('limit', String(filters.limit));
  if (filters?.skip) query.append('skip', String(filters.skip));
  
  return fetchData<AssignmentsResponse>(
    `/api/incidents/assignments/responder/${responderId}${query.toString() ? `?${query.toString()}` : ''}`
  );
}

/**
 * Accept Assignment
 * POST /api/incidents/assignments/:id/accept
 */
export async function acceptAssignment(id: string, config?: AxiosRequestConfig) {
  return postData<Assignment>(`/api/incidents/assignments/${id}/accept`, {}, config);
}

/**
 * Reject Assignment
 * POST /api/incidents/assignments/:id/reject
 */
export async function rejectAssignment(id: string, data?: AssignmentActionRequest, config?: AxiosRequestConfig) {
  return postData<Assignment>(`/api/incidents/assignments/${id}/reject`, data || {}, config);
}

/**
 * Complete Assignment
 * POST /api/incidents/assignments/:id/complete
 */
export async function completeAssignment(id: string, data?: AssignmentActionRequest, config?: AxiosRequestConfig) {
  return postData<Assignment>(`/api/incidents/assignments/${id}/complete`, data || {}, config);
}

/**
 * Get all incidents for a department (via share token)
 * GET /api/incidents/assignments/department/:cityCode/:departmentCode
 */
export async function getIncidentsByDepartment(
  cityCode: string,
  departmentCode: string,
  config?: AxiosRequestConfig
) {
  return fetchData<Assignment[]>(
    `/api/incidents/assignments/department/${cityCode}/${departmentCode}`,
    config
  );
}