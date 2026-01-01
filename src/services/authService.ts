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
      const response = await api.post('/auth/login', credentials);
      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens and user data
      await storage.setAuthToken(accessToken);
      await storage.setRefreshToken(refreshToken);
      await storage.setUserData(user);

      return { success: true, data: { user, token: accessToken, refreshToken } };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Register new user
  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse> & { requiresVerification?: boolean; message?: string }> {
    try {
      const response = await api.post('/auth/register', credentials);

      // Si requiresVerification est true, l'utilisateur doit vérifier son email
      if (response.data.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          message: response.data.message,
          data: response.data.data,
        };
      }

      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens and user data (seulement si pas besoin de vérification)
      await storage.setAuthToken(accessToken);
      await storage.setRefreshToken(refreshToken);
      await storage.setUserData(user);

      return { success: true, data: { user, token: accessToken, refreshToken } };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Resend verification email
  async resendVerification(email: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Login with Google
  async loginWithGoogle(idToken: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post('/auth/google', { idToken });
      const { user, accessToken, refreshToken } = response.data.data;

      await storage.setAuthToken(accessToken);
      await storage.setRefreshToken(refreshToken);
      await storage.setUserData(user);

      return { success: true, data: { user, token: accessToken, refreshToken } };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Login with Apple
  async loginWithApple(identityToken: string, fullName?: { givenName?: string; familyName?: string }): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post('/auth/apple', {
        identityToken,
        fullName,
      });
      const { user, accessToken, refreshToken } = response.data.data;

      await storage.setAuthToken(accessToken);
      await storage.setRefreshToken(refreshToken);
      await storage.setUserData(user);

      return { success: true, data: { user, token: accessToken, refreshToken } };
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

      const response = await api.post('/auth/refresh', {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      await storage.setAuthToken(accessToken);
      await storage.setRefreshToken(newRefreshToken);

      return { success: true, data: { token: accessToken, refreshToken: newRefreshToken } };
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
          const response = await api.get('/users/me');
          const userData = response.data.data.user;
          await storage.setUserData(userData);
          return { isAuthenticated: true, user: userData };
        } catch {
          // Token might be expired, try refresh
          const refreshResult = await this.refreshToken();
          if (refreshResult.success) {
            const userResponse = await api.get('/users/me');
            const userData = userResponse.data.data.user;
            await storage.setUserData(userData);
            return { isAuthenticated: true, user: userData };
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
