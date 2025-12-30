// Hook de notifications push pour CleanHouse
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import { authService } from '../services/authService';
import type { PushNotification } from '../types';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface UseNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isLoading: boolean;
  error: string | null;
  registerForPushNotifications: () => Promise<string | null>;
  scheduleNotification: (notification: PushNotification, trigger?: Notifications.NotificationTriggerInput) => Promise<string | null>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsResult => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification interactions
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { notification } = response;
        // Handle notification tap here
        console.log('Notification tapped:', notification.request.content);
      }
    );

    // Load stored push token
    loadStoredToken();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const loadStoredToken = async () => {
    const token = await storage.getPushToken();
    if (token) {
      setExpoPushToken(token);
    }
  };

  // Register for push notifications
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if physical device
      if (!Device.isDevice) {
        setError('Les notifications push nécessitent un appareil physique');
        setIsLoading(false);
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError('Permission de notification refusée');
        setIsLoading(false);
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      });

      const token = tokenData.data;
      setExpoPushToken(token);

      // Store token locally
      await storage.setPushToken(token);

      // Send token to backend
      await authService.updatePushToken(token);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4cb04f',
        });
      }

      setIsLoading(false);
      return token;
    } catch (err) {
      setError('Erreur lors de l\'enregistrement des notifications');
      setIsLoading(false);
      return null;
    }
  }, []);

  // Schedule a local notification
  const scheduleNotification = useCallback(
    async (
      notificationData: PushNotification,
      trigger?: Notifications.NotificationTriggerInput
    ): Promise<string | null> => {
      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: notificationData.title,
            body: notificationData.body,
            data: notificationData.data || {},
          },
          trigger: trigger || null, // null = immediate
        });

        return notificationId;
      } catch (err) {
        console.error('Error scheduling notification:', err);
        return null;
      }
    },
    []
  );

  // Cancel a specific notification
  const cancelNotification = useCallback(async (notificationId: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }, []);

  // Cancel all notifications
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  return {
    expoPushToken,
    notification,
    isLoading,
    error,
    registerForPushNotifications,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
  };
};

// Helper function to schedule booking reminder (24h before)
export const scheduleBookingReminder = async (
  bookingId: string,
  serviceName: string,
  date: Date
): Promise<string | null> => {
  const reminderDate = new Date(date);
  reminderDate.setHours(reminderDate.getHours() - 24);

  // Don't schedule if the reminder time has already passed
  if (reminderDate <= new Date()) {
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rappel de réservation',
        body: `Votre prestation ${serviceName} est prévue demain`,
        data: { bookingId, type: 'booking_reminder' },
      },
      trigger: {
        date: reminderDate,
      },
    });

    return notificationId;
  } catch (err) {
    console.error('Error scheduling reminder:', err);
    return null;
  }
};

export default useNotifications;
