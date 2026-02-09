// Hook de notifications push pour CleanHouse Pro
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { API_URL } from '../config/constants';
import { useAuth } from '../context/AuthContext';

// Conditionally import expo-device
let Device: any = null;
try {
  Device = require('expo-device');
} catch (e) {
  console.log('[ProNotif] expo-device not available');
}

// Conditionally import expo-notifications
let Notifications: any = null;
let notificationsAvailable = false;
let notificationsInitialized = false;

const initNotifications = () => {
  if (notificationsInitialized) return notificationsAvailable;
  notificationsInitialized = true;

  try {
    Notifications = require('expo-notifications');
    notificationsAvailable = true;
    console.log('[ProNotif] Notifications module loaded');
  } catch (e) {
    console.log('[ProNotif] Notifications not available:', e);
    notificationsAvailable = false;
  }
  return notificationsAvailable;
};

const EXPO_PROJECT_ID = '24a9d45e-1abf-4a1b-8c59-ed1de82653dc';

interface UseNotificationsResult {
  expoPushToken: string | null;
  notification: any | null;
  isLoading: boolean;
  error: string | null;
  registerForPushNotifications: () => Promise<string | null>;
}

export const useNotifications = (): UseNotificationsResult => {
  const { token } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    const isAvailable = initNotifications();

    if (!isAvailable || !Notifications) {
      console.log('[ProNotif] Notifications not available in this environment');
      return;
    }

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notif: any) => {
          setNotification(notif);
          console.log('[ProNotif] Notification received:', notif.request.content.data?.type);
        }
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          const data = response.notification.request.content.data;
          console.log('[ProNotif] Notification tapped:', data?.type);
        }
      );
    } catch (e) {
      console.log('[ProNotif] Notifications setup failed:', e);
      notificationsAvailable = false;
    }

    return () => {
      if (notificationListener.current) {
        try { notificationListener.current.remove(); } catch (e) {}
      }
      if (responseListener.current) {
        try { responseListener.current.remove(); } catch (e) {}
      }
    };
  }, []);

  // Send push token to backend
  const sendTokenToBackend = async (pushToken: string) => {
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/pro/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pushToken }),
      });
      console.log('[ProNotif] Push token sent to backend');
    } catch (err) {
      console.error('[ProNotif] Failed to send push token to backend:', err);
    }
  };

  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    initNotifications();
    if (!notificationsAvailable || !Notifications) {
      setError('Notifications non disponibles');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (Device && !Device.isDevice) {
        setError('Les notifications push nécessitent un appareil physique');
        setIsLoading(false);
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError('Permission de notification refusée');
        setIsLoading(false);
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EXPO_PROJECT_ID,
      });

      const pushToken = tokenData.data;
      setExpoPushToken(pushToken);

      // Send to backend
      await sendTokenToBackend(pushToken);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('missions', {
          name: 'Missions',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4cb04f',
        });
      }

      setIsLoading(false);
      return pushToken;
    } catch (err) {
      console.error('[ProNotif] Registration error:', err);
      setError('Erreur lors de l\'enregistrement des notifications');
      setIsLoading(false);
      return null;
    }
  }, [token]);

  return {
    expoPushToken,
    notification,
    isLoading,
    error,
    registerForPushNotifications,
  };
};

export default useNotifications;
