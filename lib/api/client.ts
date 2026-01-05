import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';
import { getAuthToken } from '@/lib/auth/store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://admin.localhost';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
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
