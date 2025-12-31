// Service utilisateur pour CleanHouse
import api, { handleApiError } from './api';
import { storage } from '../utils/storage';
import type { User, WalletData, Transaction, ApiResponse } from '../types';

export const userService = {
  // Get current user profile
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await api.get('/users/me');
      const user = response.data.data.user || response.data.data;
      await storage.setUserData(user);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await api.put('/users/me', data);
      const user = response.data.data.user || response.data.data;
      await storage.setUserData(user);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Update avatar
  async updateAvatar(imageUri: string): Promise<ApiResponse<User>> {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as unknown as Blob);

      const response = await api.put('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const user = response.data.data.user || response.data.data;
      await storage.setUserData(user);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Get wallet data (balance + transactions)
  async getWallet(): Promise<ApiResponse<WalletData>> {
    try {
      const response = await api.get('/users/wallet');
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Get transactions history
  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    try {
      const response = await api.get('/users/transactions');
      const transactions = response.data?.data?.transactions || response.data?.data || [];
      return { success: true, data: Array.isArray(transactions) ? transactions : [] };
    } catch (error) {
      return { success: false, error: handleApiError(error), data: [] };
    }
  },

  // Add money to wallet
  async addMoney(amount: number, paymentMethodId: string): Promise<ApiResponse<{ balance: number; transaction: Transaction }>> {
    try {
      const response = await api.post('/users/wallet/add', {
        amount,
        paymentMethodId,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      await api.put('/users/me/password', {
        currentPassword,
        newPassword,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Delete account
  async deleteAccount(): Promise<ApiResponse<void>> {
    try {
      await api.delete('/users/me');
      await storage.clearAuth();
      return { success: true };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Get user statistics
  async getStatistics(): Promise<ApiResponse<{
    totalBookings: number;
    completedBookings: number;
    totalSpent: number;
    totalHours: number;
  }>> {
    try {
      const response = await api.get('/users/statistics');
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};

export default userService;
