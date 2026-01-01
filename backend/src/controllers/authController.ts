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
import { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } from '../services/emailService';

// Inscription
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    // Si l'utilisateur existe mais n'a pas vérifié son email, renvoyer le mail
    if (!existingUser.emailVerified) {
      const verificationToken = generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
        },
      });

      await sendVerificationEmail(email, existingUser.name, verificationToken);

      return res.status(200).json({
        success: true,
        message: 'Un email de vérification a été renvoyé à votre adresse.',
        requiresVerification: true,
      });
    }
    throw createError('Cet email est déjà utilisé', 400);
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);

  // Générer le token de vérification
  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Créer l'utilisateur (non vérifié)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
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

  // Envoyer l'email de vérification
  await sendVerificationEmail(email, name, verificationToken);

  res.status(201).json({
    success: true,
    message: 'Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.',
    requiresVerification: true,
    data: {
      user,
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

  // Vérifier si l'email est vérifié
  if (!user.emailVerified) {
    throw createError('Veuillez vérifier votre email avant de vous connecter', 403);
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

// Vérifier l'email
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    throw createError('Token de vérification manquant', 400);
  }

  // Trouver l'utilisateur avec ce token
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw createError('Token invalide ou expiré', 400);
  }

  // Marquer l'email comme vérifié
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  // Envoyer l'email de bienvenue
  await sendWelcomeEmail(user.email, user.name);

  // Retourner une page HTML de confirmation
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email vérifié - CleanHouse</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
        .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { color: #4cb04f; font-size: 60px; }
        h1 { color: #333; }
        p { color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✓</div>
        <h1>Email vérifié !</h1>
        <p>Votre compte CleanHouse est maintenant activé.</p>
        <p>Vous pouvez fermer cette page et vous connecter dans l'application.</p>
      </div>
    </body>
    </html>
  `);
});

// Renvoyer l'email de vérification
export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw createError('Email requis', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Ne pas révéler si l'utilisateur existe ou non
    return res.json({
      success: true,
      message: 'Si cet email existe, un lien de vérification a été envoyé.',
    });
  }

  if (user.emailVerified) {
    throw createError('Cet email est déjà vérifié', 400);
  }

  // Générer un nouveau token
  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    },
  });

  await sendVerificationEmail(email, user.name, verificationToken);

  res.json({
    success: true,
    message: 'Un nouveau lien de vérification a été envoyé.',
  });
});
