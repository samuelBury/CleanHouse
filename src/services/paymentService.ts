// Service de paiement Stripe pour CleanHouse
import api, { handleApiError } from './api';
import type { PaymentIntent, PaymentMethod, ApiResponse } from '../types';

export const paymentService = {
  // Create payment intent for a booking
  async createPaymentIntent(amount: number, bookingId?: string): Promise<ApiResponse<PaymentIntent>> {
    try {
      const response = await api.post<PaymentIntent>('/payments/create-intent', {
        amount,
        bookingId,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Confirm payment
  async confirmPayment(paymentIntentId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await api.post<{ success: boolean }>('/payments/confirm', {
        paymentIntentId,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Get user's payment methods
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    try {
      const response = await api.get<PaymentMethod[]>('/payments/methods');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Add new payment method
  async addPaymentMethod(paymentMethodId: string): Promise<ApiResponse<PaymentMethod>> {
    try {
      const response = await api.post<PaymentMethod>('/payments/methods', {
        paymentMethodId,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Remove payment method
  async removePaymentMethod(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/payments/methods/${id}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Set default payment method
  async setDefaultPaymentMethod(id: string): Promise<ApiResponse<PaymentMethod>> {
    try {
      const response = await api.put<PaymentMethod>(`/payments/methods/${id}/default`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Create setup intent for adding card without immediate payment
  async createSetupIntent(): Promise<ApiResponse<{ clientSecret: string }>> {
    try {
      const response = await api.post<{ clientSecret: string }>('/payments/setup-intent');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Process refund
  async requestRefund(bookingId: string, reason?: string): Promise<ApiResponse<{ refundId: string }>> {
    try {
      const response = await api.post<{ refundId: string }>('/payments/refund', {
        bookingId,
        reason,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};

export default paymentService;
