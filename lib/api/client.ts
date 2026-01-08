import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';
import { getAuthToken } from '@/lib/auth/store';
import { refreshAccessToken } from '@/lib/services/authService';
import { clearAuth } from '@/lib/auth/store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent infinite retry loops
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let pendingRequests: Array<() => void> = [];

/**
 * Execute all pending requests after token refresh
 */
function executeQueuedRequests(): void {
  pendingRequests.forEach((callback) => callback());
  pendingRequests = [];
}

/**
 * Refresh token and retry the failed request
 * Handles queuing of multiple 401 responses while one refresh is in progress
 */
async function handleTokenRefresh(): Promise<boolean> {
  // If already refreshing, wait for that promise
  if (isRefreshing && refreshPromise) {
    console.log('[API Client] Token already refreshing, waiting for completion');
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const result = await refreshAccessToken();
      
      if (result.success) {
        console.log('[API Client] ✅ Token refreshed via API interceptor');
        executeQueuedRequests();
        return true;
      } else {
        console.error('[API Client] Token refresh failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[API Client] Token refresh error:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Request interceptor - add token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 with automatic refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retried, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshed = await handleTokenRefresh();

        if (refreshed) {
          // Get the new token and update the request
          const newToken = getAuthToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            console.log('[API Client] Retrying original request with new token');
            // Retry the original request with the new token
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('[API Client] Token refresh attempt failed:', refreshError);
      }

      // If refresh failed, clear auth and redirect to login
      console.log('[API Client] Token refresh failed, clearing auth and redirecting to login');
      clearAuth();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/citizen/home';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Generic GET request
 */
export async function fetchData<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: axiosError.message || 'Failed to fetch data',
      },
    };
  }
}

/**
 * Generic POST request
 */
export async function postData<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      error: {
        code: 'POST_ERROR',
        message: axiosError.message || 'Failed to post data',
      },
    };
  }
}

/**
 * Generic PUT request
 */
export async function updateData<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: axiosError.message || 'Failed to update data',
      },
    };
  }
}

/**
 * Generic DELETE request
 */
export async function deleteData<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: axiosError.message || 'Failed to delete data',
      },
    };
  }
}

/**
 * Generic PATCH request
 */
export async function patchData<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      error: {
        code: 'PATCH_ERROR',
        message: axiosError.message || 'Failed to patch data',
      },
    };
  }
}
