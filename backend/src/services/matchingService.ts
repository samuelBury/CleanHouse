// Service de matching - Algorithme d'assignation des missions
import prisma from '../config/database';
import { Professional, Mission, MissionStatus } from '@prisma/client';

export interface MatchingCriteria {
  latitude: number;
  longitude: number;
  date: Date;
  duration: number;
  serviceType: string;
}

export interface MatchedProfessional {
  professional: Pick<Professional, 'id' | 'firstName' | 'lastName' | 'phone' | 'rating' | 'totalMissions' | 'avatar'>;
  score: number;
  distance: number;
  availability: boolean;
  reasons: string[];
}

// Calculer la distance en km entre deux points (formule de Haversine)
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Trouver les professionnels correspondants pour une mission
export const findMatchingProfessionals = async (
  criteria: MatchingCriteria,
  zoneIds?: string[]
): Promise<MatchedProfessional[]> => {
  // Récupérer les professionnels disponibles
  const whereClause: Record<string, unknown> = {
    isAvailable: true,
  };

  // Filtrer par zones si spécifié
  if (zoneIds && zoneIds.length > 0) {
    whereClause.zones = {
      some: {
        zoneId: { in: zoneIds },
      },
    };
  }

  const professionals = await prisma.professional.findMany({
    where: whereClause,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      latitude: true,
      longitude: true,
      radius: true,
      rating: true,
      totalMissions: true,
      zones: {
        include: {
          zone: true,
        },
      },
      missions: {
        where: {
          status: { in: ['assigned', 'in_progress'] },
          booking: {
            date: {
              gte: new Date(criteria.date.getTime() - 24 * 60 * 60 * 1000),
              lte: new Date(criteria.date.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        },
        include: {
          booking: {
            select: { date: true, time: true, duration: true },
          },
        },
      },
    },
  });

  // Calculer le score pour chaque professionnel
  const matches: MatchedProfessional[] = [];

  for (const pro of professionals) {
    const reasons: string[] = [];
    let score = 100;

    // 1. Distance (max 40 points de pénalité)
    let distance = Infinity;
    if (pro.latitude && pro.longitude) {
      distance = calculateDistance(
        criteria.latitude,
        criteria.longitude,
        pro.latitude,
        pro.longitude
      );

      if (distance > pro.radius) {
        reasons.push(`Distance ${distance.toFixed(1)}km > rayon ${pro.radius}km`);
        continue; // Hors zone d'intervention
      }

      // Pénalité proportionnelle à la distance
      const distancePenalty = (distance / pro.radius) * 40;
      score -= distancePenalty;
      reasons.push(`Distance: ${distance.toFixed(1)}km (-${distancePenalty.toFixed(0)}pts)`);
    } else {
      reasons.push('Pas de coordonnées GPS');
      continue;
    }

    // 2. Disponibilité le jour J (vérifier les conflits d'horaire)
    let isAvailable = true;
    const missionDate = criteria.date;
    const missionHour = missionDate.getHours();
    const missionEndHour = missionHour + criteria.duration;

    for (const mission of pro.missions) {
      const existingDate = mission.booking.date;
      const existingHour = parseInt(mission.booking.time.split(':')[0], 10);
      const existingEndHour = existingHour + mission.booking.duration;

      // Même jour ?
      if (existingDate.toDateString() === missionDate.toDateString()) {
        // Chevauchement d'horaires ?
        if (
          (missionHour >= existingHour && missionHour < existingEndHour) ||
          (missionEndHour > existingHour && missionEndHour <= existingEndHour) ||
          (missionHour <= existingHour && missionEndHour >= existingEndHour)
        ) {
          isAvailable = false;
          reasons.push(`Conflit horaire: ${mission.booking.time} (${mission.booking.duration}h)`);
          break;
        }
      }
    }

    if (!isAvailable) {
      score -= 100; // Marquer comme indisponible mais garder dans la liste
    }

    // 3. Rating (max 20 points bonus)
    const ratingBonus = ((pro.rating - 3) / 2) * 20; // 3 = neutre, 5 = +20pts
    score += ratingBonus;
    reasons.push(`Rating: ${pro.rating}/5 (+${ratingBonus.toFixed(0)}pts)`);

    // 4. Expérience (max 15 points bonus)
    const experienceBonus = Math.min(pro.totalMissions / 100, 1) * 15;
    score += experienceBonus;
    reasons.push(`Expérience: ${pro.totalMissions} missions (+${experienceBonus.toFixed(0)}pts)`);

    // 5. Priorité zone (max 10 points bonus)
    const proZone = pro.zones.find(z => zoneIds?.includes(z.zoneId));
    if (proZone && proZone.priority > 0) {
      const zonePriorityBonus = Math.min(proZone.priority, 10);
      score += zonePriorityBonus;
      reasons.push(`Priorité zone: ${proZone.priority} (+${zonePriorityBonus}pts)`);
    }

    matches.push({
      professional: {
        id: pro.id,
        firstName: pro.firstName,
        lastName: pro.lastName,
        phone: pro.phone,
        rating: pro.rating,
        totalMissions: pro.totalMissions,
        avatar: pro.avatar,
      },
      score: Math.max(0, Math.round(score)),
      distance,
      availability: isAvailable,
      reasons,
    });
  }

  // Trier par disponibilité puis par score
  return matches.sort((a, b) => {
    if (a.availability !== b.availability) {
      return a.availability ? -1 : 1;
    }
    return b.score - a.score;
  });
};

// Assigner une mission à un professionnel
export const assignMission = async (
  missionId: string,
  professionalId: string,
  adminId: string
): Promise<Mission> => {
  const mission = await prisma.mission.update({
    where: { id: missionId },
    data: {
      professionalId,
      status: 'assigned',
      assignedAt: new Date(),
      assignedBy: adminId,
    },
    include: {
      booking: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      professional: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  // Incrémenter le compteur de missions du pro
  await prisma.professional.update({
    where: { id: professionalId },
    data: {
      totalMissions: { increment: 1 },
    },
  });

  return mission;
};

// Réassigner une mission
export const reassignMission = async (
  missionId: string,
  newProfessionalId: string,
  adminId: string,
  reason?: string
): Promise<Mission> => {
  // Récupérer l'ancien professionnel
  const oldMission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { professionalId: true },
  });

  // Mettre à jour la mission
  const mission = await prisma.mission.update({
    where: { id: missionId },
    data: {
      professionalId: newProfessionalId,
      assignedAt: new Date(),
      assignedBy: adminId,
    },
    include: {
      booking: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      professional: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  // Décrémenter l'ancien pro et incrémenter le nouveau
  if (oldMission?.professionalId) {
    await prisma.professional.update({
      where: { id: oldMission.professionalId },
      data: { totalMissions: { decrement: 1 } },
    });
  }

  await prisma.professional.update({
    where: { id: newProfessionalId },
    data: { totalMissions: { increment: 1 } },
  });

  return mission;
};

// Obtenir les suggestions de matching pour une mission
export const getMissionMatchingSuggestions = async (
  missionId: string,
  zoneIds?: string[]
): Promise<MatchedProfessional[]> => {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      booking: true,
    },
  });

  if (!mission) {
    throw new Error('Mission non trouvée');
  }

  if (!mission.booking.latitude || !mission.booking.longitude) {
    throw new Error('Coordonnées de la mission manquantes');
  }

  return findMatchingProfessionals(
    {
      latitude: mission.booking.latitude,
      longitude: mission.booking.longitude,
      date: mission.booking.date,
      duration: mission.booking.duration,
      serviceType: mission.booking.service,
    },
    zoneIds
  );
};

export default {
  findMatchingProfessionals,
  assignMission,
  reassignMission,
  getMissionMatchingSuggestions,
  calculateDistance,
};
