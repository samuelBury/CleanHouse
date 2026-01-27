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
import { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService';
import stripeService from '../services/stripeService';

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

      // Envoyer l'email en arrière-plan (fire-and-forget)
      sendVerificationEmail(email, existingUser.name, verificationToken).catch(err => {
        console.error('Erreur envoi email vérification:', err);
      });

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
      createdAt: true,
    },
  });

  // Envoyer l'email de vérification en arrière-plan (fire-and-forget)
  sendVerificationEmail(email, name, verificationToken).catch(err => {
    console.error('Erreur envoi email vérification:', err);
  });

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
        emailVerified: true, // Google vérifie l'email
      },
    });

    // Créer le Stripe Customer
    try {
      const stripeCustomer = await stripeService.createCustomer({
        email: user.email,
        name: user.name,
        userId: user.id,
      });
      user = await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: stripeCustomer.id },
      });
    } catch (error) {
      console.error('Erreur création Stripe Customer:', error);
    }
  } else if (!user.googleId) {
    // Lier le compte Google à l'utilisateur existant
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: idToken },
    });
  }

  // Créer le Stripe Customer si pas encore fait
  if (!user.stripeCustomerId) {
    try {
      const stripeCustomer = await stripeService.createCustomer({
        email: user.email,
        name: user.name,
        userId: user.id,
      });
      user = await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: stripeCustomer.id },
      });
    } catch (error) {
      console.error('Erreur création Stripe Customer:', error);
    }
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
        emailVerified: true, // Apple vérifie l'email
      },
    });

    // Créer le Stripe Customer
    try {
      const stripeCustomer = await stripeService.createCustomer({
        email: user.email,
        name: user.name,
        userId: user.id,
      });
      user = await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: stripeCustomer.id },
      });
    } catch (error) {
      console.error('Erreur création Stripe Customer:', error);
    }
  } else if (!user.appleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { appleId: idToken },
    });
  }

  // Créer le Stripe Customer si pas encore fait
  if (!user.stripeCustomerId) {
    try {
      const stripeCustomer = await stripeService.createCustomer({
        email: user.email,
        name: user.name,
        userId: user.id,
      });
      user = await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: stripeCustomer.id },
      });
    } catch (error) {
      console.error('Erreur création Stripe Customer:', error);
    }
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

  // Créer le Stripe Customer si pas encore fait
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    try {
      const stripeCustomer = await stripeService.createCustomer({
        email: user.email,
        name: user.name,
        userId: user.id,
      });
      stripeCustomerId = stripeCustomer.id;
    } catch (error) {
      console.error('Erreur création Stripe Customer:', error);
      // On continue même si Stripe échoue, le customer sera créé plus tard
    }
  }

  // Marquer l'email comme vérifié et sauvegarder le stripeCustomerId
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      stripeCustomerId,
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

  // Envoyer l'email en arrière-plan
  sendVerificationEmail(email, user.name, verificationToken).catch(err => {
    console.error('Erreur envoi email vérification:', err);
  });

  res.json({
    success: true,
    message: 'Un nouveau lien de vérification a été envoyé.',
  });
});

// Mot de passe oublié - Demander la réinitialisation
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw createError('Email requis', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Ne pas révéler si l'utilisateur existe ou non (sécurité)
  if (!user) {
    return res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
    });
  }

  // Vérifier si l'utilisateur a un mot de passe (pas social auth uniquement)
  if (!user.password) {
    return res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
    });
  }

  // Générer le token de réinitialisation
  const resetToken = generateVerificationToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    },
  });

  // Envoyer l'email
  await sendPasswordResetEmail(email, resetToken);

  res.json({
    success: true,
    message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
  });
});

// Réinitialiser le mot de passe
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw createError('Token et nouveau mot de passe requis', 400);
  }

  if (password.length < 6) {
    throw createError('Le mot de passe doit contenir au moins 6 caractères', 400);
  }

  // Trouver l'utilisateur avec ce token
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw createError('Token invalide ou expiré', 400);
  }

  // Hasher le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);

  // Mettre à jour l'utilisateur
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // Supprimer tous les refresh tokens existants (déconnexion de toutes les sessions)
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  res.json({
    success: true,
    message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
  });
});

// Page web de réinitialisation du mot de passe
export const resetPasswordPage = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Erreur - CleanHouse</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
          .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 20px; }
          .error { color: #e74c3c; font-size: 60px; }
          h1 { color: #333; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error">✗</div>
          <h1>Lien invalide</h1>
          <p>Le lien de réinitialisation est invalide ou a expiré.</p>
          <p>Veuillez demander un nouveau lien depuis l'application.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Vérifier si le token est valide
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Lien expiré - CleanHouse</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
          .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 20px; }
          .error { color: #e74c3c; font-size: 60px; }
          h1 { color: #333; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error">✗</div>
          <h1>Lien expiré</h1>
          <p>Ce lien de réinitialisation a expiré.</p>
          <p>Veuillez demander un nouveau lien depuis l'application.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Afficher le formulaire de réinitialisation
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Réinitialiser le mot de passe - CleanHouse</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #85409D 0%, #A668BE 100%); }
        .container { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); max-width: 400px; width: 90%; margin: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #85409D; text-align: center; margin-bottom: 30px; }
        h1 { color: #333; text-align: center; font-size: 22px; margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; color: #666; margin-bottom: 8px; font-size: 14px; }
        input { width: 100%; padding: 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
        input:focus { outline: none; border-color: #85409D; }
        button { width: 100%; padding: 14px; background: linear-gradient(135deg, #5E2D6F 0%, #85409D 50%, #A668BE 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        button:hover { opacity: 0.9; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .message { padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .requirements { font-size: 12px; color: #888; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">CleanHouse</div>
        <h1>Nouveau mot de passe</h1>
        <div id="message"></div>
        <form id="resetForm">
          <div class="form-group">
            <label>Nouveau mot de passe</label>
            <input type="password" id="password" placeholder="••••••••" required minlength="6">
            <div class="requirements">Minimum 6 caractères</div>
          </div>
          <div class="form-group">
            <label>Confirmer le mot de passe</label>
            <input type="password" id="confirmPassword" placeholder="••••••••" required>
          </div>
          <button type="submit" id="submitBtn">Réinitialiser</button>
        </form>
      </div>
      <script>
        const form = document.getElementById('resetForm');
        const messageDiv = document.getElementById('message');
        const submitBtn = document.getElementById('submitBtn');

        form.addEventListener('submit', async (e) => {
          e.preventDefault();

          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;

          if (password !== confirmPassword) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Les mots de passe ne correspondent pas';
            return;
          }

          if (password.length < 6) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = 'Réinitialisation...';

          try {
            const response = await fetch('/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: '${token}', password })
            });

            const data = await response.json();

            if (data.success) {
              messageDiv.className = 'message success';
              messageDiv.textContent = 'Mot de passe réinitialisé ! Vous pouvez fermer cette page et vous connecter dans l\\'application.';
              form.style.display = 'none';
            } else {
              messageDiv.className = 'message error';
              messageDiv.textContent = data.error || 'Une erreur est survenue';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Réinitialiser';
            }
          } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Erreur de connexion au serveur';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Réinitialiser';
          }
        });
      </script>
    </body>
    </html>
  `);
});
