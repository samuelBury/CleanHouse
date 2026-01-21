// React Query hooks for Admin Dashboard API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import type {
  UrgencyType,
  UrgencySeverity,
  UrgencyStatus,
} from '../types';

// Query Keys
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  missions: (params?: Record<string, unknown>) => ['missions', params] as const,
  missionMatches: (missionId: string) => ['missions', missionId, 'matches'] as const,
  zones: ['zones'] as const,
  zoneDetail: (zoneId: string) => ['zones', zoneId] as const,
  professionals: (params?: Record<string, unknown>) => ['professionals', params] as const,
  professionalDetail: (id: string) => ['professionals', id] as const,
  professionalNotes: (id: string) => ['professionals', id, 'notes'] as const,
  urgencies: (params?: Record<string, unknown>) => ['urgencies', params] as const,
  urgencyDetail: (id: string) => ['urgencies', id] as const,
  urgencyStats: ['urgencies', 'stats'] as const,
  auditLogs: (params?: Record<string, unknown>) => ['audit-logs', params] as const,
  entityHistory: (entityType: string, entityId: string) => ['audit-logs', entityType, entityId] as const,
};

// ============ DASHBOARD ============
export const useDashboard = () => {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: api.getDashboardStats,
    refetchInterval: 5000, // Polling every 5s
  });
};

// ============ MISSIONS ============
export const useMissions = (params?: { status?: string; date?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.missions(params),
    queryFn: () => api.getMissions(params),
    refetchInterval: 5000,
  });
};

export const useMissionMatches = (missionId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.missionMatches(missionId),
    queryFn: () => api.getMissionMatches(missionId),
    enabled,
  });
};

export const useAssignMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ missionId, professionalId }: { missionId: string; professionalId: string }) =>
      api.assignMission(missionId, professionalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

export const useReassignMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ missionId, professionalId, reason }: { missionId: string; professionalId: string; reason?: string }) =>
      api.reassignMission(missionId, professionalId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
};

export const useCancelMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ missionId, reason }: { missionId: string; reason?: string }) =>
      api.cancelMission(missionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

// ============ ZONES ============
export const useZones = () => {
  return useQuery({
    queryKey: queryKeys.zones,
    queryFn: api.getZones,
  });
};

export const useZoneDetail = (zoneId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.zoneDetail(zoneId),
    queryFn: () => api.getZoneDetail(zoneId),
    enabled,
  });
};

export const useCreateZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones });
    },
  });
};

export const useUpdateZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, data }: { zoneId: string; data: Parameters<typeof api.updateZone>[1] }) =>
      api.updateZone(zoneId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones });
      queryClient.invalidateQueries({ queryKey: queryKeys.zoneDetail(variables.zoneId) });
    },
  });
};

export const useDeleteZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones });
    },
  });
};

export const useAssignProToZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, professionalId, priority }: { zoneId: string; professionalId: string; priority?: number }) =>
      api.assignProToZone(zoneId, professionalId, priority),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones });
      queryClient.invalidateQueries({ queryKey: queryKeys.zoneDetail(variables.zoneId) });
    },
  });
};

export const useRemoveProFromZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, professionalId }: { zoneId: string; professionalId: string }) =>
      api.removeProFromZone(zoneId, professionalId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones });
      queryClient.invalidateQueries({ queryKey: queryKeys.zoneDetail(variables.zoneId) });
    },
  });
};

export const useAssignAdminToZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, adminId }: { zoneId: string; adminId: string }) =>
      api.assignAdminToZone(zoneId, adminId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zoneDetail(variables.zoneId) });
    },
  });
};

export const useRemoveAdminFromZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, adminId }: { zoneId: string; adminId: string }) =>
      api.removeAdminFromZone(zoneId, adminId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zoneDetail(variables.zoneId) });
    },
  });
};

// ============ PROFESSIONALS ============
export const useProfessionals = (params?: { isVerified?: boolean; isAvailable?: boolean; zoneId?: string }) => {
  return useQuery({
    queryKey: queryKeys.professionals(params),
    queryFn: () => api.getProfessionals(params),
  });
};

export const useProfessionalDetail = (professionalId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.professionalDetail(professionalId),
    queryFn: () => api.getProfessionalDetail(professionalId),
    enabled,
  });
};

export const useProfessionalNotes = (professionalId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.professionalNotes(professionalId),
    queryFn: () => api.getProfessionalNotes(professionalId),
    enabled,
  });
};

export const useAddProfessionalNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ professionalId, content }: { professionalId: string; content: string }) =>
      api.addProfessionalNote(professionalId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.professionalNotes(variables.professionalId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.professionalDetail(variables.professionalId) });
    },
  });
};

export const useVerifyProfessional = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ professionalId, isVerified }: { professionalId: string; isVerified: boolean }) =>
      api.verifyProfessional(professionalId, isVerified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });
};

export const useFindProsForPostalCode = (postalCode: string, enabled = true) => {
  return useQuery({
    queryKey: ['professionals', 'search', postalCode],
    queryFn: () => api.findProsForPostalCode(postalCode),
    enabled: enabled && postalCode.length >= 5,
  });
};

// ============ URGENCIES ============
export const useUrgencies = (params?: {
  status?: UrgencyStatus;
  type?: UrgencyType;
  severity?: UrgencySeverity;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: queryKeys.urgencies(params),
    queryFn: () => api.getUrgencies(params),
    refetchInterval: 5000, // Polling every 5s for real-time updates
  });
};

export const useUrgencyDetail = (urgencyId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.urgencyDetail(urgencyId),
    queryFn: () => api.getUrgencyById(urgencyId),
    enabled,
  });
};

export const useUrgencyStats = () => {
  return useQuery({
    queryKey: queryKeys.urgencyStats,
    queryFn: api.getUrgencyStats,
    refetchInterval: 5000,
  });
};

export const useCreateUrgency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createUrgency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgencies'] });
    },
  });
};

export const useAssignUrgency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.assignUrgency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgencies'] });
    },
  });
};

export const useResolveUrgency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.resolveUrgency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgencies'] });
    },
  });
};

// ============ AUDIT LOGS ============
export const useAuditLogs = (params?: {
  adminId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () => api.getAuditLogs(params),
  });
};

export const useEntityHistory = (entityType: string, entityId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.entityHistory(entityType, entityId),
    queryFn: () => api.getEntityHistory(entityType, entityId),
    enabled,
  });
};
