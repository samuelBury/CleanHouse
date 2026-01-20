// Contrôleur d'authentification pour les administrateurs
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { JWT_CONFIG, getRefreshTokenExpiry } from '../config/auth';

// Générer un token admin
const generateAdminAccessToken = (adminId: string, email: string, role: string): string => {
  return jwt.sign(
    { adminId, email, role, type: 'admin' },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.expiresIn as jwt.SignOptions['expiresIn'] }
  );
};

const generateAdminRefreshToken = (adminId: string, email: string): string => {
  return jwt.sign(
    { adminId, email, type: 'admin' },
    JWT_CONFIG.refreshSecret,
    { expiresIn: JWT_CONFIG.refreshExpiresIn as jwt.SignOptions['expiresIn'] }
  );
};

// Login admin
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
      return;
    }

    // Trouver l'admin
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
      return;
    }

    if (!admin.isActive) {
      res.status(401).json({
        success: false,
        message: 'Compte désactivé',
      });
      return;
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
      return;
    }

    // Générer les tokens
    const accessToken = generateAdminAccessToken(admin.id, admin.email, admin.role);
    const refreshToken = generateAdminRefreshToken(admin.id, admin.email);

    // Sauvegarder le refresh token
    await prisma.adminRefreshToken.create({
      data: {
        adminId: admin.id,
        token: refreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Mettre à jour la date de dernière connexion
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion',
    });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Refresh token requis',
      });
      return;
    }

    // Vérifier le token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_CONFIG.refreshSecret);
    } catch {
      res.status(401).json({
        success: false,
        message: 'Refresh token invalide',
      });
      return;
    }

    if (decoded.type !== 'admin' || !decoded.adminId) {
      res.status(401).json({
        success: false,
        message: 'Refresh token invalide pour un administrateur',
      });
      return;
    }

    // Vérifier que le token existe en base
    const storedToken = await prisma.adminRefreshToken.findFirst({
      where: {
        token,
        adminId: decoded.adminId,
        expiresAt: { gt: new Date() },
      },
      include: { admin: true },
    });

    if (!storedToken || !storedToken.admin.isActive) {
      res.status(401).json({
        success: false,
        message: 'Refresh token expiré ou invalide',
      });
      return;
    }

    // Générer un nouveau access token
    const accessToken = generateAdminAccessToken(
      storedToken.admin.id,
      storedToken.admin.email,
      storedToken.admin.role
    );

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    console.error('Admin refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await prisma.adminRefreshToken.deleteMany({
        where: { token },
      });
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie',
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Check auth (me)
export const checkAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Administrateur non trouvé',
      });
      return;
    }

    res.json({
      success: true,
      data: { admin },
    });
  } catch (error) {
    console.error('Admin check auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

// Créer un admin (super_admin uniquement)
export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role = 'operator' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis',
      });
      return;
    }

    // Vérifier que l'email n'existe pas déjà
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingAdmin) {
      res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé',
      });
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'admin
    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { admin },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};
