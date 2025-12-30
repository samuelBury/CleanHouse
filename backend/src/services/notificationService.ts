// Service de notifications push avec Expo
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();

export interface PushNotificationData {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface BatchNotificationData {
  pushTokens: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Vérifier si un token est valide
export const isValidPushToken = (token: string): boolean => {
  return Expo.isExpoPushToken(token);
};

// Envoyer une notification unique
export const sendPushNotification = async (
  notification: PushNotificationData
): Promise<ExpoPushTicket | null> => {
  const { pushToken, title, body, data } = notification;

  if (!isValidPushToken(pushToken)) {
    console.warn(`Invalid push token: ${pushToken}`);
    return null;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    return tickets[0];
  } catch (error) {
    console.error('Error sending push notification:', error);
    return null;
  }
};

// Envoyer des notifications en batch
export const sendBatchNotifications = async (
  notification: BatchNotificationData
): Promise<ExpoPushTicket[]> => {
  const { pushTokens, title, body, data } = notification;

  const messages: ExpoPushMessage[] = pushTokens
    .filter(isValidPushToken)
    .map((token) => ({
      to: token,
      sound: 'default' as const,
      title,
      body,
      data,
    }));

  if (messages.length === 0) {
    return [];
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending batch notifications:', error);
    }
  }

  return tickets;
};

// Notifications prédéfinies pour CleanHouse

// Notification de confirmation de réservation
export const sendBookingConfirmation = async (
  pushToken: string,
  bookingDate: string,
  service: string
): Promise<ExpoPushTicket | null> => {
  return sendPushNotification({
    pushToken,
    title: 'Réservation confirmée',
    body: `Votre ${service} est confirmé pour le ${bookingDate}`,
    data: { type: 'booking_confirmation' },
  });
};

// Rappel de réservation (24h avant)
export const sendBookingReminder = async (
  pushToken: string,
  bookingDate: string,
  service: string,
  professional: string
): Promise<ExpoPushTicket | null> => {
  return sendPushNotification({
    pushToken,
    title: 'Rappel - Prestation demain',
    body: `${professional} viendra demain pour votre ${service}`,
    data: { type: 'booking_reminder' },
  });
};

// Notification de début de prestation
export const sendServiceStarted = async (
  pushToken: string,
  professional: string
): Promise<ExpoPushTicket | null> => {
  return sendPushNotification({
    pushToken,
    title: 'Prestation en cours',
    body: `${professional} a commencé la prestation`,
    data: { type: 'service_started' },
  });
};

// Notification de fin de prestation
export const sendServiceCompleted = async (
  pushToken: string,
  service: string
): Promise<ExpoPushTicket | null> => {
  return sendPushNotification({
    pushToken,
    title: 'Prestation terminée',
    body: `Votre ${service} est terminé. Merci de votre confiance !`,
    data: { type: 'service_completed' },
  });
};

// Notification de paiement confirmé
export const sendPaymentConfirmed = async (
  pushToken: string,
  amount: number
): Promise<ExpoPushTicket | null> => {
  return sendPushNotification({
    pushToken,
    title: 'Paiement confirmé',
    body: `Votre paiement de ${amount.toFixed(2)} EUR a été confirmé`,
    data: { type: 'payment_confirmed' },
  });
};

// Notification d'annulation
export const sendBookingCancelled = async (
  pushToken: string,
  bookingDate: string
): Promise<ExpoPushTicket | null> => {
  return sendPushNotification({
    pushToken,
    title: 'Réservation annulée',
    body: `Votre réservation du ${bookingDate} a été annulée`,
    data: { type: 'booking_cancelled' },
  });
};

export default {
  isValidPushToken,
  sendPushNotification,
  sendBatchNotifications,
  sendBookingConfirmation,
  sendBookingReminder,
  sendServiceStarted,
  sendServiceCompleted,
  sendPaymentConfirmed,
  sendBookingCancelled,
};
