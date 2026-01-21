// API Service pour le dashboard admin
import axios from 'axios';
import type {
  Admin,
  Mission,
  Zone,
  ZoneDetail,
  Professional,
  ProfessionalDetail,
  DashboardStats,
  Pagination,
  Urgency,
  UrgencyStats,
  UrgencyType,
  UrgencySeverity,
  UrgencyStatus,
  MatchedProfessional,
  AuditLog,
  AdminNote,
} from '../types';

const api = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { accessToken } = response.data.data;
          localStorage.setItem('adminToken', accessToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (email: string, password: string): Promise<{ admin: Admin; accessToken: string; refreshToken: string }> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
};

export const logout = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('adminRefreshToken');
  await api.post('/auth/logout', { refreshToken });
};

export const getMe = async (): Promise<Admin> => {
  const response = await api.get('/auth/me');
  return response.data.data.admin;
};

// Dashboard
export const getDashboardStats = async (): Promise<{ stats: DashboardStats; recentMissions: Mission[] }> => {
  const response = await api.get('/dashboard');
  return response.data.data;
};

// Missions
export const getMissions = async (params?: { status?: string; date?: string; page?: number; limit?: number }): Promise<{ missions: Mission[]; pagination: Pagination }> => {
  const response = await api.get('/missions', { params });
  return response.data.data;
};

export const assignMission = async (missionId: string, professionalId: string): Promise<Mission> => {
  const response = await api.post(`/missions/${missionId}/assign`, { professionalId });
  return response.data.data.mission;
};

export const cancelMission = async (missionId: string, reason?: string): Promise<Mission> => {
  const response = await api.post(`/missions/${missionId}/cancel`, { reason });
  return response.data.data.mission;
};

// Zones
export const getZones = async (): Promise<Zone[]> => {
  const response = await api.get('/zones');
  return response.data.data.zones;
};

export const createZone = async (data: { name: string; postalCodes: string[] }): Promise<Zone> => {
  const response = await api.post('/zones', data);
  return response.data.data.zone;
};

export const updateZone = async (zoneId: string, data: Partial<Zone>): Promise<Zone> => {
  const response = await api.put(`/zones/${zoneId}`, data);
  return response.data.data.zone;
};

export const deleteZone = async (zoneId: string): Promise<void> => {
  await api.delete(`/zones/${zoneId}`);
};

export const assignProToZone = async (zoneId: string, professionalId: string, priority?: number): Promise<void> => {
  await api.post(`/zones/${zoneId}/professionals`, { professionalId, priority });
};

export const removeProFromZone = async (zoneId: string, professionalId: string): Promise<void> => {
  await api.delete(`/zones/${zoneId}/professionals/${professionalId}`);
};

// Professionals
export const getProfessionals = async (params?: { isVerified?: boolean; isAvailable?: boolean; zoneId?: string }): Promise<Professional[]> => {
  const response = await api.get('/professionals', { params });
  return response.data.data.professionals;
};

