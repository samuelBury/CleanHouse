// Constants de configuration pour CleanHouse
import {Colors} from './theme';

// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://192.168.1.193:3000/api' : 'https://api.cleanhouse.com/api',
  TIMEOUT: 10000,
};

// Services disponibles
export const SERVICES = [
  {
    id: 'menage',
    name: 'Ménage' as const,
    price: 15,
    icon: 'home',
    description: 'Nettoyage complet de votre intérieur',
  },
  {
    id: 'repassage',
    name: 'Repassage' as const,
    price: 10,
    icon: 'tshirt',
    description: 'Service de repassage professionnel',
  },
  {
    id: 'both',
    name: 'Ménage + Repassage' as const,
    price: 20,
    icon: 'magic',
    description: 'Ménage complet + repassage',
  },
];

// Durées disponibles (en heures)
export const DURATIONS = [1, 2, 3, 4, 5, 6, 7, 8];

// Statuts de réservation
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Messages de statut
export const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  pending: { text: 'En attente', color: Colors.status.warning },
  confirmed: { text: 'Confirmée', color: Colors.primary },
  in_progress: { text: 'En cours', color: Colors.status.info },
  completed: { text: 'Terminée', color: Colors.primaryLight },
  cancelled: { text: 'Annulée', color: Colors.status.error },
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@cleanhouse_auth_token',
  REFRESH_TOKEN: '@cleanhouse_refresh_token',
  USER_DATA: '@cleanhouse_user_data',
  PUSH_TOKEN: '@cleanhouse_push_token',
};

// Mois en français
export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// Jours de la semaine
export const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Regex de validation
export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+33|0)[1-9](\d{2}){4}$/,
  PASSWORD_MIN_LENGTH: 6,
};

// Stripe
export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: 'pk_test_51ShsNC90Od9MQpmiEh5qhipQNjaBktdVx6eieMsc9OpgMdeYbWinmcpG8s0JUBGLilqS59CAG1FT3gCwQ7SMqsXp00HeUwDdeJ',
  MERCHANT_ID: 'merchant.com.cleanhouse',
};

// Notification types
export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_REMINDER: 'booking_reminder',
  BOOKING_COMPLETED: 'booking_completed',
  PAYMENT_CONFIRMED: 'payment_confirmed',
};
