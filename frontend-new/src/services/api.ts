/**
 * Axios HTTP Client with Interceptors
 * Handles authentication, errors, and provides centralized HTTP configuration
 */

import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { Logger } from '@/services/Logger';
import { StorageService, StorageKey } from '@/services/StorageService';

const logger = new Logger('API');

// API Response type
export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_SERVER_URL || 'http://localhost:3000') as string,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: inject JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = StorageService.get<string>(StorageKey.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Request error:', err);
    return Promise.reject(err);
  }
);

// Response interceptor: handle common errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    // 401 Unauthorized: token expired or invalid
    if (error.response?.status === 401) {
      const errorMsg = error.response.data?.message || error.response.data?.error || '';
      if (errorMsg.toLowerCase().includes('token') || errorMsg.toLowerCase().includes('sesión')) {
        // Clear invalid token
        StorageService.remove(StorageKey.AUTH_TOKEN);
        StorageService.remove(StorageKey.ROOM_ID);

        // Dispatch custom event for app-wide handling
        window.dispatchEvent(new CustomEvent('auth:session-expired'));

        toast.error('Sesión expirada', {
          description: 'Por favor, inicia sesión nuevamente',
        });
      }
    }

    // 429 Too Many Requests: rate limiting
    if (error.response?.status === 429) {
      toast.error('Demasiadas solicitudes', {
        description: 'Por favor, espera un momento e intenta de nuevo',
      });
    }

    // 500+ Server Error
    if (error.response && error.response.status >= 500) {
      toast.error('Error del servidor', {
        description: 'Algo salió mal. Inténtalo de nuevo más tarde',
      });
    }

    // Network error (no response)
    if (!error.response) {
      logger.error('Network error:', new Error(error.message));
      toast.error('Error de conexión', {
        description: 'Verifica tu conexión a internet',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
