// Service de gestion des urgences
import prisma from '../config/database';
import { Urgency, UrgencyType, UrgencySeverity, UrgencyStatus } from '@prisma/client';
import { createAuditLog } from './auditService';

export interface CreateUrgencyData {
  missionId: string;
  type: UrgencyType;
  severity: UrgencySeverity;
  description?: string;
}

export interface UpdateUrgencyData {
  status?: UrgencyStatus;
  resolvedById?: string;
  description?: string;
}

export interface UrgencyFilters {
  status?: UrgencyStatus;
  type?: UrgencyType;
  severity?: UrgencySeverity;
  missionId?: string;
  zoneIds?: string[];
  page?: number;
  limit?: number;
}

// Créer une urgence
export const createUrgency = async (
  data: CreateUrgencyData,
  adminId?: string
): Promise<Urgency> => {
  const urgency = await prisma.urgency.create({
    data: {
      missionId: data.missionId,
      type: data.type,
      severity: data.severity,
      description: data.description,
    },
    include: {
      mission: {
        include: {
          booking: {
            select: {
              address: true,
              date: true,
              time: true,
              user: {
                select: { name: true, email: true, phone: true },
              },
            },
          },
          professional: {
            select: { firstName: true, lastName: true, phone: true },
          },
        },
      },
    },
  });

  if (adminId) {
    await createAuditLog({
      adminId,
      action: 'urgency.create',
      entityType: 'urgency',
      entityId: urgency.id,
      payload: { type: data.type, severity: data.severity },
    });
  }

  return urgency;
};

// Récupérer les urgences avec filtres
export const getUrgencies = async (filters: UrgencyFilters) => {
  const { page = 1, limit = 20, zoneIds, ...where } = filters;
  const skip = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};

  if (where.status) whereClause.status = where.status;
  if (where.type) whereClause.type = where.type;
  if (where.severity) whereClause.severity = where.severity;
  if (where.missionId) whereClause.missionId = where.missionId;

  // Filtrage par zones si spécifié
  if (zoneIds && zoneIds.length > 0) {
    whereClause.mission = {
      professional: {
        zones: {
          some: {
            zoneId: { in: zoneIds },
          },
        },
      },
    };
  }

  const [urgencies, total] = await Promise.all([
    prisma.urgency.findMany({
      where: whereClause,
      include: {
        mission: {
          include: {
            booking: {
              select: {
                id: true,
                address: true,
                date: true,
                time: true,
                service: true,
                user: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
            professional: {
              select: { id: true, firstName: true, lastName: true, phone: true },
            },
          },
        },
        resolvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { severity: 'asc' }, // critical first
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    }),
    prisma.urgency.count({ where: whereClause }),
  ]);

  return {
    urgencies,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Récupérer une urgence par ID
export const getUrgencyById = async (id: string) => {
  return prisma.urgency.findUnique({
    where: { id },
    include: {
      mission: {
        include: {
          booking: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true },
              },
            },
          },
          professional: {
            select: { id: true, firstName: true, lastName: true, phone: true, email: true },
          },
        },
      },
      resolvedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
};

// Résoudre une urgence
export const resolveUrgency = async (
  id: string,
  adminId: string
): Promise<Urgency> => {
  const urgency = await prisma.urgency.update({
    where: { id },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedById: adminId,
    },
  });

  await createAuditLog({
    adminId,
    action: 'urgency.resolve',
    entityType: 'urgency',
    entityId: id,
  });

  return urgency;
};

// Assigner une urgence à un admin
export const assignUrgency = async (
  id: string,
  adminId: string
): Promise<Urgency> => {
  const urgency = await prisma.urgency.update({
    where: { id },
    data: {
      status: 'assigned',
      resolvedById: adminId,
    },
  });

  await createAuditLog({
    adminId,
    action: 'urgency.assign',
    entityType: 'urgency',
    entityId: id,
  });

  return urgency;
};

// Compter les urgences par statut
export const getUrgencyStats = async (zoneIds?: string[]) => {
  const whereClause: Record<string, unknown> = {};

  if (zoneIds && zoneIds.length > 0) {
    whereClause.mission = {
      professional: {
        zones: {
          some: {
            zoneId: { in: zoneIds },
          },
        },
      },
    };
  }

  const [pending, assigned, resolved, bySeverity, byType] = await Promise.all([
    prisma.urgency.count({ where: { ...whereClause, status: 'pending' } }),
    prisma.urgency.count({ where: { ...whereClause, status: 'assigned' } }),
    prisma.urgency.count({ where: { ...whereClause, status: 'resolved' } }),
    prisma.urgency.groupBy({
      by: ['severity'],
      where: { ...whereClause, status: { not: 'resolved' } },
      _count: true,
    }),
    prisma.urgency.groupBy({
      by: ['type'],
      where: { ...whereClause, status: { not: 'resolved' } },
      _count: true,
    }),
  ]);

  return {
    total: pending + assigned,
    pending,
    assigned,
    resolved,
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item.severity] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
};

export default {
  createUrgency,
  getUrgencies,
  getUrgencyById,
  resolveUrgency,
  assignUrgency,
  getUrgencyStats,
};
