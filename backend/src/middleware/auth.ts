// Middleware d'authentification JWT
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../config/auth';
import prisma from '../config/database';

// Étendre le type Request pour inclure l'utilisateur, le professionnel et l'admin
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      professional?: {
        id: string;
        email: string;
      };
      admin?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyAccessToken(token);

      // Vérifier que l'utilisateur existe toujours
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé',
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware optionnel - n'échoue pas si pas de token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const decoded = verifyAccessToken(token);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true },
        });

        if (user) {
          req.user = user;
        }
      } catch {
        // Ignorer les erreurs de token - l'authentification est optionnelle
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware d'authentification pour les professionnels
export const authenticatePro = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyAccessToken(token) as any;

      // Vérifier que c'est bien un token pro
      if (decoded.type !== 'professional' || !decoded.professionalId) {
        res.status(401).json({
          success: false,
          message: 'Token invalide pour un professionnel',
        });
        return;
      }

      // Vérifier que le professionnel existe
      const professional = await prisma.professional.findUnique({
        where: { id: decoded.professionalId },
        select: { id: true, email: true },
      });

      if (!professional) {
        res.status(401).json({
          success: false,
          message: 'Professionnel non trouvé',
        });
        return;
      }

      req.professional = professional;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware d'authentification pour les administrateurs
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyAccessToken(token) as any;

      // Vérifier que c'est bien un token admin
      if (decoded.type !== 'admin' || !decoded.adminId) {
        res.status(401).json({
          success: false,
          message: 'Token invalide pour un administrateur',
        });
        return;
      }

      // Vérifier que l'admin existe et est actif
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!admin || !admin.isActive) {
        res.status(401).json({
          success: false,
          message: 'Administrateur non trouvé ou désactivé',
        });
        return;
      }

      req.admin = { id: admin.id, email: admin.email, role: admin.role };
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware pour vérifier le rôle super_admin
export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.admin?.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Accès réservé aux super administrateurs',
    });
    return;
  }
  next();
};
