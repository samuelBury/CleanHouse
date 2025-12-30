// Context de réservation pour CleanHouse
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { bookingService } from '../services/bookingService';
import type { Booking, CreateBookingData, ServiceType } from '../types';

// State type
interface BookingState {
  bookings: Booking[];
  currentBooking: Partial<CreateBookingData> | null;
  isLoading: boolean;
  error: string | null;
}

// Actions
type BookingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_BOOKINGS'; payload: Booking[] }
  | { type: 'ADD_BOOKING'; payload: Booking }
  | { type: 'UPDATE_BOOKING'; payload: Booking }
  | { type: 'REMOVE_BOOKING'; payload: string }
  | { type: 'SET_CURRENT_BOOKING'; payload: Partial<CreateBookingData> | null }
  | { type: 'UPDATE_CURRENT_BOOKING'; payload: Partial<CreateBookingData> }
  | { type: 'CLEAR_CURRENT_BOOKING' }
  | { type: 'SET_ERROR'; payload: string | null };

// Initial state
const initialState: BookingState = {
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,
};

// Reducer
const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_BOOKINGS':
      return { ...state, bookings: action.payload, isLoading: false };
    case 'ADD_BOOKING':
      return { ...state, bookings: [action.payload, ...state.bookings] };
    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'REMOVE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.filter((b) => b.id !== action.payload),
      };
    case 'SET_CURRENT_BOOKING':
      return { ...state, currentBooking: action.payload };
    case 'UPDATE_CURRENT_BOOKING':
      return {
        ...state,
        currentBooking: { ...state.currentBooking, ...action.payload },
      };
    case 'CLEAR_CURRENT_BOOKING':
      return { ...state, currentBooking: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
};

// Context type
interface BookingContextType extends BookingState {
  fetchBookings: () => Promise<void>;
  createBooking: (data: CreateBookingData) => Promise<{ success: boolean; booking?: Booking; error?: string }>;
  cancelBooking: (id: string) => Promise<{ success: boolean; error?: string }>;
  setCurrentBooking: (booking: Partial<CreateBookingData> | null) => void;
  updateCurrentBooking: (data: Partial<CreateBookingData>) => void;
  clearCurrentBooking: () => void;
  getBookingsByDate: (date: string) => Booking[];
  getUpcomingBookings: () => Booking[];
  getCompletedBookings: () => Booking[];
}

// Create context
const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Provider component
export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  // Fetch all bookings
  const fetchBookings = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await bookingService.getBookings();
    if (result.success && result.data) {
      dispatch({ type: 'SET_BOOKINGS', payload: result.data });
    } else {
      dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to fetch bookings' });
    }
  }, []);

  // Create new booking
  const createBooking = useCallback(async (data: CreateBookingData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await bookingService.createBooking(data);
    if (result.success && result.data) {
      dispatch({ type: 'ADD_BOOKING', payload: result.data });
      dispatch({ type: 'CLEAR_CURRENT_BOOKING' });
      return { success: true, booking: result.data };
    }
    dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to create booking' });
    return { success: false, error: result.error };
  }, []);

  // Cancel booking
  const cancelBooking = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await bookingService.cancelBooking(id);
    if (result.success) {
      dispatch({ type: 'UPDATE_BOOKING', payload: { ...result.data!, status: 'cancelled' } });
      return { success: true };
    }
    dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to cancel booking' });
    return { success: false, error: result.error };
  }, []);

  // Set current booking (for booking flow)
  const setCurrentBooking = useCallback((booking: Partial<CreateBookingData> | null) => {
    dispatch({ type: 'SET_CURRENT_BOOKING', payload: booking });
  }, []);

  // Update current booking
  const updateCurrentBooking = useCallback((data: Partial<CreateBookingData>) => {
    dispatch({ type: 'UPDATE_CURRENT_BOOKING', payload: data });
  }, []);

  // Clear current booking
  const clearCurrentBooking = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT_BOOKING' });
  }, []);

  // Get bookings by date
  const getBookingsByDate = useCallback(
    (date: string) => {
      return state.bookings.filter((b) => b.date === date);
    },
    [state.bookings]
  );

  // Get upcoming bookings
  const getUpcomingBookings = useCallback(() => {
    const now = new Date();
    return state.bookings
      .filter((b) => {
        const bookingDate = new Date(b.date);
        return bookingDate >= now && b.status !== 'cancelled' && b.status !== 'completed';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.bookings]);

  // Get completed bookings
  const getCompletedBookings = useCallback(() => {
    return state.bookings
      .filter((b) => b.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.bookings]);

  return (
    <BookingContext.Provider
      value={{
        ...state,
        fetchBookings,
        createBooking,
        cancelBooking,
        setCurrentBooking,
        updateCurrentBooking,
        clearCurrentBooking,
        getBookingsByDate,
        getUpcomingBookings,
        getCompletedBookings,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

// Custom hook
export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export default BookingContext;
