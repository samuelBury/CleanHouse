// Service de réservation pour CleanHouse
import api, { handleApiError } from './api';
import type { Booking, CreateBookingData, ApiResponse } from '../types';

// Convertir le nom de service frontend vers l'enum backend
const convertServiceToBackend = (service: string): string => {
  switch (service) {
    case 'Ménage':
      return 'MENAGE';
    case 'Repassage':
      return 'REPASSAGE';
    case 'Ménage + Repassage':
      return 'MENAGE_REPASSAGE';
    default:
      return service;
  }
};

// Convertir la date DD/MM/YYYY vers ISO8601
const convertDateToISO = (dateStr: string): string => {
  // Si c'est déjà ISO, retourner tel quel
  if (dateStr.includes('T') || dateStr.includes('-')) {
    return dateStr;
  }
  // Sinon convertir DD/MM/YYYY
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day).toISOString();
};

// Convertir l'enum backend vers le nom frontend
const convertServiceToFrontend = (service: string): string => {
  switch (service) {
    case 'MENAGE':
      return 'Ménage';
    case 'REPASSAGE':
      return 'Repassage';
    case 'MENAGE_REPASSAGE':
      return 'Ménage + Repassage';
    default:
      return service;
  }
};

// Convertir un booking backend vers frontend
const convertBookingToFrontend = (booking: any): any => ({
  ...booking,
  service: convertServiceToFrontend(booking.service),
});

export const bookingService = {
  // Get all bookings for current user
  async getBookings(): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await api.get('/bookings');
      const bookings = response.data?.data?.bookings || response.data?.data || [];
      const convertedBookings = Array.isArray(bookings)
        ? bookings.map(convertBookingToFrontend)
        : [];
      return { success: true, data: convertedBookings };
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
      // Convertir les données pour le backend
      const backendData = {
        ...data,
        service: convertServiceToBackend(data.service),
        date: convertDateToISO(data.date),
      };
      const response = await api.post('/bookings', backendData);
      const responseData = response.data?.data;
      const booking = responseData?.booking || responseData;
      const convertedBooking = convertBookingToFrontend(booking);

      // Ajouter les infos d'assignation si présentes
      if (responseData?.professionalAssigned !== undefined) {
        convertedBooking.professionalAssigned = responseData.professionalAssigned;
      }

      return { success: true, data: convertedBooking };
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
