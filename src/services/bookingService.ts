// Service de réservation pour CleanHouse
import api, { handleApiError } from './api';
import type { Booking, CreateBookingData, ApiResponse } from '../types';

export const bookingService = {
  // Get all bookings for current user
  async getBookings(): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await api.get<Booking[]>('/bookings');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Get booking by ID
  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.get<Booking>(`/bookings/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Create new booking
  async createBooking(data: CreateBookingData): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.post<Booking>('/bookings', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Update booking
  async updateBooking(id: string, data: Partial<CreateBookingData>): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.put<Booking>(`/bookings/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Cancel booking
  async cancelBooking(id: string): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.delete<Booking>(`/bookings/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Get bookings by status
  async getBookingsByStatus(status: string): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await api.get<Booking[]>(`/bookings?status=${status}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Get bookings for a specific date
  async getBookingsByDate(date: string): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await api.get<Booking[]>(`/bookings?date=${date}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Get upcoming bookings
  async getUpcomingBookings(): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await api.get<Booking[]>('/bookings/upcoming');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Get booking history
  async getBookingHistory(): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await api.get<Booking[]>('/bookings/history');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};

export default bookingService;
