// Middleware de contrôle d'accès basé sur les zones
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

// Étendre les types pour inclure les zones de l'admin
declare global {
  namespace Express {
    interface Request {
      adminZoneIds?: string[];
    }
  }
}

// Charger les zones de l'admin et les ajouter à la requête
export const loadAdminZones = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Authentification admin requise',
      });
      return;
    }

    // Les super_admin ont accès à toutes les zones
    if (req.admin.role === 'super_admin') {
      req.adminZoneIds = undefined; // undefined = pas de filtrage
      next();
      return;
    }

    // Charger les zones assignées à l'opérateur
    const adminZones = await prisma.adminZone.findMany({
      where: { adminId: req.admin.id },
      select: { zoneId: true },
    });

    req.adminZoneIds = adminZones.map(az => az.zoneId);
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware pour filtrer les missions par zone
export const filterMissionsByZone = (zoneField: string = 'booking.zone') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Si pas de restriction de zones, continuer
    if (req.adminZoneIds === undefined) {
      next();
      return;
    }

    // Ajouter le filtre de zone aux query params
    req.query.zoneIds = req.adminZoneIds.join(',');
    next();
  };
};

// Vérifier l'accès à une mission spécifique
export const checkMissionAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const missionId = req.params.missionId || req.params.id;

    if (!missionId) {
      next();
      return;
    }

    // Si super_admin, pas de vérification
    if (req.adminZoneIds === undefined) {
      next();
      return;
    }

    // Récupérer la mission avec son booking et la zone
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
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
      res.status(404).json({
        success: false,
        message: 'Mission non trouvée',
      });
      return;
    }

    // Vérifier si la mission est dans une zone accessible
    // On utilise les coordonnées de la mission pour trouver sa zone
    if (mission.booking.latitude && mission.booking.longitude) {
      const accessibleZone = await prisma.zone.findFirst({
        where: {
          id: { in: req.adminZoneIds },
          isActive: true,
        },
      });

      if (!accessibleZone) {
        res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette mission',
        });
        return;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Vérifier l'accès à un professionnel spécifique
export const checkProfessionalAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const professionalId = req.params.professionalId || req.params.id;

    if (!professionalId) {
      next();
      return;
    }

    // Si super_admin, pas de vérification
    if (req.adminZoneIds === undefined) {
      next();
      return;
    }

    // Vérifier si le professionnel est dans une zone accessible
    const professionalInZone = await prisma.professionalZone.findFirst({
      where: {
        professionalId,
        zoneId: { in: req.adminZoneIds },
      },
    });

    if (!professionalInZone) {
      res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce professionnel',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  loadAdminZones,
  filterMissionsByZone,
  checkMissionAccess,
  checkProfessionalAccess,
};
