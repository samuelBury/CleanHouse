// Service d'audit - Trace toutes les actions admin
import prisma from '../config/database';
import { AuditLog, Prisma } from '@prisma/client';

export type AuditAction =
  | 'mission.assign'
  | 'mission.reassign'
  | 'mission.cancel'
  | 'mission.status_change'
  | 'professional.create'
  | 'professional.verify'
  | 'professional.suspend'
  | 'professional.reactivate'
  | 'professional.update'
  | 'professional.add_note'
  | 'zone.create'
  | 'zone.update'
  | 'zone.delete'
  | 'zone.assign_professional'
  | 'zone.assign_admin'
  | 'urgency.create'
  | 'urgency.resolve'
  | 'urgency.assign'
  | 'admin.create'
  | 'admin.update'
  | 'admin.deactivate';

export type AuditPayload = Prisma.InputJsonValue;

export interface CreateAuditLogData {
  adminId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  payload?: AuditPayload;
}

// Créer une entrée d'audit
export const createAuditLog = async (
  data: CreateAuditLogData
): Promise<AuditLog> => {
  return prisma.auditLog.create({
    data: {
      adminId: data.adminId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      payload: data.payload ?? undefined,
    },
  });
};

// Récupérer les logs d'audit avec filtres
export interface AuditLogFilters {
  adminId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export const getAuditLogs = async (filters: AuditLogFilters) => {
  const { page = 1, limit = 50, ...where } = filters;
  const skip = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};

  if (where.adminId) whereClause.adminId = where.adminId;
  if (where.entityType) whereClause.entityType = where.entityType;
  if (where.entityId) whereClause.entityId = where.entityId;
  if (where.action) whereClause.action = { contains: where.action };

  if (where.startDate || where.endDate) {
    whereClause.timestamp = {};
    if (where.startDate) (whereClause.timestamp as Record<string, Date>).gte = where.startDate;
    if (where.endDate) (whereClause.timestamp as Record<string, Date>).lte = where.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where: whereClause }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Récupérer l'historique d'une entité spécifique
export const getEntityHistory = async (
  entityType: string,
  entityId: string
) => {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: {
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
  });
};

// Décorateur pour les actions auditées
export const withAudit = async <T>(
  adminId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  operation: () => Promise<T>,
  getPayload?: (result: T) => AuditPayload
): Promise<T> => {
  const result = await operation();

  const payload = getPayload ? getPayload(result) : undefined;

  await createAuditLog({
    adminId,
    action,
    entityType,
    entityId,
    payload,
  });

  return result;
};

export default {
  createAuditLog,
  getAuditLogs,
  getEntityHistory,
  withAudit,
};
