// Controller d'authentification pour les professionnels
import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../config/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateInvitationToken } from '../services/invitationService';
import { sendPasswordResetEmail } from '../services/emailService';

// Inscription professionnel
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone, address } = req.body;

  // Vérifier si le professionnel existe déjà
  const existingPro = await prisma.professional.findUnique({ where: { email } });

  if (existingPro) {
    throw createError('Cet email est déjà utilisé', 400);
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);

  // Créer le professionnel
  const professional = await prisma.professional.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      address,
      emailVerified: true, // Pour simplifier, on vérifie directement
      isVerified: false, // Doit être vérifié par l'admin
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      address: true,
      transportMode: true,
      isAvailable: true,
      isVerified: true,
      rating: true,
      totalMissions: true,
      createdAt: true,
    },
  });

  // Générer les tokens
  const accessToken = generateAccessToken({
    professionalId: professional.id,
    email: professional.email,
    type: 'professional'
  });
  const refreshToken = generateRefreshToken({
    professionalId: professional.id,
    email: professional.email,
    type: 'professional'
  });

  // Sauvegarder le refresh token
  await prisma.proRefreshToken.create({
    data: {
      professionalId: professional.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.status(201).json({
    success: true,
    message: 'Inscription réussie ! Votre compte sera vérifié par notre équipe.',
    data: {
      professional,
      accessToken,
      refreshToken,
    },
  });
});

// Connexion professionnel
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Trouver le professionnel
  const professional = await prisma.professional.findUnique({
    where: { email },
  });

  if (!professional) {
    throw createError('Email ou mot de passe incorrect', 401);
  }

  // Vérifier que le compte a été configuré (a un mot de passe)
  if (!professional.password) {
    throw createError('Ce compte n\'a pas encore été configuré. Veuillez utiliser le lien d\'invitation.', 401);
  }

  // Vérifier le mot de passe
  const isValidPassword = await bcrypt.compare(password, professional.password);

  if (!isValidPassword) {
    throw createError('Email ou mot de passe incorrect', 401);
  }

  // Générer les tokens
  const accessToken = generateAccessToken({
    professionalId: professional.id,
    email: professional.email,
    type: 'professional'
  });
  const refreshToken = generateRefreshToken({
    professionalId: professional.id,
    email: professional.email,
    type: 'professional'
  });

  // Sauvegarder le refresh token
  await prisma.proRefreshToken.create({
    data: {
      professionalId: professional.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.json({
    success: true,
    data: {
      professional: {
        id: professional.id,
        email: professional.email,
        firstName: professional.firstName,
        lastName: professional.lastName,
        phone: professional.phone,
        avatar: professional.avatar,
        address: professional.address,
        transportMode: professional.transportMode,
        isAvailable: professional.isAvailable,
        isVerified: professional.isVerified,
        rating: professional.rating,
        totalMissions: professional.totalMissions,
        createdAt: professional.createdAt,
        latitude: professional.latitude,
        longitude: professional.longitude,
        radius: professional.radius,
        contractUrl: professional.contractUrl,
        idDocumentUrl: professional.idDocumentUrl,
        proofOfAddressUrl: professional.proofOfAddressUrl,
        carteVitaleUrl: professional.carteVitaleUrl,
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
  const storedToken = await prisma.proRefreshToken.findUnique({
    where: { token },
    include: { professional: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.proRefreshToken.delete({ where: { id: storedToken.id } });
    }
    throw createError('Refresh token invalide ou expiré', 401);
  }

  // Supprimer l'ancien token
  await prisma.proRefreshToken.delete({ where: { id: storedToken.id } });

  // Générer de nouveaux tokens
  const newAccessToken = generateAccessToken({
    professionalId: storedToken.professional.id,
    email: storedToken.professional.email,
    type: 'professional',
  });
  const newRefreshToken = generateRefreshToken({
    professionalId: storedToken.professional.id,
    email: storedToken.professional.email,
    type: 'professional',
  });

  // Sauvegarder le nouveau refresh token
  await prisma.proRefreshToken.create({
    data: {
      professionalId: storedToken.professional.id,
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
    await prisma.proRefreshToken.deleteMany({ where: { token } });
  }

  res.json({
    success: true,
    message: 'Déconnexion réussie',
  });
});

// Vérifier l'authentification
export const checkAuth = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const professional = await prisma.professional.findUnique({
    where: { id: req.professional.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      address: true,
      transportMode: true,
      isAvailable: true,
      isVerified: true,
      rating: true,
      totalMissions: true,
      createdAt: true,
      contractUrl: true,
      idDocumentUrl: true,
      proofOfAddressUrl: true,
      carteVitaleUrl: true,
      latitude: true,
      longitude: true,
      radius: true,
    },
  });

  if (!professional) {
    throw createError('Professionnel non trouvé', 404);
  }

  res.json({
    success: true,
    data: { professional },
  });
});

// Mettre à jour le profil
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.professional) {
    throw createError('Non authentifié', 401);
  }

  const { firstName, lastName, phone, address, bio, radius, isAvailable, transportMode } = req.body;

  const professional = await prisma.professional.update({
    where: { id: req.professional.id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(bio && { bio }),
      ...(radius !== undefined && { radius }),
      ...(isAvailable !== undefined && { isAvailable }),
      ...(transportMode && { transportMode }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      address: true,
      bio: true,
      radius: true,
      transportMode: true,
      isAvailable: true,
      isVerified: true,
      rating: true,
      totalMissions: true,
      createdAt: true,
    },
  });

  res.json({
    success: true,
    data: { professional },
  });
});

// ============ INVITATION FLOW ============

// Valider un token d'invitation (étape 1)
export const validateInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    throw createError('Token requis', 400);
  }

  const result = await validateInvitationToken(token);

  if (!result.valid) {
    throw createError(result.error || 'Token invalide', 400);
  }

  res.json({
    success: true,
    data: {
      professional: result.professional,
    },
    message: 'Token valide',
  });
});

// Configurer le compte avec mot de passe (étape 2)
export const setupAccount = asyncHandler(async (req: Request, res: Response) => {
  const { token, password, pseudonyme } = req.body;

  if (!token || !password) {
    throw createError('Token et mot de passe requis', 400);
  }

  if (!pseudonyme || pseudonyme.trim().length < 2) {
    throw createError('Pseudonyme requis (2 caractères minimum)', 400);
  }

  if (password.length < 8) {
    throw createError('Le mot de passe doit contenir au moins 8 caractères', 400);
  }

  // Valider le token
  const validation = await validateInvitationToken(token);

  if (!validation.valid || !validation.professional) {
    throw createError(validation.error || 'Token invalide', 400);
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);

  // Mettre à jour le professionnel
  const professional = await prisma.professional.update({
    where: { id: validation.professional.id },
    data: {
      password: hashedPassword,
      pseudonyme: pseudonyme.trim(),
      accountSetupComplete: true,
      invitationToken: null, // Invalider le token
      invitationExpires: null,
      emailVerified: true, // Le compte est vérifié via invitation
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      address: true,
      transportMode: true,
      isAvailable: true,
      isVerified: true,
      rating: true,
      totalMissions: true,
      createdAt: true,
    },
  });

  // Générer les tokens d'authentification
  const accessToken = generateAccessToken({
    professionalId: professional.id,
    email: professional.email,
    type: 'professional',
  });
  const refreshToken = generateRefreshToken({
    professionalId: professional.id,
    email: professional.email,
    type: 'professional',
  });

  // Sauvegarder le refresh token
  await prisma.proRefreshToken.create({
    data: {
      professionalId: professional.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.json({
    success: true,
    data: {
      professional,
      accessToken,
      refreshToken,
    },
    message: 'Compte configuré avec succès ! Bienvenue chez CleanHouse.',
  });
});

// ============ PASSWORD RESET FLOW ============

// Demander la réinitialisation du mot de passe
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw createError('Email requis', 400);
  }

  // Toujours retourner succès pour ne pas révéler si l'email existe
  const professional = await prisma.professional.findUnique({ where: { email } });

  if (professional) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await prisma.professional.update({
      where: { id: professional.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    await sendPasswordResetEmail(email, resetToken);
  }

  res.json({
    success: true,
    message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
  });
});

// Réinitialiser le mot de passe avec le code
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, code, password } = req.body;

  if ((!token && !code) || !password) {
    throw createError('Code et mot de passe requis', 400);
  }

  if (password.length < 8) {
    throw createError('Le mot de passe doit contenir au moins 8 caractères', 400);
  }

  let professional;

  if (code) {
    // Recherche par code (6 premiers caractères du token, insensible à la casse)
    const allPros = await prisma.professional.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpires: { gt: new Date() },
      },
    });
    professional = allPros.find(p =>
      p.passwordResetToken?.substring(0, 6).toUpperCase() === code.toUpperCase()
    );
  } else {
    // Recherche par token complet (compatibilité dashboard)
    professional = await prisma.professional.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });
  }

  if (!professional) {
    throw createError('Code invalide ou expiré', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.professional.update({
    where: { id: professional.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  res.json({
    success: true,
    message: 'Mot de passe réinitialisé avec succès.',
  });
});
