// Jobs planifiés pour les rappels de missions
import cron from 'node-cron';
import prisma from '../config/database';
import { sendPushNotification } from '../services/notificationService';
import { sendEmail } from '../services/emailService';
import { sendMorningReminderSMS, sendOneHourReminderSMS } from '../services/smsService';

interface MissionWithDetails {
  id: string;
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    pushToken: string | null;
  } | null;
  booking: {
    service: string;
    date: Date;
    time: string;
    duration: number;
    address: string;
    user: {
      name: string;
    };
  };
}

// Formater la date pour l'affichage
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

// Formater le type de service
const formatServiceType = (service: string): string => {
  const serviceNames: Record<string, string> = {
    MENAGE: 'Ménage',
    REPASSAGE: 'Repassage',
    MENAGE_REPASSAGE: 'Ménage + Repassage',
  };
  return serviceNames[service] || service;
};

// Envoyer une notification multi-canal au pro
const sendMultiChannelReminderToPro = async (
  mission: MissionWithDetails,
  type: 'morning' | 'one_hour'
): Promise<void> => {
  const pro = mission.professional;
  if (!pro) return;

  const details = {
    clientName: mission.booking.user.name,
    address: mission.booking.address,
    date: formatDate(mission.booking.date),
    time: mission.booking.time,
    duration: mission.booking.duration,
    service: formatServiceType(mission.booking.service),
  };

  const title = type === 'morning'
    ? 'Rappel - Mission aujourd\'hui'
    : 'Rappel - Mission dans 1h';

  const body = type === 'morning'
    ? `Vous avez une mission aujourd'hui à ${details.time} chez ${details.clientName}`
    : `Votre mission chez ${details.clientName} commence dans 1 heure`;

  // 1. Push notification
  if (pro.pushToken) {
    await sendPushNotification({
      pushToken: pro.pushToken,
      title,
      body,
      data: {
        type: type === 'morning' ? 'morning_reminder' : 'one_hour_reminder',
        missionId: mission.id,
      },
    });
    console.log(`[Reminder] Push envoyé à ${pro.firstName} ${pro.lastName}`);
  }

  // 2. Email
  await sendEmail({
    to: pro.email,
    subject: title,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; background: #4cb04f; color: white; border-radius: 10px 10px 0 0; }
          .logo { font-size: 24px; font-weight: bold; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .mission-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4cb04f;
            margin: 20px 0;
          }
          .mission-detail { margin: 10px 0; }
          .label { color: #888; font-size: 12px; text-transform: uppercase; }
          .value { font-size: 16px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CleanHouse Pro</div>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p>Bonjour ${pro.firstName},</p>
            <p>${type === 'morning'
              ? 'Voici le rappel de votre mission du jour :'
              : 'Votre prochaine mission commence bientôt :'}</p>

            <div class="mission-card">
              <div class="mission-detail">
                <div class="label">Client</div>
                <div class="value">${details.clientName}</div>
              </div>
              <div class="mission-detail">
                <div class="label">Adresse</div>
                <div class="value">${details.address}</div>
              </div>
              <div class="mission-detail">
                <div class="label">Heure</div>
                <div class="value">${details.time}</div>
              </div>
              <div class="mission-detail">
                <div class="label">Durée</div>
                <div class="value">${details.duration} heure(s)</div>
              </div>
              <div class="mission-detail">
                <div class="label">Service</div>
                <div class="value">${details.service}</div>
              </div>
            </div>

            ${type === 'one_hour'
              ? '<p><strong>N\'oubliez pas d\'activer le partage de localisation dans l\'app !</strong></p>'
              : '<p>Bonne journée et bonne mission !</p>'}
          </div>
          <div class="footer">
            <p>CleanHouse Pro - L'équipe</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `${title}\n\nClient: ${details.clientName}\nAdresse: ${details.address}\nHeure: ${details.time}\nDurée: ${details.duration}h\nService: ${details.service}`,
  });
  console.log(`[Reminder] Email envoyé à ${pro.email}`);

  // 3. SMS
  if (pro.phone) {
    if (type === 'morning') {
      await sendMorningReminderSMS(pro.phone, details);
    } else {
      await sendOneHourReminderSMS(pro.phone, details);
    }
    console.log(`[Reminder] SMS envoyé à ${pro.phone}`);
  }
};

// Job: Rappel du matin à 7h00
// Envoie un rappel à tous les pros qui ont des missions aujourd'hui
export const morningReminderJob = async (): Promise<void> => {
  console.log('[Job] Démarrage du rappel matin');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const missions = await prisma.mission.findMany({
      where: {
        status: 'assigned',
        booking: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        professionalId: { not: null },
      },
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            pushToken: true,
          },
        },
        booking: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    console.log(`[Job] ${missions.length} missions trouvées pour aujourd'hui`);

    for (const mission of missions) {
      await sendMultiChannelReminderToPro(mission as MissionWithDetails, 'morning');
    }

    console.log('[Job] Rappel matin terminé');
  } catch (error) {
    console.error('[Job] Erreur rappel matin:', error);
  }
};

// Job: Rappel 1h avant (toutes les 15 minutes)
// Vérifie les missions qui commencent dans ~1h et envoie un rappel
export const oneHourReminderJob = async (): Promise<void> => {
  console.log('[Job] Vérification des rappels 1h avant');

  const now = new Date();
  // Missions qui commencent dans 55-70 minutes (pour couvrir le créneau de 15 min)
  const oneHourFromNow = new Date(now.getTime() + 55 * 60 * 1000);
  const oneHour15FromNow = new Date(now.getTime() + 70 * 60 * 1000);

  try {
    // Récupérer les missions assignées du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const missions = await prisma.mission.findMany({
      where: {
        status: 'assigned',
        booking: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        professionalId: { not: null },
      },
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            pushToken: true,
          },
        },
        booking: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    for (const mission of missions) {
      // Parser l'heure de la mission (format HH:MM)
      const [hours, minutes] = mission.booking.time.split(':').map(Number);
      const missionTime = new Date(mission.booking.date);
      missionTime.setHours(hours, minutes, 0, 0);

      // Vérifier si la mission est dans le créneau 1h avant
      if (missionTime >= oneHourFromNow && missionTime <= oneHour15FromNow) {
        console.log(`[Job] Rappel 1h pour mission ${mission.id} à ${mission.booking.time}`);
        await sendMultiChannelReminderToPro(mission as MissionWithDetails, 'one_hour');
      }
    }

    console.log('[Job] Vérification rappels 1h terminée');
  } catch (error) {
    console.error('[Job] Erreur rappel 1h:', error);
  }
};

// Initialiser les jobs cron
export const initReminderJobs = (): void => {
  // Rappel matin à 7h00 tous les jours
  cron.schedule('0 7 * * *', morningReminderJob, {
    timezone: 'Europe/Paris',
  });
  console.log('[Cron] Job rappel matin initialisé (7h00 tous les jours)');

  // Vérification des rappels 1h avant toutes les 15 minutes
  cron.schedule('*/15 * * * *', oneHourReminderJob, {
    timezone: 'Europe/Paris',
  });
  console.log('[Cron] Job rappel 1h initialisé (toutes les 15 minutes)');
};

export default {
  morningReminderJob,
  oneHourReminderJob,
  initReminderJobs,
};
