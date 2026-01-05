import { ApiResponse } from '@/types';

/**
 * SOS Service - Handles all SOS-related API calls
 * Integrates with the Admin BFF /api/sos endpoints
 */

// Types for SOS operations
export interface SOSRequest {
  id: string;
  userId: string;
  status: 'pending' | 'assigned' | 'resolved' | 'cancelled' | 'ACTIVE' | 'CLOSED';
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
  tag?: string;
}

export interface SOSMessage {
  id: string;
  sosId: string;
  senderType: 'citizen' | 'admin' | 'rescuer';
  senderId: string;
  senderDisplayName: string;
  contentType: 'text' | 'system';
  content: string;
  createdAt: string;
}

export interface SendMessagePayload {
  senderType: 'SOS_ADMIN' | 'CITIZEN' | 'RESCUER';
  senderId?: string;
  senderDisplayName: string;
  contentType: 'text' | 'system';
  content: string;
  cityId: string;
}

export interface MessagesResponse {
  data: SOSMessage[];
  total: number;
  skip: number;
  limit: number;
}

export interface NearbySOS {
  sosId: string;
  citizenId: string;
  status: 'active' | 'inactive' | 'resolved';
  createdAt: number;
  lastLocationUpdate: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    deviceId: string;
  };
  address: {
    barangay: string;
    city: string;
  };
  distance: number;
}

