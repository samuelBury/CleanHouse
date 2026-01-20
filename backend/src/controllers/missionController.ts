// Controller des missions pour les professionnels
import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';

// Tarifs horaires pour les pros (ce qu'ils gagnent)
const PRO_HOURLY_RATES: Record<string, number> = {
  MENAGE: 15,
  REPASSAGE: 12,
  MENAGE_REPASSAGE: 20,
};

// Obtenir les missions disponibles (plus utilisé - les missions sont assignées par l'admin)
export const getAvailableMissions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  // Retourne une liste vide - les missions sont maintenant assignées par l'admin
  res.json({
    success: true,
    data: { missions: [] },
    message: 'Les missions sont désormais assignées directement par l\'administration',
  });
});

// Obtenir mes missions (assignées, en cours)
export const getMyMissions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const { status } = req.query;

  const whereClause: any = {
    professionalId: req.professional.id,
  };

  if (status) {
    whereClause.status = status;
  } else {
    // Par défaut, missions assignées ou en cours
    whereClause.status = {
      in: ['assigned', 'in_progress'],
    };
  }

  const missions = await prisma.mission.findMany({
    where: whereClause,
    include: {
      booking: {
        include: {
          user: {
            select: {
              name: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: {
      booking: {
        date: 'asc',
      },
    },
  });

  res.json({
    success: true,
    data: { missions },
  });
});

// Obtenir l'historique des missions
export const getMissionHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const missions = await prisma.mission.findMany({
    where: {
      professionalId: req.professional.id,
      status: {
        in: ['completed', 'cancelled'],
      },
    },
    include: {
      booking: {
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
  });

  res.json({
    success: true,
    data: { missions },
  });
});

// Accepter une mission (plus utilisé - les missions sont assignées automatiquement par l'admin)
export const acceptMission = asyncHandler(async (req: Request, res: Response) => {
  // Les missions sont maintenant assignées directement par l'administration
  // Cette fonction est conservée pour compatibilité mais retourne une erreur
  throw createError('Les missions sont désormais assignées automatiquement par l\'administration', 400);
});

// Démarrer une mission
export const startMission = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const { missionId } = req.params;

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
  });

  if (!mission) {
    throw createError('Mission non trouvée', 404);
  }

  if (mission.professionalId !== req.professional.id) {
    throw createError('Cette mission ne vous appartient pas', 403);
  }

  if (mission.status !== 'assigned') {
    throw createError('Cette mission ne peut pas être démarrée', 400);
  }

  const updatedMission = await prisma.mission.update({
    where: { id: missionId },
    data: {
      status: 'in_progress',
      startedAt: new Date(),
    },
    include: {
      booking: {
        include: {
          user: {
            select: {
              name: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  // Mettre à jour le statut du booking
  await prisma.booking.update({
    where: { id: mission.bookingId },
    data: { status: 'in_progress' },
  });

  res.json({
    success: true,
    message: 'Mission démarrée',
    data: { mission: updatedMission },
  });
});

// Terminer une mission
export const completeMission = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const { missionId } = req.params;

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: { booking: true },
  });

  if (!mission) {
    throw createError('Mission non trouvée', 404);
  }

  if (mission.professionalId !== req.professional.id) {
    throw createError('Cette mission ne vous appartient pas', 403);
  }

  if (mission.status !== 'in_progress') {
    throw createError('Cette mission ne peut pas être terminée', 400);
  }

  // Terminer la mission
  const updatedMission = await prisma.mission.update({
    where: { id: missionId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
    include: {
      booking: true,
    },
  });

  // Mettre à jour le booking
  await prisma.booking.update({
    where: { id: mission.bookingId },
    data: { status: 'completed' },
  });

  // Créer l'entrée de gain
  await prisma.earning.create({
    data: {
      professionalId: req.professional.id,
      missionId: missionId,
      amount: mission.proEarning,
      description: `Mission ${mission.booking.service} - ${mission.booking.duration}h`,
    },
  });

  // Mettre à jour le compteur de missions du pro
  await prisma.professional.update({
    where: { id: req.professional.id },
    data: {
      totalMissions: {
        increment: 1,
      },
    },
  });

  res.json({
    success: true,
    message: 'Mission terminée',
    data: { mission: updatedMission },
  });
});

// Annuler une mission
export const cancelMission = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const { missionId } = req.params;
  const { reason } = req.body;

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
  });

  if (!mission) {
    throw createError('Mission non trouvée', 404);
  }

  if (mission.professionalId !== req.professional.id) {
    throw createError('Cette mission ne vous appartient pas', 403);
  }

  if (mission.status === 'completed' || mission.status === 'cancelled') {
    throw createError('Cette mission ne peut pas être annulée', 400);
  }

  // Annuler et remettre la mission en attente d'assignation
  const updatedMission = await prisma.mission.update({
    where: { id: missionId },
    data: {
      professionalId: null,
      status: 'pending',
      assignedAt: null,
      startedAt: null,
      assignedBy: null,
    },
  });

  // Mettre à jour le booking
  await prisma.booking.update({
    where: { id: mission.bookingId },
    data: {
      professional: null,
      status: 'confirmed',
    },
  });

  res.json({
    success: true,
    message: 'Mission annulée',
    data: { mission: updatedMission },
  });
});

