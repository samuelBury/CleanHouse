// Service d'auto-assignation des professionnels
import prisma from '../config/database';
import { findMatchingProfessionals, assignMission } from './matchingService';
import { sendMultiChannelNotification } from './multiChannelNotificationService';
import { sendPushNotification } from './notificationService';

export interface AutoAssignmentResult {
  success: boolean;
  reason?: string;
  professional?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatar: string | null;
    rating: number;
    totalMissions: number;
  };
}

/**
 * Auto-assigne le meilleur professionnel disponible à une réservation
 * et envoie les notifications appropriées (push, email, SMS)
 */
export const autoAssignProfessional = async (bookingId: string): Promise<AutoAssignmentResult> => {
  console.log(`[AutoAssign] Starting auto-assignment for booking ${bookingId}`);

  try {
    // 1. Récupérer le booking avec sa mission et l'utilisateur
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        mission: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            pushToken: true,
          },
        },
      },
    });

    if (!booking) {
      console.error(`[AutoAssign] Booking ${bookingId} not found`);
      return { success: false, reason: 'booking_not_found' };
    }

    if (!booking.mission) {
      console.error(`[AutoAssign] No mission found for booking ${bookingId}`);
      return { success: false, reason: 'mission_not_found' };
    }

    if (!booking.latitude || !booking.longitude) {
      console.warn(`[AutoAssign] Booking ${bookingId} has no coordinates`);
      return { success: false, reason: 'no_coordinates' };
    }

    // 2. Trouver les professionnels disponibles via l'algorithme de matching
    const matches = await findMatchingProfessionals({
      latitude: booking.latitude,
      longitude: booking.longitude,
      date: booking.date,
      duration: booking.duration,
      serviceType: booking.service,
    });

    console.log(`[AutoAssign] Found ${matches.length} potential professionals`);

    // 3. Prendre le meilleur professionnel disponible
    const bestMatch = matches.find(m => m.availability);

    if (!bestMatch) {
      console.log(`[AutoAssign] No available professional found for booking ${bookingId}`);
      return { success: false, reason: 'no_professional_available' };
    }

    console.log(`[AutoAssign] Best match: ${bestMatch.professional.firstName} ${bestMatch.professional.lastName} (score: ${bestMatch.score})`);

    // 4. Assigner la mission au professionnel
    const mission = await assignMission(
      booking.mission.id,
      bestMatch.professional.id,
      'system_auto' // adminId = système automatique
    );

    console.log(`[AutoAssign] Mission ${mission.id} assigned to professional ${bestMatch.professional.id}`);

    // 5. Mettre à jour le champ professional du booking (pour affichage)
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        professional: `${bestMatch.professional.firstName} ${bestMatch.professional.lastName}`,
      },
    });

    // 6. Notifier le professionnel (multi-canal: push + email + SMS)
    try {
      const notificationResult = await sendMultiChannelNotification(
        bestMatch.professional.id,
        'assignment',
        {
          missionId: mission.id,
          clientName: booking.user.name,
          address: booking.address,
          date: booking.date,
          time: booking.time,
          duration: booking.duration,
          service: booking.service,
        }
      );
      console.log(`[AutoAssign] Professional notified - Push: ${notificationResult.push}, Email: ${notificationResult.email}, SMS: ${notificationResult.sms}`);
    } catch (notifError) {
      console.error('[AutoAssign] Error notifying professional:', notifError);
      // On continue même si la notification échoue
    }

    // 7. Notifier le client (push) que le pro a été assigné
    try {
      if (booking.user.pushToken) {
        await sendPushNotification({
          pushToken: booking.user.pushToken,
          title: 'Professionnel trouvé !',
          body: `${bestMatch.professional.firstName} s'occupera de votre prestation.`,
          data: {
            type: 'professional_assigned',
            bookingId: booking.id,
            professionalName: `${bestMatch.professional.firstName} ${bestMatch.professional.lastName}`,
          },
        });
        console.log(`[AutoAssign] Client ${booking.user.id} notified via push`);
      } else {
        console.log(`[AutoAssign] Client ${booking.user.id} has no pushToken, skipping push notification`);
      }
    } catch (clientNotifError) {
      console.error('[AutoAssign] Error notifying client:', clientNotifError);
    }

    return {
      success: true,
      professional: {
        id: bestMatch.professional.id,
        firstName: bestMatch.professional.firstName,
        lastName: bestMatch.professional.lastName,
        phone: bestMatch.professional.phone,
        avatar: bestMatch.professional.avatar,
        rating: bestMatch.professional.rating,
        totalMissions: bestMatch.professional.totalMissions,
      },
    };
  } catch (error) {
    console.error('[AutoAssign] Unexpected error:', error);
    return { success: false, reason: 'internal_error' };
  }
};

export default {
  autoAssignProfessional,
};
