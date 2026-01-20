// Hook de notifications push pour CleanHouse
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Colors } from '../config/theme';
import { storage } from '../utils/storage';
import { authService } from '../services/authService';
import type { PushNotification } from '../types';

// Conditionally import expo-device (not available in Expo Go)
let Device: any = null;
try {
  Device = require('expo-device');
} catch (e) {
  console.log('expo-device not available');
}

// Conditionally import expo-notifications (not available in Expo Go with certain configurations)
let Notifications: any = null;
let notificationsAvailable = false;
let notificationsInitialized = false;

// Defer initialization to avoid crash on import
const initNotifications = () => {
  if (notificationsInitialized) return notificationsAvailable;
  notificationsInitialized = true;

  try {
    Notifications = require('expo-notifications');
    // Don't call setNotificationHandler here - it will crash in Expo Go
    notificationsAvailable = true;
    console.log('Notifications module loaded');
  } catch (e) {
    console.log('Notifications not available:', e);
    notificationsAvailable = false;
  }
  return notificationsAvailable;
};

interface UseNotificationsResult {
  expoPushToken: string | null;
  notification: any | null;
  isLoading: boolean;
  error: string | null;
  registerForPushNotifications: () => Promise<string | null>;
  scheduleNotification: (notification: PushNotification, trigger?: any) => Promise<string | null>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsResult => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Try to initialize notifications
    const isAvailable = initNotifications();

    if (!isAvailable || !Notifications) {
      console.log('Notifications not available in this environment');
      return;
    }

    try {
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Listen for incoming notifications
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification: any) => {
          setNotification(notification);
        }
      );

      // Listen for notification interactions
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          const { notification } = response;
          // Handle notification tap here
          console.log('Notification tapped:', notification.request.content);
        }
      );

      // Load stored push token
      loadStoredToken();
    } catch (e) {
      console.log('Notifications setup failed (Expo Go):', e);
      notificationsAvailable = false;
    }

    return () => {
      if (notificationListener.current) {
        try {
          notificationListener.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (responseListener.current) {
        try {
          responseListener.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
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
    initNotifications();
    if (!notificationsAvailable || !Notifications) {
      setError('Notifications non disponibles dans Expo Go');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if physical device
      if (Device && !Device.isDevice) {
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
          lightColor: Colors.primary,
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
      trigger?: any
    ): Promise<string | null> => {
      initNotifications();
      if (!notificationsAvailable || !Notifications) {
        console.log('Notifications not available');
        return null;
      }

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
    initNotifications();
    if (!notificationsAvailable || !Notifications) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.log('Cancel notification failed:', e);
    }
  }, []);

  // Cancel all notifications
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    initNotifications();
    if (!notificationsAvailable || !Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.log('Cancel all notifications failed:', e);
    }
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
  initNotifications();
  if (!notificationsAvailable || !Notifications) {
    console.log('Notifications not available for booking reminder');
    return null;
  }

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
