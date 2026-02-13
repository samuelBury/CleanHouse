// Controller des réservations
import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SERVICE_PRICES } from '../config/stripe';
import { ServiceType, BookingStatus } from '@prisma/client';
import { autoAssignProfessional } from '../services/autoAssignmentService';

// Noms de professionnels simulés
const PROFESSIONALS = [
  'Marie Dupont',
  'Sophie Martin',
  'Julie Bernard',
  'Laura Thomas',
  'Emma Robert',
  'Chloé Richard',
  'Camille Petit',
  'Léa Durand',
];

// Obtenir un professionnel aléatoire
const getRandomProfessional = (): string => {
  return PROFESSIONALS[Math.floor(Math.random() * PROFESSIONALS.length)];
};

// Tarifs horaires pour les pros (ce qu'ils gagnent en euros)
const PRO_HOURLY_RATES: Record<string, number> = {
  MENAGE: 15,
  REPASSAGE: 12,
  MENAGE_REPASSAGE: 20,
};

// Calculer le gain du pro
const calculateProEarning = (service: ServiceType, duration: number): number => {
  return PRO_HOURLY_RATES[service] * duration;
};

// Calculer le prix
const calculatePrice = (service: ServiceType, duration: number): number => {
  const basePrice = SERVICE_PRICES[service];
  return (basePrice * duration) / 100; // Convertir centimes en euros
};

// Liste des réservations de l'utilisateur
export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { status, page = 1, limit = 20 } = req.query;

  const where: any = { userId };

  if (status && typeof status === 'string') {
    where.status = status as BookingStatus;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: Number(limit),
      include: {
        mission: {
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                phone: true,
                rating: true,
                totalMissions: true,
                isVerified: true,
              },
            },
          },
        },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

// Obtenir une réservation spécifique
export const getBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const booking = await prisma.booking.findFirst({
    where: { id, userId },
    include: {
      transaction: true,
    },
  });

  if (!booking) {
    throw createError('Réservation non trouvée', 404);
  }

  res.json({
    success: true,
    data: { booking },
  });
});

// Géocoder une adresse via Nominatim (OpenStreetMap)
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      { headers: { 'User-Agent': 'CleanHouse-App/1.0' } }
    );
    const data = await response.json() as Array<{ lat: string; lon: string }>;
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Helper pour parser une date DD/MM/YYYY
const parseDateDDMMYYYY = (dateStr: string): Date => {
  // Si c'est déjà une date ISO, la parser directement
  if (dateStr.includes('T') || dateStr.includes('-')) {
    return new Date(dateStr);
  }
  // Sinon parser DD/MM/YYYY
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

// Créer une réservation
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { service, date, time, duration, address, latitude, longitude, notes } = req.body;

  // Calculer le prix
  const price = calculatePrice(service as ServiceType, duration);

  // Calculer le gain du pro
  const proEarning = calculateProEarning(service as ServiceType, duration);

  // Parser la date correctement (DD/MM/YYYY)
  const parsedDate = parseDateDDMMYYYY(date);

  // Géocoder l'adresse si les coordonnées ne sont pas fournies
  let finalLat = latitude;
  let finalLng = longitude;
  if (!finalLat || !finalLng) {
    const coords = await geocodeAddress(address);
    if (coords) {
      finalLat = coords.lat;
      finalLng = coords.lng;
    }
  }

  // Créer la réservation (sans professionnel assigné, ce sera fait quand un pro accepte)
  const booking = await prisma.booking.create({
    data: {
      userId,
      service: service as ServiceType,
      date: parsedDate,
      time,
      duration,
      address,
      latitude: finalLat,
      longitude: finalLng,
      price,
      professional: null, // Sera assigné quand un pro accepte la mission
      notes,
      status: 'confirmed',
    },
  });

  // Créer automatiquement une mission en attente d'assignation
  await prisma.mission.create({
    data: {
      bookingId: booking.id,
      status: 'pending',
      proEarning,
    },
  });

  // Auto-assigner un professionnel disponible
  const assignmentResult = await autoAssignProfessional(booking.id);

  // Recharger le booking avec les données du professionnel si assigné
  const updatedBooking = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: {
      mission: {
        include: {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              rating: true,
              totalMissions: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: {
      booking: updatedBooking,
      professionalAssigned: assignmentResult.success,
      assignmentReason: assignmentResult.reason,
    },
  });
});

