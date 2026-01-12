// Types centralisés pour CleanHouse

// User
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

// Auth
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Services
export type ServiceType = 'Ménage' | 'Repassage' | 'Ménage + Repassage';

export interface ServiceInfo {
  id: string;
  name: ServiceType;
  price: number;
  icon: string;
  description: string;
}

// Booking
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  service: ServiceType;
  date: string;
  time: string;
  duration: number;
  address: string;
  latitude?: number;
  longitude?: number;
  price: number;
  status: BookingStatus;
  professional?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBookingData {
  service: ServiceType;
  date: string;
  time: string;
  duration: number;
  address: string;
  latitude?: number;
  longitude?: number;
  paymentIntentId?: string;
}

// Payment
export type TransactionType = 'expense' | 'deposit' | 'refund';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  bookingId?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  stripeId: string;
  type: 'card';
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  createdAt: string;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

// Location
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Navigation
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

// Notification
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
