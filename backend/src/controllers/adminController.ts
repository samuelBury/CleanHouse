// Contrôleur pour les fonctionnalités admin (gestion des missions, zones, pros)
import { Request, Response } from 'express';
import prisma from '../config/database';
import * as urgencyService from '../services/urgencyService';
import * as auditService from '../services/auditService';
import * as matchingService from '../services/matchingService';
import * as invitationService from '../services/invitationService';
import * as fileUploadService from '../services/fileUploadService';
import { sendMultiChannelNotification } from '../services/multiChannelNotificationService';
import { UrgencyType, UrgencySeverity, UrgencyStatus } from '@prisma/client';

// ============ DASHBOARD ============

// Statistiques du dashboard admin
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      pendingMissions,
      todayMissions,
      activePros,
      totalZones,
      recentMissions,
    ] = await Promise.all([
      // Missions en attente d'assignation
      prisma.mission.count({
        where: { status: 'pending' },
      }),
      // Missions du jour
      prisma.mission.count({
        where: {
          booking: {
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
        },
      }),
      // Pros actifs et disponibles
      prisma.professional.count({
        where: { isAvailable: true, isVerified: true },
      }),
      // Zones actives
      prisma.zone.count({
        where: { isActive: true },
      }),
      // 10 dernières missions
      prisma.mission.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              user: {
                select: { name: true, email: true, phone: true },
              },
            },
          },
          professional: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          pendingMissions,
          todayMissions,
          activePros,
          totalZones,
        },
        recentMissions: recentMissions.map(m => ({
          id: m.id,
          status: m.status,
          service: m.booking.service,
          date: m.booking.date,
          time: m.booking.time,
          address: m.booking.address,
          price: m.booking.price,
          proEarning: m.proEarning,
          client: m.booking.user,
          professional: m.professional
            ? `${m.professional.firstName} ${m.professional.lastName}`
            : null,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============ MISSIONS ============

// Liste des missions avec filtres
export const getMissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (date) {
      const filterDate = new Date(date as string);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.booking = {
        date: {
          gte: filterDate,
          lt: nextDay,
        },
      };
    }

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: [
          { status: 'asc' }, // pending en premier
          { createdAt: 'desc' },
        ],
        include: {
          booking: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true },
              },
            },
          },
          professional: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
      }),
      prisma.mission.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        missions: missions.map(m => ({
          id: m.id,
          bookingId: m.bookingId,
          status: m.status,
          service: m.booking.service,
          date: m.booking.date,
          time: m.booking.time,
          duration: m.booking.duration,
          address: m.booking.address,
          latitude: m.booking.latitude,
          longitude: m.booking.longitude,
          price: m.booking.price,
          proEarning: m.proEarning,
          notes: m.booking.notes,
          client: m.booking.user,
          professional: m.professional,
          assignedAt: m.assignedAt,
          startedAt: m.startedAt,
          completedAt: m.completedAt,
          createdAt: m.createdAt,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get missions error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Assigner une mission à un professionnel
export const assignMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId } = req.params;
    const { professionalId } = req.body;

    if (!professionalId) {
      res.status(400).json({
        success: false,
        message: 'ID du professionnel requis',
      });
      return;
    }

    // Vérifier que la mission existe et est en attente
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: { booking: true },
    });

    if (!mission) {
      res.status(404).json({
        success: false,
        message: 'Mission non trouvée',
      });
      return;
    }

    if (mission.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Cette mission ne peut pas être assignée (statut: ' + mission.status + ')',
      });
      return;
    }

    // Vérifier que le professionnel existe et est disponible
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
    });

    if (!professional) {
      res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé',
      });
      return;
    }

    if (!professional.isVerified) {
      res.status(400).json({
        success: false,
        message: 'Ce professionnel n\'est pas encore vérifié',
      });
      return;
    }

    // Assigner la mission
    const updatedMission = await prisma.mission.update({
      where: { id: missionId },
      data: {
        professionalId,
        status: 'assigned',
        assignedAt: new Date(),
        assignedBy: req.admin!.id,
      },
      include: {
        booking: {
          include: {
            user: {
              select: { name: true, email: true, phone: true },
            },
          },
        },
        professional: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });

    // Mettre à jour le booking avec le nom du pro
    await prisma.booking.update({
      where: { id: mission.bookingId },
      data: {
        professional: `${professional.firstName} ${professional.lastName}`,
      },
    });

    // Envoyer une notification multi-canal au professionnel
    try {
      await sendMultiChannelNotification(professional.id, 'assignment', {
        missionId: missionId,
        clientName: updatedMission.booking.user.name,
        address: updatedMission.booking.address,
        date: updatedMission.booking.date,
        time: updatedMission.booking.time,
        duration: updatedMission.booking.duration,
        service: updatedMission.booking.service,
      });
    } catch (error) {
      console.error('Erreur envoi notification assignation:', error);
    }

    res.json({
      success: true,
      data: {
        mission: {
          id: updatedMission.id,
          status: updatedMission.status,
          assignedAt: updatedMission.assignedAt,
          professional: updatedMission.professional,
        },
      },
      message: 'Mission assignée avec succès',
    });
  } catch (error) {
    console.error('Assign mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Annuler une mission
export const cancelMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId } = req.params;
    const { reason } = req.body;

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
    });

    if (!mission) {
      res.status(404).json({
        success: false,
        message: 'Mission non trouvée',
      });
      return;
    }

    if (['completed', 'cancelled'].includes(mission.status)) {
      res.status(400).json({
        success: false,
        message: 'Cette mission ne peut pas être annulée',
      });
      return;
    }

    const updatedMission = await prisma.mission.update({
      where: { id: missionId },
      data: { status: 'cancelled' },
    });

    // Mettre à jour le booking
    await prisma.booking.update({
      where: { id: mission.bookingId },
      data: { status: 'cancelled' },
    });

    res.json({
      success: true,
      data: { mission: updatedMission },
      message: 'Mission annulée',
    });
  } catch (error) {
    console.error('Cancel mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============ ZONES ============

// Liste des zones
export const getZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const zones = await prisma.zone.findMany({
      orderBy: { name: 'asc' },
      include: {
        professionals: {
          include: {
            professional: {
              select: { id: true, firstName: true, lastName: true, isAvailable: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        zones: zones.map(z => ({
          id: z.id,
          name: z.name,
          postalCodes: z.postalCodes,
          isActive: z.isActive,
          professionals: z.professionals.map(pz => ({
            ...pz.professional,
            priority: pz.priority,
          })),
          createdAt: z.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get zones error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Créer une zone
export const createZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, postalCodes } = req.body;

    if (!name || !postalCodes || !Array.isArray(postalCodes)) {
      res.status(400).json({
        success: false,
        message: 'Nom et codes postaux requis',
      });
      return;
    }

    // Vérifier que le nom n'existe pas
    const existing = await prisma.zone.findUnique({
      where: { name },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Une zone avec ce nom existe déjà',
      });
      return;
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        postalCodes,
      },
    });

    res.status(201).json({
      success: true,
      data: { zone },
    });
  } catch (error) {
    console.error('Create zone error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Modifier une zone
export const updateZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;
    const { name, postalCodes, isActive } = req.body;

    const zone = await prisma.zone.update({
      where: { id: zoneId },
      data: {
        ...(name !== undefined && { name }),
        ...(postalCodes !== undefined && { postalCodes }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      data: { zone },
    });
  } catch (error) {
    console.error('Update zone error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Supprimer une zone
export const deleteZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;

    await prisma.zone.delete({
      where: { id: zoneId },
    });

    res.json({
      success: true,
      message: 'Zone supprimée',
    });
  } catch (error) {
    console.error('Delete zone error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Assigner un professionnel à une zone
export const assignProToZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;
    const { professionalId, priority = 0 } = req.body;

    if (!professionalId) {
      res.status(400).json({
        success: false,
        message: 'ID du professionnel requis',
      });
      return;
    }

    // Vérifier que la zone et le pro existent
    const [zone, professional] = await Promise.all([
      prisma.zone.findUnique({ where: { id: zoneId } }),
      prisma.professional.findUnique({ where: { id: professionalId } }),
    ]);

    if (!zone || !professional) {
      res.status(404).json({
        success: false,
        message: 'Zone ou professionnel non trouvé',
      });
      return;
    }

    // Créer ou mettre à jour l'assignation
    const assignment = await prisma.professionalZone.upsert({
      where: {
        professionalId_zoneId: {
          professionalId,
          zoneId,
        },
      },
      update: { priority },
      create: {
        professionalId,
        zoneId,
        priority,
      },
    });

    res.json({
      success: true,
      data: { assignment },
    });
  } catch (error) {
    console.error('Assign pro to zone error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Retirer un professionnel d'une zone
export const removeProFromZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId, professionalId } = req.params;

    await prisma.professionalZone.delete({
      where: {
        professionalId_zoneId: {
          professionalId,
          zoneId,
        },
      },
    });

    res.json({
      success: true,
      message: 'Professionnel retiré de la zone',
    });
  } catch (error) {
    console.error('Remove pro from zone error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============ PROFESSIONNELS ============

// Liste des professionnels
export const getProfessionals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isVerified, isAvailable, zoneId } = req.query;

    const where: any = {};

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

    if (zoneId) {
      where.zones = {
        some: { zoneId: zoneId as string },
      };
    }

    const professionals = await prisma.professional.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        rating: true,
        totalMissions: true,
        isAvailable: true,
        isVerified: true,
        createdAt: true,
        zones: {
          include: {
            zone: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        professionals: professionals.map(p => ({
          ...p,
          zones: p.zones.map(pz => ({
            id: pz.zone.id,
            name: pz.zone.name,
            priority: pz.priority,
          })),
        })),
      },
    });
  } catch (error) {
    console.error('Get professionals error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Vérifier/valider un professionnel
export const verifyProfessional = async (req: Request, res: Response): Promise<void> => {
  try {
    const { professionalId } = req.params;
    const { isVerified } = req.body;

    const professional = await prisma.professional.update({
      where: { id: professionalId },
      data: { isVerified },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
      },
    });

    res.json({
      success: true,
      data: { professional },
      message: isVerified ? 'Professionnel vérifié' : 'Vérification retirée',
    });
  } catch (error) {
    console.error('Verify professional error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Trouver les professionnels disponibles pour une zone (par code postal)
export const findProsForPostalCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postalCode } = req.query;

    if (!postalCode) {
      res.status(400).json({
        success: false,
        message: 'Code postal requis',
      });
      return;
    }

    // Trouver les zones qui couvrent ce code postal
    const zones = await prisma.zone.findMany({
      where: {
        isActive: true,
        postalCodes: {
          has: postalCode as string,
        },
      },
      include: {
        professionals: {
          where: {
            professional: {
              isVerified: true,
              isAvailable: true,
            },
          },
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                rating: true,
                totalMissions: true,
              },
            },
          },
          orderBy: { priority: 'desc' },
        },
      },
    });

    // Regrouper les pros de toutes les zones, en évitant les doublons
    const prosMap = new Map();
    zones.forEach(zone => {
      zone.professionals.forEach(pz => {
        if (!prosMap.has(pz.professional.id)) {
          prosMap.set(pz.professional.id, {
            ...pz.professional,
            zones: [{ id: zone.id, name: zone.name, priority: pz.priority }],
          });
        } else {
          prosMap.get(pz.professional.id).zones.push({
            id: zone.id,
            name: zone.name,
            priority: pz.priority,
          });
        }
      });
    });

    // Trier par priorité maximale
    const professionals = Array.from(prosMap.values()).sort((a, b) => {
      const maxPriorityA = Math.max(...a.zones.map((z: any) => z.priority));
      const maxPriorityB = Math.max(...b.zones.map((z: any) => z.priority));
      return maxPriorityB - maxPriorityA;
    });

    res.json({
      success: true,
      data: {
        postalCode,
        zones: zones.map(z => ({ id: z.id, name: z.name })),
        professionals,
      },
    });
  } catch (error) {
    console.error('Find pros for postal code error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============ URGENCIES ============

// Liste des urgences
export const getUrgencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, severity, page, limit } = req.query;
    const zoneIds = req.adminZoneIds;

    const result = await urgencyService.getUrgencies({
      status: status as UrgencyStatus | undefined,
      type: type as UrgencyType | undefined,
      severity: severity as UrgencySeverity | undefined,
      zoneIds,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get urgencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Détail d'une urgence
export const getUrgencyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { urgencyId } = req.params;

    const urgency = await urgencyService.getUrgencyById(urgencyId);

    if (!urgency) {
      res.status(404).json({
        success: false,
        message: 'Urgence non trouvée',
      });
      return;
    }

    res.json({
      success: true,
      data: { urgency },
    });
  } catch (error) {
    console.error('Get urgency error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Créer une urgence
export const createUrgency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId, type, severity, description } = req.body;

    if (!missionId || !type || !severity) {
      res.status(400).json({
        success: false,
        message: 'missionId, type et severity requis',
      });
      return;
    }

    const urgency = await urgencyService.createUrgency(
      { missionId, type, severity, description },
      req.admin!.id
    );

    res.status(201).json({
      success: true,
      data: { urgency },
    });
  } catch (error) {
    console.error('Create urgency error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Assigner une urgence
export const assignUrgencyToSelf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { urgencyId } = req.params;

    const urgency = await urgencyService.assignUrgency(urgencyId, req.admin!.id);

    res.json({
      success: true,
      data: { urgency },
      message: 'Urgence assignée',
    });
  } catch (error) {
    console.error('Assign urgency error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Résoudre une urgence
export const resolveUrgency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { urgencyId } = req.params;

    const urgency = await urgencyService.resolveUrgency(urgencyId, req.admin!.id);

    res.json({
      success: true,
      data: { urgency },
      message: 'Urgence résolue',
    });
  } catch (error) {
    console.error('Resolve urgency error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Statistiques des urgences
export const getUrgencyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneIds = req.adminZoneIds;
    const stats = await urgencyService.getUrgencyStats(zoneIds);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get urgency stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============ MATCHING ============

// Suggestions de professionnels pour une mission
export const getMissionMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId } = req.params;
    const zoneIds = req.adminZoneIds;

    const matches = await matchingService.getMissionMatchingSuggestions(missionId, zoneIds);

    res.json({
      success: true,
      data: { matches },
    });
  } catch (error) {
    console.error('Get mission matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Réassigner une mission
export const reassignMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId } = req.params;
    const { professionalId, reason } = req.body;

    if (!professionalId) {
      res.status(400).json({
        success: false,
        message: 'ID du professionnel requis',
      });
      return;
    }

    const mission = await matchingService.reassignMission(
      missionId,
      professionalId,
      req.admin!.id,
      reason
    );

    // Log audit
    await auditService.createAuditLog({
      adminId: req.admin!.id,
      action: 'mission.reassign',
      entityType: 'mission',
      entityId: missionId,
      payload: { newProfessionalId: professionalId, reason },
    });

    res.json({
      success: true,
      data: { mission },
      message: 'Mission réassignée',
    });
  } catch (error) {
    console.error('Reassign mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============ AUDIT LOGS ============

// Liste des logs d'audit
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId, entityType, entityId, action, startDate, endDate, page, limit } = req.query;

    // Seuls les super_admin peuvent voir tous les logs
    const filterAdminId = req.admin!.role === 'super_admin'
      ? (adminId as string | undefined)
      : req.admin!.id;

    const result = await auditService.getAuditLogs({
      adminId: filterAdminId,
      entityType: entityType as string | undefined,
      entityId: entityId as string | undefined,
      action: action as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Historique d'une entité
export const getEntityHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, entityId } = req.params;

    const history = await auditService.getEntityHistory(entityType, entityId);

    res.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    console.error('Get entity history error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============ PROFESSIONAL NOTES ============

// Ajouter une note sur un professionnel
export const addProfessionalNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { professionalId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: 'Contenu de la note requis',
      });
      return;
    }

    const note = await prisma.adminNote.create({
      data: {
        professionalId,
        adminId: req.admin!.id,
        content: content.trim(),
      },
      include: {
        admin: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Log audit
    await auditService.createAuditLog({
      adminId: req.admin!.id,
      action: 'professional.add_note',
      entityType: 'professional',
      entityId: professionalId,
    });

    res.status(201).json({
      success: true,
      data: { note },
    });
  } catch (error) {
    console.error('Add professional note error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Lister les notes d'un professionnel
export const getProfessionalNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { professionalId } = req.params;

    const notes = await prisma.adminNote.findMany({
      where: { professionalId },
      include: {
        admin: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { notes },
    });
  } catch (error) {
    console.error('Get professional notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Détail d'un professionnel avec toutes les infos
export const getProfessionalDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { professionalId } = req.params;

    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      include: {
        zones: {
          include: {
            zone: {
              select: { id: true, name: true },
            },
          },
        },
        missions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            booking: {
              select: {
                service: true,
                date: true,
                time: true,
                duration: true,
                address: true,
                price: true,
              },
            },
          },
        },
        adminNotes: {
          include: {
            admin: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        earnings: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!professional) {
      res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé',
      });
      return;
    }

    res.json({
      success: true,
      data: { professional },
    });
  } catch (error) {
    console.error('Get professional detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============ ZONE MANAGEMENT EXTENDED ============

// Assigner un admin à une zone
export const assignAdminToZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      res.status(400).json({
        success: false,
        message: 'ID de l\'admin requis',
      });
      return;
    }

    const assignment = await prisma.adminZone.upsert({
      where: {
        adminId_zoneId: { adminId, zoneId },
      },
      update: {},
      create: { adminId, zoneId },
    });

    await auditService.createAuditLog({
      adminId: req.admin!.id,
      action: 'zone.assign_admin',
      entityType: 'zone',
      entityId: zoneId,
      payload: { assignedAdminId: adminId },
    });

    res.json({
      success: true,
      data: { assignment },
    });
  } catch (error) {
    console.error('Assign admin to zone error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Retirer un admin d'une zone
export const removeAdminFromZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId, adminId } = req.params;

    await prisma.adminZone.delete({
      where: {
        adminId_zoneId: { adminId, zoneId },
      },
    });

    await auditService.createAuditLog({
      adminId: req.admin!.id,
      action: 'zone.assign_admin',
      entityType: 'zone',
      entityId: zoneId,
      payload: { removedAdminId: adminId },
    });

    res.json({
      success: true,
      message: 'Admin retiré de la zone',
    });
  } catch (error) {
    console.error('Remove admin from zone error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Zone detail avec geometry
export const getZoneDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;

    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        professionals: {
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                isAvailable: true,
                isVerified: true,
                rating: true,
              },
            },
          },
        },
        admins: {
          include: {
            admin: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        },
      },
    });

    if (!zone) {
      res.status(404).json({
        success: false,
        message: 'Zone non trouvée',
      });
      return;
    }

    res.json({
      success: true,
      data: { zone },
    });
  } catch (error) {
    console.error('Get zone detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============ CRÉATION PROFESSIONNEL (ONBOARDING) ============

// Géocoder une adresse via Nominatim (OpenStreetMap)
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'CleanHouse-App/1.0',
        },
      }
    );
    const data = await response.json() as Array<{ lat: string; lon: string }>;

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Créer un professionnel avec upload de documents
export const createProfessional = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      socialSecurityNumber,
      createZone,
      zoneRadius = 5, // Rayon en km par défaut
    } = req.body;

    // Validation des champs requis
    if (!firstName || !lastName || !email || !phone || !address) {
      res.status(400).json({
        success: false,
        message: 'Champs requis: firstName, lastName, email, phone, address',
      });
      return;
    }

    // Vérifier si l'email existe déjà
    const existingPro = await prisma.professional.findUnique({
      where: { email },
    });

    if (existingPro) {
      res.status(400).json({
        success: false,
        message: 'Un professionnel avec cet email existe déjà',
      });
      return;
    }

    // Géocoder l'adresse
    const coordinates = await geocodeAddress(address);

    // Upload des fichiers si présents (req.files est un objet avec les noms de champs)
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    let contractUrl: string | undefined;
    let idDocumentUrl: string | undefined;
    let proofOfAddressUrl: string | undefined;
    let carteVitaleUrl: string | undefined;
    let avatarUrl: string | undefined;

    if (files?.contract?.[0]) {
      const result = await fileUploadService.uploadDocument(files.contract[0], 'contract');
      contractUrl = result.url;
    }

    if (files?.idDocument?.[0]) {
      const result = await fileUploadService.uploadDocument(files.idDocument[0], 'id_document');
      idDocumentUrl = result.url;
    }

    if (files?.proofOfAddress?.[0]) {
      const result = await fileUploadService.uploadDocument(files.proofOfAddress[0], 'proof_of_address');
      proofOfAddressUrl = result.url;
    }

    if (files?.carteVitale?.[0]) {
      const result = await fileUploadService.uploadDocument(files.carteVitale[0], 'carte_vitale');
      carteVitaleUrl = result.url;
    }

    if (files?.avatar?.[0]) {
      const result = await fileUploadService.uploadDocument(files.avatar[0], 'avatar');
      avatarUrl = result.url;
    }

    // Créer le professionnel (sans mot de passe)
    const professional = await prisma.professional.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        postalCode,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
        socialSecurityNumber,
        contractUrl,
        idDocumentUrl,
        proofOfAddressUrl,
        carteVitaleUrl,
        avatar: avatarUrl,
        password: null, // Sera défini lors de l'acceptation de l'invitation
        accountSetupComplete: false,
      },
    });

    // Créer une zone automatique autour du pro si demandé
    if (createZone === 'true' || createZone === true) {
      if (coordinates) {
        const zoneName = `Zone ${firstName} ${lastName}`;

        const zone = await prisma.zone.create({
          data: {
            name: zoneName,
            postalCodes: [], // Pas de codes postaux pour une zone par rayon
            centerLat: coordinates.lat,
            centerLng: coordinates.lng,
            radius: parseFloat(zoneRadius),
            geometry: {
              type: 'Circle',
              center: [coordinates.lng, coordinates.lat],
              radius: parseFloat(zoneRadius) * 1000, // En mètres
            },
          },
        });

        // Assigner le pro à sa zone
        await prisma.professionalZone.create({
          data: {
            professionalId: professional.id,
            zoneId: zone.id,
            priority: 10, // Haute priorité dans sa propre zone
          },
        });
      }
    }

    // Envoyer l'invitation par email
    await invitationService.createAndSendInvitation(professional.id);

    // Log audit
    await auditService.createAuditLog({
      adminId: req.admin!.id,
      action: 'professional.create',
      entityType: 'professional',
      entityId: professional.id,
      payload: { email, firstName, lastName },
    });

    res.status(201).json({
      success: true,
      data: {
        professional: {
          id: professional.id,
          email: professional.email,
          firstName: professional.firstName,
          lastName: professional.lastName,
          phone: professional.phone,
          address: professional.address,
          latitude: professional.latitude,
          longitude: professional.longitude,
          contractUrl: professional.contractUrl,
          idDocumentUrl: professional.idDocumentUrl,
          proofOfAddressUrl: professional.proofOfAddressUrl,
          carteVitaleUrl: professional.carteVitaleUrl,
          avatar: professional.avatar,
          accountSetupComplete: professional.accountSetupComplete,
        },
      },
      message: 'Professionnel créé et invitation envoyée',
    });
  } catch (error) {
    console.error('Create professional error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Renvoyer l'invitation à un professionnel
export const resendInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { professionalId } = req.params;

    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
    });

    if (!professional) {
      res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé',
      });
      return;
    }

    if (professional.accountSetupComplete) {
      res.status(400).json({
        success: false,
        message: 'Ce compte a déjà été configuré',
      });
      return;
    }

    await invitationService.resendInvitation(professionalId);

    res.json({
      success: true,
      message: 'Invitation renvoyée',
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============ CALENDRIER ============

// Récupérer les missions pour le calendrier
export const getCalendarMissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start, end, zoneId, professionalId, status } = req.query;

    if (!start || !end) {
      res.status(400).json({
        success: false,
        message: 'Dates start et end requises',
      });
      return;
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    const where: any = {
      booking: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    };

    if (professionalId) {
      where.professionalId = professionalId;
    }

    if (status) {
      where.status = status;
    }

    // Si un zoneId est spécifié, filtrer par pros de cette zone
    if (zoneId) {
      const prosInZone = await prisma.professionalZone.findMany({
        where: { zoneId: zoneId as string },
        select: { professionalId: true },
      });
      const proIds = prosInZone.map(pz => pz.professionalId);
      where.professionalId = { in: proIds };
    }

    const missions = await prisma.mission.findMany({
      where,
      include: {
        booking: {
          include: {
            user: {
              select: { name: true, phone: true },
            },
          },
        },
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        booking: { date: 'asc' },
      },
    });

    // Formater pour le calendrier (format compatible react-big-calendar / FullCalendar)
    const events = missions.map(mission => {
      const startDateTime = new Date(mission.booking.date);
      const [hours, minutes] = mission.booking.time.split(':').map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + mission.booking.duration);

      // Couleur selon le statut
      const statusColors: Record<string, string> = {
        pending: '#FFA500', // Orange
        assigned: '#2196F3', // Bleu
        in_progress: '#4CAF50', // Vert
        completed: '#9E9E9E', // Gris
        cancelled: '#F44336', // Rouge
      };

      return {
        id: mission.id,
        title: mission.professional
          ? `${mission.professional.firstName} - ${mission.booking.service}`
          : `Non assigné - ${mission.booking.service}`,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        color: statusColors[mission.status] || '#9E9E9E',
        extendedProps: {
          missionId: mission.id,
          status: mission.status,
          service: mission.booking.service,
          address: mission.booking.address,
          client: mission.booking.user.name,
          clientPhone: mission.booking.user.phone,
          professional: mission.professional
            ? {
                id: mission.professional.id,
                name: `${mission.professional.firstName} ${mission.professional.lastName}`,
                avatar: mission.professional.avatar,
              }
            : null,
          price: mission.booking.price,
          proEarning: mission.proEarning,
          duration: mission.booking.duration,
        },
      };
    });

    res.json({
      success: true,
      data: {
        events,
        total: events.length,
      },
    });
  } catch (error) {
    console.error('Get calendar missions error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// ============ LOCALISATION ============

// Obtenir toutes les positions des pros en temps réel
export const getAllProsLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { activeOnly, inMissionOnly } = req.query;

    const where: any = {};

    if (activeOnly === 'true') {
      where.isLocationSharing = true;
    }

    const professionals = await prisma.professional.findMany({
      where: {
        ...where,
        lastKnownLatitude: { not: null },
        lastKnownLongitude: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        lastKnownLatitude: true,
        lastKnownLongitude: true,
        lastLocationUpdate: true,
        isLocationSharing: true,
        latitude: true,
        longitude: true,
        radius: true,
        address: true,
        missions: {
          where: {
            status: 'in_progress',
          },
          take: 1,
          include: {
            booking: {
              select: {
                address: true,
                service: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
    });

    let filteredPros = professionals;

    // Filtrer uniquement les pros en mission si demandé
    if (inMissionOnly === 'true') {
      filteredPros = professionals.filter(p => p.missions.length > 0);
    }

    res.json({
      success: true,
      data: {
        professionals: filteredPros.map(pro => ({
          id: pro.id,
          name: `${pro.firstName} ${pro.lastName}`,
          avatar: pro.avatar,
          phone: pro.phone,
          location: {
            latitude: pro.lastKnownLatitude,
            longitude: pro.lastKnownLongitude,
            updatedAt: pro.lastLocationUpdate,
          },
          isSharing: pro.isLocationSharing,
          homeLocation: pro.latitude && pro.longitude
            ? { latitude: pro.latitude, longitude: pro.longitude }
            : null,
          radius: pro.radius,
          address: pro.address,
          currentMission: pro.missions[0]
            ? {
                id: pro.missions[0].id,
                address: pro.missions[0].booking.address,
                service: pro.missions[0].booking.service,
                destination: {
                  latitude: pro.missions[0].booking.latitude,
                  longitude: pro.missions[0].booking.longitude,
                },
              }
            : null,
        })),
      },
    });
  } catch (error) {
    console.error('Get all pros locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Obtenir les zones d'intervention de tous les pros (basé sur adresse domicile)
export const getAllProsZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const professionals = await prisma.professional.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        latitude: true,
        longitude: true,
        radius: true,
        address: true,
      },
    });

    res.json({
      success: true,
      data: {
        professionals: professionals.map(pro => ({
          id: pro.id,
          name: `${pro.firstName} ${pro.lastName}`,
          avatar: pro.avatar,
          phone: pro.phone,
          homeLocation: {
            latitude: pro.latitude,
            longitude: pro.longitude,
          },
          radius: pro.radius,
          address: pro.address,
        })),
      },
    });
  } catch (error) {
    console.error('Get all pros zones error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Obtenir la position d'un professionnel spécifique
export const getProLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { professionalId } = req.params;

    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        lastKnownLatitude: true,
        lastKnownLongitude: true,
        lastLocationUpdate: true,
        isLocationSharing: true,
      },
    });

    if (!professional) {
      res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        professional: {
          id: professional.id,
          name: `${professional.firstName} ${professional.lastName}`,
          avatar: professional.avatar,
          phone: professional.phone,
          location: professional.lastKnownLatitude && professional.lastKnownLongitude
            ? {
                latitude: professional.lastKnownLatitude,
                longitude: professional.lastKnownLongitude,
                updatedAt: professional.lastLocationUpdate,
              }
            : null,
          isSharing: professional.isLocationSharing,
        },
      },
    });
  } catch (error) {
    console.error('Get pro location error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Obtenir l'historique de localisation d'une mission
export const getMissionLocationHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId } = req.params;

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        professional: {
          select: { firstName: true, lastName: true },
        },
        booking: {
          select: { address: true, latitude: true, longitude: true },
        },
      },
    });

    if (!mission) {
      res.status(404).json({
        success: false,
        message: 'Mission non trouvée',
      });
      return;
    }

    const history = await prisma.proLocationHistory.findMany({
      where: { missionId },
      orderBy: { timestamp: 'asc' },
    });

    res.json({
      success: true,
      data: {
        mission: {
          id: mission.id,
          status: mission.status,
          professional: mission.professional
            ? `${mission.professional.firstName} ${mission.professional.lastName}`
            : null,
          destination: {
            address: mission.booking.address,
            latitude: mission.booking.latitude,
            longitude: mission.booking.longitude,
          },
        },
        locationHistory: history.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: loc.timestamp,
        })),
      },
    });
  } catch (error) {
    console.error('Get mission location history error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};
