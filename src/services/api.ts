// Client API Axios configuré pour CleanHouse
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/constants';
import { storage } from '../utils/storage';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          await storage.setAuthToken(accessToken);
          await storage.setRefreshToken(newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        await storage.clearAuth();
        // You might want to trigger a navigation to login here
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors - avec debug détaillé
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;

    // DEBUG: Afficher les détails de l'erreur pour diagnostic
    const debugInfo = {
      code: axiosError.code,
      message: axiosError.message,
      url: axiosError.config?.url,
      baseURL: axiosError.config?.baseURL,
      status: axiosError.response?.status,
    };
    console.log('API Error Debug:', JSON.stringify(debugInfo));

    // Erreur de timeout
    if (axiosError.code === 'ECONNABORTED') {
      return `Timeout - URL: ${API_CONFIG.BASE_URL}`;
    }

    // Erreur réseau (pas de connexion)
    if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
      // Afficher l'URL pour debug
      return `Erreur réseau (${axiosError.code || 'NO_RESPONSE'}) - URL: ${API_CONFIG.BASE_URL}`;
    }

    // Erreur serveur avec message
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  return `Erreur inconnue - URL: ${API_CONFIG.BASE_URL}`;
};

export default api;
