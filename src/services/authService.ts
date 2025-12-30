// Service d'authentification pour CleanHouse
import api, { handleApiError } from './api';
import { storage } from '../utils/storage';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiResponse,
} from '../types';

export const authService = {
  // Login with email/password
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { user, token, refreshToken } = response.data;

      // Store tokens and user data
      await storage.setAuthToken(token);
      await storage.setRefreshToken(refreshToken);
      await storage.setUserData(user);

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Register new user
  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', credentials);
      const { user, token, refreshToken } = response.data;

      // Store tokens and user data
      await storage.setAuthToken(token);
      await storage.setRefreshToken(refreshToken);
      await storage.setUserData(user);

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Login with Google
  async loginWithGoogle(idToken: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/auth/google', { idToken });
      const { user, token, refreshToken } = response.data;

      await storage.setAuthToken(token);
      await storage.setRefreshToken(refreshToken);
      await storage.setUserData(user);

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Login with Apple
  async loginWithApple(identityToken: string, fullName?: { givenName?: string; familyName?: string }): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/auth/apple', {
        identityToken,
        fullName,
      });
      const { user, token, refreshToken } = response.data;

      await storage.setAuthToken(token);
      await storage.setRefreshToken(refreshToken);
      await storage.setUserData(user);

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Logout
  async logout(): Promise<ApiResponse<void>> {
    try {
      await api.post('/auth/logout');
      await storage.clearAuth();
      return { success: true };
    } catch (error) {
      // Even if API call fails, clear local storage
      await storage.clearAuth();
      return { success: true };
    }
  },

  // Refresh token
  async refreshToken(): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) {
        return { success: false, error: 'No refresh token' };
      }

      const response = await api.post<{ token: string; refreshToken: string }>('/auth/refresh', {
        refreshToken,
      });

      await storage.setAuthToken(response.data.token);
      await storage.setRefreshToken(response.data.refreshToken);

      return { success: true, data: response.data };
    } catch (error) {
      await storage.clearAuth();
      return { success: false, error: handleApiError(error) };
    }
  },

  // Check if user is authenticated (from local storage)
  async checkAuth(): Promise<{ isAuthenticated: boolean; user: User | null }> {
    try {
      const token = await storage.getAuthToken();
      const user = await storage.getUserData();

      if (token && user) {
        // Optionally verify token with server
        try {
          const response = await api.get<User>('/users/me');
          await storage.setUserData(response.data);
          return { isAuthenticated: true, user: response.data };
        } catch {
          // Token might be expired, try refresh
          const refreshResult = await this.refreshToken();
          if (refreshResult.success) {
            const userResponse = await api.get<User>('/users/me');
            await storage.setUserData(userResponse.data);
            return { isAuthenticated: true, user: userResponse.data };
          }
        }
      }

      return { isAuthenticated: false, user: null };
    } catch {
      return { isAuthenticated: false, user: null };
    }
  },

  // Get stored user data (without API call)
  async getStoredUser(): Promise<User | null> {
    return storage.getUserData();
  },

  // Update push notification token
  async updatePushToken(pushToken: string): Promise<ApiResponse<void>> {
    try {
      await api.put('/users/me/push-token', { pushToken });
      await storage.setPushToken(pushToken);
      return { success: true };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};

export default authService;
