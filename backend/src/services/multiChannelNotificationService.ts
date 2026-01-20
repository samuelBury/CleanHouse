// Service de notifications multi-canal (Email + Push + SMS)
import prisma from '../config/database';
import { sendPushNotification } from './notificationService';
import { sendEmail } from './emailService';
import {
  sendMissionAssignmentSMS,
  sendMorningReminderSMS,
  sendOneHourReminderSMS,
} from './smsService';

export type NotificationType = 'assignment' | 'morning_reminder' | 'one_hour_reminder' | 'mission_cancelled';

interface MissionData {
  missionId: string;
  clientName: string;
  address: string;
  date: Date;
  time: string;
  duration: number;
  service: string;
}

// Formater la date pour l'affichage
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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

// Envoyer une notification multi-canal à un professionnel
export const sendMultiChannelNotification = async (
  professionalId: string,
  type: NotificationType,
  data: MissionData
): Promise<{ email: boolean; push: boolean; sms: boolean }> => {
  const results = { email: false, push: false, sms: false };

  // Récupérer les infos du professionnel
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      pushToken: true,
    },
  });

  if (!professional) {
    console.error(`Professional ${professionalId} not found`);
    return results;
  }

  const details = {
    clientName: data.clientName,
    address: data.address,
    date: formatDate(data.date),
    time: data.time,
    duration: data.duration,
    service: formatServiceType(data.service),
  };

  // Construire le contenu selon le type de notification
  let title: string;
  let body: string;
  let pushData: Record<string, any>;

  switch (type) {
    case 'assignment':
      title = 'Nouvelle mission assignée !';
      body = `Mission le ${details.date} à ${details.time} chez ${details.clientName}`;
      pushData = { type: 'mission_assignment', missionId: data.missionId };
      break;

    case 'morning_reminder':
      title = 'Rappel - Mission aujourd\'hui';
      body = `Vous avez une mission à ${details.time} chez ${details.clientName}`;
      pushData = { type: 'morning_reminder', missionId: data.missionId };
      break;

    case 'one_hour_reminder':
      title = 'Rappel - Mission dans 1h';
      body = `Votre mission chez ${details.clientName} commence dans 1 heure`;
      pushData = { type: 'one_hour_reminder', missionId: data.missionId };
      break;

    case 'mission_cancelled':
      title = 'Mission annulée';
      body = `La mission du ${details.date} à ${details.time} a été annulée`;
      pushData = { type: 'mission_cancelled', missionId: data.missionId };
      break;

    default:
      return results;
  }

  // 1. Envoyer la notification Push
  if (professional.pushToken) {
    try {
      await sendPushNotification({
        pushToken: professional.pushToken,
        title,
        body,
        data: pushData,
      });
      results.push = true;
      console.log(`[Multi-channel] Push envoyé à ${professional.firstName} ${professional.lastName}`);
    } catch (error) {
      console.error('[Multi-channel] Erreur push:', error);
    }
  }

  // 2. Envoyer l'email
  try {
    await sendNotificationEmail(professional.email, professional.firstName, type, details);
    results.email = true;
    console.log(`[Multi-channel] Email envoyé à ${professional.email}`);
  } catch (error) {
    console.error('[Multi-channel] Erreur email:', error);
  }

  // 3. Envoyer le SMS
  if (professional.phone) {
    try {
      switch (type) {
        case 'assignment':
          await sendMissionAssignmentSMS(professional.phone, details);
          break;
        case 'morning_reminder':
          await sendMorningReminderSMS(professional.phone, details);
          break;
        case 'one_hour_reminder':
          await sendOneHourReminderSMS(professional.phone, details);
          break;
        default:
          // Pour les autres types, pas de SMS spécifique
          break;
      }
      results.sms = true;
      console.log(`[Multi-channel] SMS envoyé à ${professional.phone}`);
    } catch (error) {
      console.error('[Multi-channel] Erreur SMS:', error);
    }
  }

  return results;
};

// Envoyer l'email de notification selon le type
const sendNotificationEmail = async (
  to: string,
  firstName: string,
  type: NotificationType,
  details: {
    clientName: string;
    address: string;
    date: string;
    time: string;
    duration: number;
    service: string;
  }
): Promise<boolean> => {
  let subject: string;
  let contentTitle: string;
  let contentMessage: string;
  let ctaText: string;

  switch (type) {
    case 'assignment':
      subject = 'Nouvelle mission assignée - CleanHouse Pro';
      contentTitle = 'Une nouvelle mission vous a été assignée !';
      contentMessage = 'Voici les détails de votre prochaine mission :';
      ctaText = 'Voir dans l\'app';
      break;

    case 'morning_reminder':
      subject = 'Rappel - Mission aujourd\'hui - CleanHouse Pro';
      contentTitle = 'Rappel de votre mission du jour';
      contentMessage = 'N\'oubliez pas votre mission d\'aujourd\'hui :';
      ctaText = 'Voir les détails';
      break;

    case 'one_hour_reminder':
      subject = 'Rappel - Mission dans 1 heure - CleanHouse Pro';
      contentTitle = 'Votre mission commence bientôt !';
      contentMessage = 'Votre prochaine mission commence dans environ 1 heure :';
      ctaText = 'Démarrer la navigation';
      break;

    case 'mission_cancelled':
      subject = 'Mission annulée - CleanHouse Pro';
      contentTitle = 'Une mission a été annulée';
      contentMessage = 'La mission suivante a été annulée :';
      ctaText = 'Voir mes missions';
      break;

    default:
      return false;
  }

  return sendEmail({
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #4cb04f 0%, #45a049 100%);
            color: white;
            border-radius: 10px 10px 0 0;
          }
          .logo { font-size: 24px; font-weight: bold; }
          .badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 8px;
          }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .mission-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4cb04f;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .mission-detail { margin: 12px 0; }
          .label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { font-size: 16px; font-weight: bold; color: #333; margin-top: 4px; }
          .button {
            display: inline-block;
            background: #4cb04f;
            color: white !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          .reminder {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            border-left: 4px solid #2196F3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CleanHouse <span class="badge">PRO</span></div>
          </div>
          <div class="content">
            <h2>${contentTitle}</h2>
            <p>Bonjour ${firstName},</p>
            <p>${contentMessage}</p>

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
                <div class="label">Date</div>
                <div class="value">${details.date}</div>
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

            <p style="text-align: center;">
              <a href="#" class="button">${ctaText}</a>
            </p>

            ${type === 'one_hour_reminder' ? `
              <div class="reminder">
                <strong>Rappel important :</strong> N'oubliez pas d'activer le partage de localisation dans l'application pour que le client puisse suivre votre trajet !
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>CleanHouse Pro - L'équipe</p>
            <p>Cet email a été envoyé automatiquement.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
${contentTitle}

Bonjour ${firstName},

${contentMessage}

Client: ${details.clientName}
Adresse: ${details.address}
Date: ${details.date}
Heure: ${details.time}
Durée: ${details.duration} heure(s)
Service: ${details.service}

${type === 'one_hour_reminder' ? "N'oubliez pas d'activer le partage de localisation !" : ''}

L'équipe CleanHouse Pro
    `,
  });
};

export default {
  sendMultiChannelNotification,
};