export interface SOSHQ {
  _id: string;
  scopeLevel: string;
  cityCode: string;
  cityId: string;
  name: string;
  contactNumber: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  coverageRadiusKm: number;
  supportedDepartmentCodes: string[];
  isMain: boolean;
  isTemporary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get BFF base URL
 */
/**
 * Get API base URL
 */
function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Make authenticated API request
 */
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

// ============================================================================
// SOS REQUEST ENDPOINTS
// ============================================================================

/**
 * Get SOS request by ID
 * GET /api/sos/:sosId
 */
export async function getSOSRequestById(
  sosId: string
): Promise<{ success: boolean; data?: SOSRequest; error?: string }> {
  try {
    const bffUrl = getApiUrl();
    const url = `${bffUrl}/api/sos/${sosId}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to fetch SOS request: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('Error fetching SOS request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch SOS request',
    };
  }
}

/**
 * Get user SOS requests
 * GET /api/sos/user/requests
 */
export async function getUserSOSRequests(
  userId: string
): Promise<{ success: boolean; data?: SOSRequest[]; total?: number; error?: string }> {
  try {
    const bffUrl = getApiUrl();
    const url = `${bffUrl}/api/sos/user/requests`;

    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to fetch user SOS requests: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
      total: data.total,
    };
  } catch (error) {
    console.error('Error fetching user SOS requests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user SOS requests',
    };
  }
}

/**
 * Get active SOS requests by citizen
 * GET /api/sos/citizen/active
 */
export async function getActiveCitizenSOS(
  userId: string,
  cityCode?: string
): Promise<{ success: boolean; data?: SOSRequest[]; error?: string }> {
  try {
    const bffUrl = getApiUrl();
    const url = `${bffUrl}/api/sos/citizen/active`;

    const payload: any = { userId };
    if (cityCode) {
      payload.cityCode = cityCode;
    }

    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to fetch active SOS requests: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('Error fetching active SOS requests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch active SOS requests',
    };
  }
}

/**
 * Get nearby SOS requests by location
 * GET /api/sos/states/nearby?longitude=X&latitude=Y&radius=Z
 */
export async function getNearbySOSRequests(
  latitude: number,
  longitude: number,
  radius: number = 120
): Promise<{ success: boolean; data?: NearbySOS[]; error?: string }> {
  try {
    const bffUrl = getApiUrl();
    const url = `${bffUrl}/api/sos/states/nearby?longitude=${longitude}&latitude=${latitude}&radius=${radius}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to fetch nearby SOS requests: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('Error fetching nearby SOS requests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch nearby SOS requests',
    };
  }
}

/**
 * Update SOS tag/label
 * PUT /api/sos/:sosId/tag
 */
export async function updateSOSTag(
  sosId: string,
  tag: string
): Promise<{ success: boolean; data?: SOSRequest; error?: string }> {
  try {
    const bffUrl = getApiUrl();
    const url = `${bffUrl}/api/sos/${sosId}/tag`;

    const response = await authenticatedFetch(url, {
      method: 'PUT',
      body: JSON.stringify({ tag }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to update SOS tag: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('Error updating SOS tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update SOS tag',
    };
  }
}

/**
 * Close SOS request
 * POST /api/sos/:sosId/close
 */
export async function closeSOSRequest(
  sosId: string
): Promise<{ success: boolean; data?: SOSRequest; error?: string }> {
  try {
    const bffUrl = getApiUrl();
    const url = `${bffUrl}/api/sos/${sosId}/close`;

    const response = await authenticatedFetch(url, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to close SOS request: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('Error closing SOS request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to close SOS request',
    };
  }
}

// ============================================================================
// MESSAGE ENDPOINTS
// ============================================================================

/**
 * Send message to SOS conversation
 * POST /api/sos/:sosId/messages
 */
export async function sendSOSMessage(
  sosId: string,
  payload: SendMessagePayload
): Promise<{ success: boolean; data?: SOSMessage; error?: string }> {
  try {
    const bffUrl = getApiUrl();
    const url = `${bffUrl}/api/sos/${sosId}/messages`;

    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to send message: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('Error sending SOS message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
}

/**
 * Get all messages for SOS
 * GET /api/sos/:sosId/messages
 */
export async function getSOSMessages(
  sosId: string,
  skip: number = 0,
  limit: number = 50
): Promise<{ success: boolean; data?: MessagesResponse; error?: string }> {
  try {
    const bffUrl = getApiUrl();
    const url = `${bffUrl}/api/sos/${sosId}/messages?skip=${skip}&limit=${limit}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to fetch messages: ${response.statusText}`,
      };
    }

    const apiResponse = await response.json();
    
    // Handle API response format: { success, data: [...], pagination: {...} }
    const messagesData: MessagesResponse = {
      data: Array.isArray(apiResponse.data) ? apiResponse.data : [],
      total: apiResponse.pagination?.total || 0,
      skip: apiResponse.pagination?.skip || skip,
      limit: apiResponse.pagination?.limit || limit,
    };

    return {
      success: true,
      data: messagesData,
    };
  } catch (error) {
    console.error('Error fetching SOS messages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch messages',
    };
  }
}

/**
 * Get single message by ID
 * GET /api/sos/message/:messageId
 */
export async function getSOSMessageById(
  messageId: string
): Promise<{ success: boolean; data?: SOSMessage; error?: string }> {
  try {
    const bffUrl = getApiUrl();
    const url = `${bffUrl}/api/sos/message/${messageId}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to fetch message: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('Error fetching SOS message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch message',
    };
  }
}

// ============================================================================
// SOS HQ ENDPOINTS
// ============================================================================

/**
 * Get SOS HQ locations by city code
 * GET /api/admin/cities/:cityCode/sos-hq
 */
export async function getSOSHQByCity(
  cityCode: string
): Promise<{ success: boolean; data?: SOSHQ[]; error?: string }> {
  try {
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/api/admin/cities/${cityCode}/sos-hq`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to fetch SOS HQ: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || [],
    };
  } catch (error) {
    console.error('Error fetching SOS HQ:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch SOS HQ',
    };
  }
}

/**
 * Get single SOS HQ by ID
 * GET /api/admin/cities/sos-hq/:id
 */
export async function getSOSHQById(
  hqId: string
): Promise<{ success: boolean; data?: SOSHQ; error?: string }> {
  try {
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/api/admin/cities/sos-hq/${hqId}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to fetch SOS HQ: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('Error fetching SOS HQ:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch SOS HQ',
    };
  }
}