export const createProfessional = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  idDocument?: File;
  proofOfAddress?: File;
}): Promise<Professional> => {
  const formData = new FormData();
  formData.append('firstName', data.firstName);
  formData.append('lastName', data.lastName);
  formData.append('email', data.email);
  formData.append('phone', data.phone);
  if (data.address) formData.append('address', data.address);
  if (data.idDocument) formData.append('idDocument', data.idDocument);
  if (data.proofOfAddress) formData.append('proofOfAddress', data.proofOfAddress);

  const response = await api.post('/professionals', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data.professional;
};

export const verifyProfessional = async (professionalId: string, isVerified: boolean): Promise<Professional> => {
  const response = await api.put(`/professionals/${professionalId}/verify`, { isVerified });
  return response.data.data.professional;
};

export const findProsForPostalCode = async (postalCode: string): Promise<{ zones: Zone[]; professionals: Professional[] }> => {
  const response = await api.get('/professionals/search', { params: { postalCode } });
  return response.data.data;
};

export const getProfessionalDetail = async (professionalId: string): Promise<ProfessionalDetail> => {
  const response = await api.get(`/professionals/${professionalId}`);
  return response.data.data.professional;
};

export const getProfessionalNotes = async (professionalId: string): Promise<AdminNote[]> => {
  const response = await api.get(`/professionals/${professionalId}/notes`);
  return response.data.data.notes;
};

export const addProfessionalNote = async (professionalId: string, content: string): Promise<AdminNote> => {
  const response = await api.post(`/professionals/${professionalId}/notes`, { content });
  return response.data.data.note;
};

// Mission matching
export const getMissionMatches = async (missionId: string): Promise<MatchedProfessional[]> => {
  const response = await api.get(`/missions/${missionId}/matches`);
  return response.data.data.matches;
};

export const reassignMission = async (missionId: string, professionalId: string, reason?: string): Promise<Mission> => {
  const response = await api.post(`/missions/${missionId}/reassign`, { professionalId, reason });
  return response.data.data.mission;
};

// Urgencies
export const getUrgencies = async (params?: {
  status?: UrgencyStatus;
  type?: UrgencyType;
  severity?: UrgencySeverity;
  page?: number;
  limit?: number;
}): Promise<{ urgencies: Urgency[]; pagination: Pagination }> => {
  const response = await api.get('/urgencies', { params });
  return response.data.data;
};

export const getUrgencyById = async (urgencyId: string): Promise<Urgency> => {
  const response = await api.get(`/urgencies/${urgencyId}`);
  return response.data.data.urgency;
};

export const getUrgencyStats = async (): Promise<UrgencyStats> => {
  const response = await api.get('/urgencies/stats');
  return response.data.data;
};

export const createUrgency = async (data: {
  missionId: string;
  type: UrgencyType;
  severity: UrgencySeverity;
  description?: string;
}): Promise<Urgency> => {
  const response = await api.post('/urgencies', data);
  return response.data.data.urgency;
};

export const assignUrgency = async (urgencyId: string): Promise<Urgency> => {
  const response = await api.post(`/urgencies/${urgencyId}/assign`);
  return response.data.data.urgency;
};

export const resolveUrgency = async (urgencyId: string): Promise<Urgency> => {
  const response = await api.post(`/urgencies/${urgencyId}/resolve`);
  return response.data.data.urgency;
};

// Zones extended
export const getZoneDetail = async (zoneId: string): Promise<ZoneDetail> => {
  const response = await api.get(`/zones/${zoneId}`);
  return response.data.data.zone;
};

export const assignAdminToZone = async (zoneId: string, adminId: string): Promise<void> => {
  await api.post(`/zones/${zoneId}/admins`, { adminId });
};

export const removeAdminFromZone = async (zoneId: string, adminId: string): Promise<void> => {
  await api.delete(`/zones/${zoneId}/admins/${adminId}`);
};

// Locations
export interface ProfessionalLocation {
  id: string;
  name: string;
  avatar: string | null;
  location: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  isSharing: boolean;
  currentMission: {
    id: string;
    address: string;
    service: string;
  } | null;
}

export const getProLocations = async (activeOnly?: boolean): Promise<ProfessionalLocation[]> => {
  const response = await api.get('/professionals/locations', { params: { activeOnly } });
  return response.data.data.professionals;
};

export const getProLocation = async (professionalId: string): Promise<ProfessionalLocation> => {
  const response = await api.get(`/professionals/${professionalId}/location`);
  return response.data.data.professional;
};

// Audit logs
export const getAuditLogs = async (params?: {
  adminId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ logs: AuditLog[]; pagination: Pagination }> => {
  const response = await api.get('/audit-logs', { params });
  return response.data.data;
};

export const getEntityHistory = async (entityType: string, entityId: string): Promise<AuditLog[]> => {
  const response = await api.get(`/audit-logs/${entityType}/${entityId}`);
  return response.data.data.history;
};

// Pro Auth (public endpoints - no authentication required)
const proApi = axios.create({
  baseURL: '/api/pro/auth',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const validateInvitationToken = async (token: string): Promise<{ professional: { firstName: string; lastName: string; email: string } }> => {
  const response = await proApi.get(`/invitation/${token}`);
  return response.data.data;
};

export const setupProfessionalAccount = async (data: { token: string; password: string; pseudonyme: string }): Promise<void> => {
  await proApi.post('/setup-account', data);
};

export default api;
