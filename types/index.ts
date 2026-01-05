// JWT Claims Structure
export interface JWTClaims {
  iss: any;
  iat: number;
  exp: number;
  identity?:{
    userId: string;
    role: string;
    firebaseUid?: string;
    scopes?: string[];
  };
  actor?: {
    cityCode: string;
  }
}

// Auth context
export interface AuthUser {
  id: string;
  role: string;
  scopes: string[];
  cityCode: string;
  contextType: 'admin' | 'rescue' | 'citizen';
  firebaseUid?: string;
  token?: string;
  email?: string;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Token exchange response
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// Admin Types
export interface City {
  id: string;
  name: string;
  code: string;
  province: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in-progress' | 'resolved' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  cityId: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'news' | 'alert' | 'advisory';
  cityId: string;
  publishedAt: string;
  expiresAt?: string;
  createdBy: string;
}

export interface SosEvent {
  id: string;
  callerId: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'pending' | 'assigned' | 'en-route' | 'arrived' | 'assisting' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedRescuers: string[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface YouthStudent {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  barangay: string;
  schoolCode?: string;
  parentContact: string;
  optInConsent: boolean;
  createdAt: string;
}

export interface YouthAssistance {
  id: string;
  studentId: string;
  type: 'scholarship' | 'livelihood' | 'health' | 'emergency';
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  amount?: number;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

// Rescuer Types
export interface RescuerStatus {
  status: 'en-route' | 'arrived' | 'assisting' | 'done';
  sosEventId: string;
  timestamp: string;
  notes?: string;
}

// Citizen Types
export interface CizenNews {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  category: string;
  publishedAt: string;
  author: string;
  cityId: string;
}

export interface YouthProgram {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  category: string;
  maxParticipants: number;
  participants: number;
  cityId: string;
}

// Dashboard types
export interface DashboardKPI {
  openReports: number;
  resolvedReports: number;
  activeSos: number;
  avgResponseTimeMinutes: number;
}

// Setup Workflow Types
export type SetupStep = 'CITY_PROFILE' | 'DEPARTMENTS' | 'SOS_HQ' | 'SETTINGS' | 'COMPLETED';

export interface SetupStatus {
  isInitialized: boolean;
  currentStep: SetupStep;
  completedSteps: SetupStep[];
  initializedAt?: string;
  initializedByUserId?: string;
}

export interface CitySetupData {
  _id?: string;
  cityCode: string;
  cityId: string;
  name: string;
  provinceCode: string;
  centerLocation: {
    lat: number;
    lng: number;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  _id?: string;
  cityCode: string;
  cityId: string;
  code: string;
  name: string;
  handlesIncidentTypes: string[];
  sosCapable: boolean;
  contactNumber: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SOSHQData {
  _id?: string;
  scopeLevel: 'CITY' | 'PROVINCE' | 'REGION';
  cityCode: string;
  cityId: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  coverageRadiusKm: number;
  supportedDepartmentCodes: string[];
  contactNumber: string;
  address: string;
  isMain: boolean;
  isTemporary?: boolean;
  isActive?: boolean;
  activatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CityConfig {
  cityCode: string;
  cityId: string;
  incident: {
    allowAnonymous: boolean;
    allowOutsideCityReports: boolean;
    autoAssignDepartment: boolean;
    requireCityVerificationForResolve: boolean;
  };
  sos: {
    allowAnywhere: boolean;
    autoAssignNearestHQ: boolean;
    escalationMinutes: number;
    allowProvinceFallback: boolean;
  };
  visibility: {
    showIncidentsOnPublicMap: boolean;
    showResolvedIncidents: boolean;
  };
  setup?: SetupStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompleteSetup {
  city: CitySetupData;
  config: CityConfig;
  departments: Department[];
  sosHQ: SOSHQData[];
}

// Invite Types
export type InviteRole = 'CITY_ADMIN' | 'SOS_ADMIN' | 'SK_ADMIN';
export type InviteStatus = 'PENDING' | 'USED' | 'EXPIRED';

export interface Invite {
  id: string;
  code: string;
  role: InviteRole;
  municipalityCode: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  usedAt?: string | null;
}

export interface InviteResponse {
  inviteId: string;
  code: string;
  role: InviteRole;
  municipalityCode: string;
  expiresAt: string;
  inviteLink?: string;
}

export interface ValidateInviteResponse {
  inviteId: string;
  valid: boolean;
  role: InviteRole;
  municipalityCode: string;
  expiresAt: string;
  reason: null | 'EXPIRED' | 'USED' | 'INVALID';
}

export interface AcceptInviteRequest {
  code: string;
}

export interface AcceptInviteResponse {
  success: boolean;
  role: InviteRole;
  municipalityCode: string;
  message: string;
}

export interface RegisterWithInviteRequest {
  email: string;
  phone: string;
  displayName: string;
  firebaseUid: string;
  inviteId: string;
  code: string;
}

export interface RegisterWithInviteResponse {
  success: boolean;
  message: string;
  userId?: string;
  role?: InviteRole;
  municipalityCode?: string;
  token?: string;
}
// Incident Management Types
export type IncidentSeverity = 'low' | 'medium' | 'high';
export type IncidentStatus = 'open' | 'for_review' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected';
export type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface IncidentLocation {
  lat: number;
  lng: number;
  cityCode: string;
  barangayCode?: string;
}

export interface IncidentReporter {
  userId?: string;
  name?: string;
  contact?: string;
  role?: 'citizen' | 'guest' | 'admin';
}

export interface IncidentMetadata {
  reportCategory?: string;
  originalTitle?: string;
}

export interface Incident {
  id: string;
  _id?: string;
  type?: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: IncidentLocation;
  reporter?: IncidentReporter;
  attachments?: string[] | null;
  metadata?: IncidentMetadata;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IncidentWithDetails extends Incident {
  reporter: IncidentReporter;
}

export interface IncidentsResponse {
  data: Incident[];
  pagination: {
    total: number;
    limit?: number;
    skip?: number;
  }
}

export interface ReportTypeCategory {
  category: string;
  title: string;
  keywords: string[];
  suggestion: boolean;
}

export interface ReportTypesResponse {
  data: ReportTypeCategory[];
  total: number;
  categories: string[];
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  severity: IncidentSeverity;
  location: IncidentLocation;
  attachments?: string[];
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  location?: IncidentLocation;
  attachments?: string[];
}

export interface UpdateIncidentStatusRequest {
  status: IncidentStatus;
}

export interface Assignment {
  id: string;
  incidentId: string;
  responderId: string;
  cityCode: string;
  departmentCode: string;
  status: AssignmentStatus;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AssignmentWithDetails extends Assignment {
  incidentDetails?: Incident;
  responderDetails?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateAssignmentRequest {
  incidentId: string;
  cityCode: string;
  departmentCode: string;
  responderId: string;
  notes?: string;
}

export interface AssignmentsResponse {
  data: Assignment[];
  total: number;
  limit?: number;
  skip?: number;
}

export interface AssignmentActionRequest {
  notes?: string;
}