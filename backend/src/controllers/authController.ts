// Controller d'authentification
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../config/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

// Inscription
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw createError('Cet email est déjà utilisé', 400);
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
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

  // Générer les tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  // Sauvegarder le refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

// Connexion
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Trouver l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    throw createError('Email ou mot de passe incorrect', 401);
  }

  // Vérifier le mot de passe
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw createError('Email ou mot de passe incorrect', 401);
  }

  // Générer les tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  // Sauvegarder le refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        balance: user.balance,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    },
  });
});

// Connexion Google
export const loginWithGoogle = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, email, name } = req.body;

  // En production, vérifier le token avec Google OAuth
  // Pour l'instant, on fait confiance au frontend
  // TODO: Implémenter la vérification avec google-auth-library

  if (!email) {
    throw createError('Email requis pour la connexion Google', 400);
  }

  // Chercher ou créer l'utilisateur
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId: idToken },
        { email },
      ],
    },
  });

  if (!user) {
    // Créer un nouvel utilisateur
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        googleId: idToken,
      },
    });
  } else if (!user.googleId) {
    // Lier le compte Google à l'utilisateur existant
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: idToken },
    });
  }

  // Générer les tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        balance: user.balance,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    },
  });
});

// Connexion Apple
export const loginWithApple = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, email, name } = req.body;

  // En production, vérifier le token avec Apple
  // TODO: Implémenter la vérification avec apple-signin-auth

  if (!email && !idToken) {
    throw createError('Token ou email requis pour la connexion Apple', 400);
  }

  // Chercher ou créer l'utilisateur
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { appleId: idToken },
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (!user) {
    if (!email) {
      throw createError('Email requis pour la première connexion Apple', 400);
    }

    user = await prisma.user.create({
      data: {
        email,
        name: name || 'Utilisateur Apple',
        appleId: idToken,
      },
    });
  } else if (!user.appleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { appleId: idToken },
    });
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        balance: user.balance,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    },
  });
});

// Rafraîchir le token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw createError('Refresh token requis', 400);
  }

  // Vérifier le token
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw createError('Refresh token invalide ou expiré', 401);
  }

  // Vérifier que le token existe en base
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }
    throw createError('Refresh token invalide ou expiré', 401);
  }

  // Supprimer l'ancien token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  // Générer de nouveaux tokens
  const newAccessToken = generateAccessToken({
    userId: storedToken.user.id,
    email: storedToken.user.email,
  });
  const newRefreshToken = generateRefreshToken({
    userId: storedToken.user.id,
    email: storedToken.user.email,
  });

  // Sauvegarder le nouveau refresh token
  await prisma.refreshToken.create({
    data: {
      userId: storedToken.user.id,
      token: newRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});

// Déconnexion
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  res.json({
    success: true,
    message: 'Déconnexion réussie',
  });
});

// Vérifier l'authentification
export const checkAuth = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Non authentifié', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
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

  if (!user) {
    throw createError('Utilisateur non trouvé', 404);
  }

  res.json({
    success: true,
    data: { user },
  });
});
