// Service SMS avec Twilio
import Twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialiser le client Twilio (uniquement si configuré)
let twilioClient: ReturnType<typeof Twilio> | null = null;

if (accountSid && authToken) {
  twilioClient = Twilio(accountSid, authToken);
}

interface MissionDetails {
  clientName: string;
  address: string;
  date: string;
  time: string;
  duration: number;
  service: string;
}

// Envoyer un SMS
export const sendSMS = async (to: string, message: string): Promise<boolean> => {
  if (!twilioClient || !twilioPhoneNumber) {
    console.log('[SMS] Twilio non configuré, SMS non envoyé:', { to, message });
    return false;
  }

  try {
    // Formater le numéro de téléphone (ajouter +33 si nécessaire)
    const formattedPhone = formatPhoneNumber(to);

    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone,
    });

    console.log(`[SMS] Envoyé à ${formattedPhone}`);
    return true;
  } catch (error) {
    console.error('[SMS] Erreur envoi SMS:', error);
    return false;
  }
};

// Formater le numéro de téléphone pour Twilio
const formatPhoneNumber = (phone: string): string => {
  // Enlever les espaces et caractères spéciaux
  let cleaned = phone.replace(/[\s\-\.]/g, '');

  // Si le numéro commence par 0, remplacer par +33
  if (cleaned.startsWith('0')) {
    cleaned = '+33' + cleaned.substring(1);
  }

  // Si le numéro n'a pas de préfixe international, ajouter +33
  if (!cleaned.startsWith('+')) {
    cleaned = '+33' + cleaned;
  }

  return cleaned;
};

// SMS d'assignation de mission
export const sendMissionAssignmentSMS = async (
  phone: string,
  details: MissionDetails
): Promise<boolean> => {
  const message = `CleanHouse - Nouvelle mission !
📍 ${details.address}
📅 ${details.date} à ${details.time}
⏱ ${details.duration}h - ${formatServiceType(details.service)}
Client: ${details.clientName}
Consultez l'app pour plus de détails.`;

  return sendSMS(phone, message);
};

// SMS de rappel matin (7h)
export const sendMorningReminderSMS = async (
  phone: string,
  details: MissionDetails
): Promise<boolean> => {
  const message = `CleanHouse - Rappel: Mission aujourd'hui !
📍 ${details.address}
🕐 ${details.time}
⏱ ${details.duration}h
Bonne journée !`;

  return sendSMS(phone, message);
};

// SMS de rappel 1h avant
export const sendOneHourReminderSMS = async (
  phone: string,
  details: MissionDetails
): Promise<boolean> => {
  const message = `CleanHouse - Rappel: Mission dans 1h !
📍 ${details.address}
🕐 ${details.time}
N'oubliez pas d'activer la géolocalisation.`;

  return sendSMS(phone, message);
};

// SMS d'invitation à créer un compte
export const sendInvitationSMS = async (
  phone: string,
  firstName: string
): Promise<boolean> => {
  const message = `Bonjour ${firstName} ! Vous avez été invité(e) à rejoindre CleanHouse. Consultez votre email pour créer votre compte professionnel.`;

  return sendSMS(phone, message);
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

export default {
  sendSMS,
  sendMissionAssignmentSMS,
  sendMorningReminderSMS,
  sendOneHourReminderSMS,
  sendInvitationSMS,
};
