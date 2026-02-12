// Types pour le dashboard admin CleanHouse

export interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'operator';
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Professional {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  avatar?: string;
  rating: number;
  totalMissions: number;
  isAvailable: boolean;
  isVerified: boolean;
  createdAt: string;
  zones?: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  postalCodes: string[];
  isActive: boolean;
  professionals?: Professional[];
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Mission {
  id: string;
  bookingId: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  service: 'MENAGE' | 'REPASSAGE' | 'MENAGE_REPASSAGE';
  date: string;
  time: string;
  duration: number;
  address: string;
  latitude?: number;
  longitude?: number;
  price: number;
  proEarning: number;
  notes?: string;
  client: Client;
  professional?: Professional | null;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  pendingMissions: number;
  todayMissions: number;
  activePros: number;
  totalZones: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  totalPages?: number;
}

// Urgency types
export type UrgencyType = 'no_show' | 'lateness' | 'cancellation' | 'complaint';
export type UrgencySeverity = 'critical' | 'high' | 'medium' | 'low';
export type UrgencyStatus = 'pending' | 'assigned' | 'resolved';

export interface UrgencyMission {
  id: string;
  status: string;
  booking: {
    id: string;
    address: string;
    date: string;
    time: string;
    service: string;
    user?: {
      id: string;
      name: string;
      phone?: string;
    };
  };
  professional?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export interface Urgency {
  id: string;
  missionId: string;
  mission: UrgencyMission;
  type: UrgencyType;
  severity: UrgencySeverity;
  status: UrgencyStatus;
  description?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: Pick<Admin, 'id' | 'firstName' | 'lastName'>;
}

export interface UrgencyStats {
  total: number;
  pending: number;
  assigned: number;
  resolved: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}

// Matching types
export interface MatchedProfessional {
  professional: Pick<Professional, 'id' | 'firstName' | 'lastName' | 'phone' | 'rating' | 'totalMissions' | 'avatar'>;
  score: number;
  distance: number;
  availability: boolean;
  reasons: string[];
}

// Audit types
export interface AuditLog {
  id: string;
  adminId: string;
  admin: Pick<Admin, 'id' | 'firstName' | 'lastName' | 'email'>;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

// Admin notes
export interface AdminNote {
  id: string;
  professionalId: string;
  adminId: string;
  admin: Pick<Admin, 'id' | 'firstName' | 'lastName'>;
  content: string;
  createdAt: string;
}

// Extended Professional detail
export interface ProfessionalDetail extends Professional {
  avatar?: string;
  bio?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  stripeAccountId?: string;
  missions?: Mission[];
  adminNotes?: AdminNote[];
  earnings?: Earning[];
}

export interface Earning {
  id: string;
  amount: number;
  description: string;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
}

// Extended Zone detail
export interface ZoneDetail extends Zone {
  geometry?: unknown; // GeoJSON geometry
  centerLat?: number;
  centerLng?: number;
  radius?: number;
  admins?: Pick<Admin, 'id' | 'firstName' | 'lastName' | 'role'>[];
}

// Admin Zone assignment
export interface AdminZone {
  id: string;
  adminId: string;
  zoneId: string;
}
