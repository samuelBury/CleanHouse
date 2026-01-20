// Controller pour la géolocalisation des professionnels
import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';

// Mettre à jour la position d'un professionnel
export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const { latitude, longitude, missionId } = req.body;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw createError('Latitude et longitude requises', 400);
  }

  // Mettre à jour la position actuelle du pro
  await prisma.professional.update({
    where: { id: req.professional.id },
    data: {
      lastKnownLatitude: latitude,
      lastKnownLongitude: longitude,
      lastLocationUpdate: new Date(),
    },
  });

  // Sauvegarder dans l'historique si partage actif
  const pro = await prisma.professional.findUnique({
    where: { id: req.professional.id },
    select: { isLocationSharing: true },
  });

  if (pro?.isLocationSharing) {
    await prisma.proLocationHistory.create({
      data: {
        professionalId: req.professional.id,
        missionId: missionId || null,
        latitude,
        longitude,
      },
    });
  }

  res.json({
    success: true,
    message: 'Position mise à jour',
  });
});

// Démarrer le partage de localisation
export const startLocationSharing = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const { missionId } = req.body;

  // Vérifier que la mission appartient bien au pro si fournie
  if (missionId) {
    const mission = await prisma.mission.findFirst({
      where: {
        id: missionId,
        professionalId: req.professional.id,
        status: { in: ['assigned', 'in_progress'] },
      },
    });

    if (!mission) {
      throw createError('Mission non trouvée ou non assignée', 404);
    }
  }

  await prisma.professional.update({
    where: { id: req.professional.id },
    data: {
      isLocationSharing: true,
    },
  });

  res.json({
    success: true,
    message: 'Partage de localisation activé',
  });
});

// Arrêter le partage de localisation
export const stopLocationSharing = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  await prisma.professional.update({
    where: { id: req.professional.id },
    data: {
      isLocationSharing: false,
    },
  });

  res.json({
    success: true,
    message: 'Partage de localisation désactivé',
  });
});

// Enregistrer le push token du professionnel
export const registerPushToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const { pushToken } = req.body;

  if (!pushToken) {
    throw createError('Push token requis', 400);
  }

  await prisma.professional.update({
    where: { id: req.professional.id },
    data: { pushToken },
  });

  res.json({
    success: true,
    message: 'Push token enregistré',
  });
});

// ============ ENDPOINTS ADMIN ============

// Obtenir la position d'un professionnel (admin)
export const getProLocation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.admin) {
    throw createError('Non authentifié', 401);
  }

  const { professionalId } = req.params;

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      lastKnownLatitude: true,
      lastKnownLongitude: true,
      lastLocationUpdate: true,
      isLocationSharing: true,
    },
  });

  if (!professional) {
    throw createError('Professionnel non trouvé', 404);
  }

  res.json({
    success: true,
    data: {
      professional: {
        id: professional.id,
        name: `${professional.firstName} ${professional.lastName}`,
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
});

// Obtenir l'historique de localisation d'une mission (admin)
export const getMissionLocationHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.admin) {
    throw createError('Non authentifié', 401);
  }

  const { missionId } = req.params;

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      professional: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!mission) {
    throw createError('Mission non trouvée', 404);
  }

  const locationHistory = await prisma.proLocationHistory.findMany({
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
      },
      locationHistory: locationHistory.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        timestamp: loc.timestamp,
      })),
    },
  });
});

// Obtenir tous les pros avec leur position en temps réel (admin)
export const getAllProsLocations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.admin) {
    throw createError('Non authentifié', 401);
  }

  const { activeOnly } = req.query;

  const where: any = {
    lastKnownLatitude: { not: null },
    lastKnownLongitude: { not: null },
  };

  if (activeOnly === 'true') {
    where.isLocationSharing = true;
  }

  const professionals = await prisma.professional.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      lastKnownLatitude: true,
      lastKnownLongitude: true,
      lastLocationUpdate: true,
      isLocationSharing: true,
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
            },
          },
        },
      },
    },
  });

  res.json({
    success: true,
    data: {
      professionals: professionals.map(pro => ({
        id: pro.id,
        name: `${pro.firstName} ${pro.lastName}`,
        avatar: pro.avatar,
        location: {
          latitude: pro.lastKnownLatitude,
          longitude: pro.lastKnownLongitude,
          updatedAt: pro.lastLocationUpdate,
        },
        isSharing: pro.isLocationSharing,
        currentMission: pro.missions[0]
          ? {
              id: pro.missions[0].id,
              address: pro.missions[0].booking.address,
              service: pro.missions[0].booking.service,
            }
          : null,
      })),
    },
  });
});

// ============ ENDPOINT CLIENT ============

// Obtenir la position du pro pour une mission en cours (client)
export const getProLocationForMission = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Non authentifié', 401);
  }

  const { missionId } = req.params;

  // Vérifier que la mission appartient au client
  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      booking: {
        userId: req.user.id,
      },
      status: 'in_progress',
    },
    include: {
      professional: {
        select: {
          id: true,
          firstName: true,
          avatar: true,
          lastKnownLatitude: true,
          lastKnownLongitude: true,
          lastLocationUpdate: true,
          isLocationSharing: true,
        },
      },
      booking: {
        select: {
          address: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  if (!mission) {
    throw createError('Mission non trouvée ou pas en cours', 404);
  }

  if (!mission.professional) {
    throw createError('Aucun professionnel assigné', 404);
  }

  // Le pro doit avoir activé le partage de localisation
  if (!mission.professional.isLocationSharing) {
    res.json({
      success: true,
      data: {
        professional: {
          id: mission.professional.id,
          firstName: mission.professional.firstName,
          avatar: mission.professional.avatar,
        },
        location: null,
        message: 'Le professionnel n\'a pas encore activé le partage de localisation',
        destination: {
          address: mission.booking.address,
          latitude: mission.booking.latitude,
          longitude: mission.booking.longitude,
        },
      },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      professional: {
        id: mission.professional.id,
        firstName: mission.professional.firstName,
        avatar: mission.professional.avatar,
      },
      location: mission.professional.lastKnownLatitude && mission.professional.lastKnownLongitude
        ? {
            latitude: mission.professional.lastKnownLatitude,
            longitude: mission.professional.lastKnownLongitude,
            updatedAt: mission.professional.lastLocationUpdate,
          }
        : null,
      destination: {
        address: mission.booking.address,
        latitude: mission.booking.latitude,
        longitude: mission.booking.longitude,
      },
    },
  });
});

export default {
  updateLocation,
  startLocationSharing,
  stopLocationSharing,
  registerPushToken,
  getProLocation,
  getMissionLocationHistory,
  getAllProsLocations,
  getProLocationForMission,
};
