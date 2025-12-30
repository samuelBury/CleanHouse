// Controller des réservations
import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SERVICE_PRICES } from '../config/stripe';
import { ServiceType, BookingStatus } from '@prisma/client';

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

// Créer une réservation
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { service, date, time, duration, address, latitude, longitude, notes } = req.body;

  // Calculer le prix
  const price = calculatePrice(service as ServiceType, duration);

  // Assigner un professionnel simulé
  const professional = getRandomProfessional();

  // Créer la réservation
  const booking = await prisma.booking.create({
    data: {
      userId,
      service: service as ServiceType,
      date: new Date(date),
      time,
      duration,
      address,
      latitude,
      longitude,
      price,
      professional,
      notes,
      status: 'confirmed',
    },
  });

  res.status(201).json({
    success: true,
    data: { booking },
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
      date: date ? new Date(date) : undefined,
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

    // Mettre à jour le solde de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: transaction.amount } },
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