// Obtenir les gains
export const getEarnings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const { month, year } = req.query;

  const currentDate = new Date();
  const targetMonth = month ? parseInt(month as string) - 1 : currentDate.getMonth();
  const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  // Gains du mois
  const earnings = await prisma.earning.findMany({
    where: {
      professionalId: req.professional.id,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Total du mois
  const totalMonth = earnings.reduce((sum, e) => sum + e.amount, 0);

  // Total global
  const allEarnings = await prisma.earning.aggregate({
    where: {
      professionalId: req.professional.id,
    },
    _sum: {
      amount: true,
    },
  });

  // Gains en attente de paiement
  const pendingEarnings = await prisma.earning.aggregate({
    where: {
      professionalId: req.professional.id,
      isPaid: false,
    },
    _sum: {
      amount: true,
    },
  });

  // Nombre de missions ce mois
  const missionsThisMonth = await prisma.mission.count({
    where: {
      professionalId: req.professional.id,
      status: 'completed',
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  res.json({
    success: true,
    data: {
      earnings,
      totalMonth,
      totalAll: allEarnings._sum.amount || 0,
      pendingPayment: pendingEarnings._sum.amount || 0,
      missionsThisMonth,
      month: targetMonth + 1,
      year: targetYear,
    },
  });
});

// Statistiques du tableau de bord
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  // Missions assignées (à venir)
  const assignedMissions = await prisma.mission.count({
    where: {
      professionalId: req.professional.id,
      status: 'assigned',
    },
  });

  // Missions en cours
  const activeMissions = await prisma.mission.count({
    where: {
      professionalId: req.professional.id,
      status: {
        in: ['assigned', 'in_progress'],
      },
    },
  });

  // Missions cette semaine
  const missionsThisWeek = await prisma.mission.count({
    where: {
      professionalId: req.professional.id,
      status: 'completed',
      completedAt: {
        gte: startOfWeek,
      },
    },
  });

  // Gains cette semaine
  const earningsThisWeek = await prisma.earning.aggregate({
    where: {
      professionalId: req.professional.id,
      createdAt: {
        gte: startOfWeek,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Gains ce mois
  const earningsThisMonth = await prisma.earning.aggregate({
    where: {
      professionalId: req.professional.id,
      createdAt: {
        gte: startOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Info du pro
  const professional = await prisma.professional.findUnique({
    where: { id: req.professional.id },
    select: {
      rating: true,
      totalMissions: true,
      isVerified: true,
    },
  });

  res.json({
    success: true,
    data: {
      assignedMissions,
      activeMissions,
      missionsThisWeek,
      earningsThisWeek: earningsThisWeek._sum.amount || 0,
      earningsThisMonth: earningsThisMonth._sum.amount || 0,
      rating: professional?.rating || 5.0,
      totalMissions: professional?.totalMissions || 0,
      isVerified: professional?.isVerified || false,
    },
  });
});
