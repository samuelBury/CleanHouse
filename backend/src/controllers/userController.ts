// Controller des utilisateurs
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';

// Obtenir le profil de l'utilisateur
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      balance: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  if (!user) {
    throw createError('Utilisateur non trouvé', 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        ...user,
        totalBookings: user._count.bookings,
      },
    },
  });
});

// Mettre à jour le profil
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, phone, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      phone,
      avatar,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      balance: true,
      createdAt: true,
    },
  });

  res.json({
    success: true,
    data: { user },
  });
});

// Changer le mot de passe
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  // Récupérer l'utilisateur avec le mot de passe
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createError('Utilisateur non trouvé', 404);
  }

  // Vérifier si l'utilisateur a un mot de passe (pas de social auth)
  if (!user.password) {
    throw createError('Vous utilisez une connexion sociale. Impossible de changer le mot de passe.', 400);
  }

  // Vérifier le mot de passe actuel
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidPassword) {
    throw createError('Mot de passe actuel incorrect', 400);
  }

  // Hasher le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Mettre à jour
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  res.json({
    success: true,
    message: 'Mot de passe mis à jour avec succès',
  });
});

// Obtenir le portefeuille (solde + transactions)
export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [user, transactions, total] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
      include: {
        booking: {
          select: {
            service: true,
            date: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  if (!user) {
    throw createError('Utilisateur non trouvé', 404);
  }

  res.json({
    success: true,
    data: {
      balance: user.balance,
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

// Ajouter des fonds au portefeuille (simulation)
export const addFunds = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw createError('Montant invalide', 400);
  }

  // Créer la transaction
  await prisma.transaction.create({
    data: {
      userId,
      type: 'deposit',
      amount,
      description: 'Dépôt sur le portefeuille',
    },
  });

  // Mettre à jour le solde
  const user = await prisma.user.update({
    where: { id: userId },
    data: { balance: { increment: amount } },
    select: { balance: true },
  });

  res.json({
    success: true,
    data: { balance: user.balance },
    message: `${amount.toFixed(2)} EUR ajoutés au portefeuille`,
  });
});

// Obtenir les statistiques de l'utilisateur
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [
    totalBookings,
    completedBookings,
    totalSpent,
    favoriteService,
  ] = await Promise.all([
    // Total des réservations
    prisma.booking.count({ where: { userId } }),

    // Réservations terminées
    prisma.booking.count({
      where: { userId, status: 'completed' },
    }),

    // Total dépensé
    prisma.transaction.aggregate({
      where: { userId, type: 'expense' },
      _sum: { amount: true },
    }),

    // Service le plus utilisé
    prisma.booking.groupBy({
      by: ['service'],
      where: { userId },
      _count: true,
      orderBy: { _count: { service: 'desc' } },
      take: 1,
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalBookings,
      completedBookings,
      totalSpent: totalSpent._sum.amount || 0,
      favoriteService: favoriteService[0]?.service || null,
    },
  });
});

// Supprimer le compte
export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Supprimer toutes les données de l'utilisateur (cascade via Prisma)
  await prisma.user.delete({
    where: { id: userId },
  });

  res.json({
    success: true,
    message: 'Compte supprimé avec succès',
  });
});