// Relancer l'auto-assignation pour un booking sans professionnel
export const retryAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Vérifier que le booking existe et appartient à l'utilisateur
  const booking = await prisma.booking.findFirst({
    where: { id, userId },
    include: {
      mission: {
        include: {
          professional: true,
        },
      },
    },
  });

  if (!booking) {
    throw createError('Réservation non trouvée', 404);
  }

  // Si un pro est déjà assigné, retourner directement
  if (booking.mission?.professional) {
    const updatedBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        mission: {
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                rating: true,
                totalMissions: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return res.json({
      success: true,
      data: {
        booking: updatedBooking,
        professionalAssigned: true,
      },
    });
  }

  // Relancer l'auto-assignation
  const assignmentResult = await autoAssignProfessional(booking.id);

  const updatedBooking = await prisma.booking.findUnique({
    where: { id },
    include: {
      mission: {
        include: {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              rating: true,
              totalMissions: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  res.json({
    success: true,
    data: {
      booking: updatedBooking,
      professionalAssigned: assignmentResult.success,
      assignmentReason: assignmentResult.reason,
    },
  });
});

// Mettre à jour une réservation
export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { date, time, duration, address, latitude, longitude, notes } = req.body;

  // Vérifier que la réservation existe et appartient à l'utilisateur
  const existingBooking = await prisma.booking.findFirst({
    where: { id, userId },
  });

  if (!existingBooking) {
    throw createError('Réservation non trouvée', 404);
  }

  // Vérifier que la réservation peut être modifiée
  if (['completed', 'cancelled'].includes(existingBooking.status)) {
    throw createError('Cette réservation ne peut plus être modifiée', 400);
  }

  // Calculer le nouveau prix si la durée change
  let newPrice = existingBooking.price;
  if (duration && duration !== existingBooking.duration) {
    newPrice = calculatePrice(existingBooking.service, duration);
  }

  // Mettre à jour la réservation
  const booking = await prisma.booking.update({
    where: { id },
    data: {
      date: date ? parseDateDDMMYYYY(date) : undefined,
      time,
      duration,
      address,
      latitude,
      longitude,
      notes,
      price: newPrice,
    },
  });

  res.json({
    success: true,
    data: { booking },
  });
});

// Annuler une réservation
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Vérifier que la réservation existe et appartient à l'utilisateur
  const existingBooking = await prisma.booking.findFirst({
    where: { id, userId },
  });

  if (!existingBooking) {
    throw createError('Réservation non trouvée', 404);
  }

  // Vérifier que la réservation peut être annulée
  if (['completed', 'cancelled'].includes(existingBooking.status)) {
    throw createError('Cette réservation ne peut pas être annulée', 400);
  }

  // Annuler la réservation
  const booking = await prisma.booking.update({
    where: { id },
    data: { status: 'cancelled' },
  });

  // Annuler la mission associée
  await prisma.mission.updateMany({
    where: { bookingId: id },
    data: { status: 'cancelled' },
  });

  // Rembourser si la réservation avait été payée
  const transaction = await prisma.transaction.findFirst({
    where: { bookingId: id, type: 'expense' },
  });

  if (transaction) {
    // Créer une transaction de remboursement
    await prisma.transaction.create({
      data: {
        userId,
        type: 'refund',
        amount: transaction.amount,
        description: `Remboursement - ${existingBooking.service}`,
        bookingId: id,
      },
    });

  }

  res.json({
    success: true,
    data: { booking },
    message: 'Réservation annulée avec succès',
  });
});

// Obtenir les prochaines réservations (agenda)
export const getUpcomingBookings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      date: { gte: new Date() },
      status: { in: ['confirmed', 'in_progress'] },
    },
    orderBy: { date: 'asc' },
    take: 10,
  });

  res.json({
    success: true,
    data: { bookings },
  });
});

// Obtenir l'historique des réservations
export const getBookingHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId,
        OR: [
          { status: 'completed' },
          { status: 'cancelled' },
          { date: { lt: new Date() } },
        ],
      },
      orderBy: { date: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.booking.count({
      where: {
        userId,
        OR: [
          { status: 'completed' },
          { status: 'cancelled' },
          { date: { lt: new Date() } },
        ],
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

// Obtenir la position du professionnel pour une mission en cours
export const getProLocationForMission = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { missionId } = req.params;

  // Vérifier que la mission appartient au client
  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      booking: {
        userId,
      },
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
          date: true,
          time: true,
        },
      },
    },
  });

  if (!mission) {
    throw createError('Mission non trouvée', 404);
  }

  if (!mission.professional) {
    throw createError('Aucun professionnel assigné', 404);
  }

  // Vérifier si on est dans les 30 minutes avant le début de la prestation
  const isWithin30MinBeforeStart = (): boolean => {
    if (mission.status !== 'assigned' || !mission.booking.date || !mission.booking.time) {
      return false;
    }
    const [hours, minutes] = mission.booking.time.split(':').map(Number);
    const startTime = new Date(mission.booking.date);
    startTime.setHours(hours, minutes, 0, 0);
    const now = new Date();
    const thirtyMinBefore = new Date(startTime.getTime() - 30 * 60 * 1000);
    return now >= thirtyMinBefore && now < startTime;
  };

  const canTrack = mission.status === 'in_progress' || isWithin30MinBeforeStart();

  // Le pro doit avoir activé le partage de localisation et la mission doit être traçable
  if (!mission.professional.isLocationSharing || !canTrack) {
    let message: string;
    if (!canTrack) {
      message = 'La localisation sera disponible 30 minutes avant la prestation';
    } else {
      message = 'Le professionnel n\'a pas encore activé le partage de localisation';
    }

    res.json({
      success: true,
      data: {
        professional: {
          id: mission.professional.id,
          firstName: mission.professional.firstName,
          avatar: mission.professional.avatar,
        },
        location: null,
        message,
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
