// Service de réservation pour CleanHouse
import api, { handleApiError } from './api';
import type { Booking, CreateBookingData, ApiResponse } from '../types';

export const bookingService = {
  // Get all bookings for current user
  async getBookings(): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await api.get('/bookings');
      const bookings = response.data?.data?.bookings || response.data?.data || [];
      return { success: true, data: Array.isArray(bookings) ? bookings : [] };
    } catch (error) {
      return { success: false, error: handleApiError(error), data: [] };
    }
  },

  // Get booking by ID
  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.get(`/bookings/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Create new booking
  async createBooking(data: CreateBookingData): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.post('/bookings', data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Update booking
  async updateBooking(id: string, data: Partial<CreateBookingData>): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.put(`/bookings/${id}`, data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Cancel booking
  async cancelBooking(id: string): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.delete(`/bookings/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Get bookings by status
  async getBookingsByStatus(status: string): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await api.get(`/bookings?status=${status}`);
      const bookings = response.data?.data?.bookings || response.data?.data || [];
      return { success: true, data: Array.isArray(bookings) ? bookings : [] };
    } catch (error) {
      return { success: false, error: handleApiError(error), data: [] };
    }
  },

  // Get bookings for a specific date
  async getBookingsByDate(date: string): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await api.get(`/bookings?date=${date}`);
      const bookings = response.data?.data?.bookings || response.data?.data || [];
      return { success: true, data: Array.isArray(bookings) ? bookings : [] };
    } catch (error) {
      return { success: false, error: handleApiError(error), data: [] };
    }
  },

  // Get upcoming bookings
  async getUpcomingBookings(): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await api.get('/bookings/upcoming');
      const bookings = response.data?.data || [];
      return { success: true, data: Array.isArray(bookings) ? bookings : [] };
    } catch (error) {
      return { success: false, error: handleApiError(error), data: [] };
    }
  },

  // Get booking history
  async getBookingHistory(): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await api.get('/bookings/history');
      const bookings = response.data?.data || [];
      return { success: true, data: Array.isArray(bookings) ? bookings : [] };
    } catch (error) {
      return { success: false, error: handleApiError(error), data: [] };
    }
  },
};

export default bookingService;
