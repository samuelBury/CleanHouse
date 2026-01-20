// Hook pour le suivi de localisation en temps réel
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, Linking, Platform } from 'react-native';
import { API_URL } from '../config/constants';
import { useAuth } from '../context/AuthContext';

const LOCATION_TASK_NAME = 'background-location-task';
const LOCATION_UPDATE_INTERVAL = 30000; // 30 secondes

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface UseLocationTrackingReturn {
  isTracking: boolean;
  currentLocation: LocationData | null;
  startTracking: (missionId?: string) => Promise<boolean>;
  stopTracking: () => Promise<void>;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  openSettings: () => void;
}

// Variable globale pour stocker le missionId actuel
let currentMissionId: string | null = null;
let authToken: string | null = null;

// Définir la tâche de background
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[Location] Background task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];

    if (location && authToken) {
      try {
        await fetch(`${API_URL}/api/pro/location/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            missionId: currentMissionId,
          }),
        });
        console.log('[Location] Background update sent');
      } catch (err) {
        console.error('[Location] Background update error:', err);
      }
    }
  }
});

export const useLocationTracking = (): UseLocationTrackingReturn => {
  const { token } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const foregroundSubscription = useRef<Location.LocationSubscription | null>(null);

  // Stocker le token dans la variable globale pour le background task
  useEffect(() => {
    authToken = token;
  }, [token]);

  // Vérifier les permissions au montage
  useEffect(() => {
    checkPermissions();
    return () => {
      stopTracking();
    };
  }, []);

  // Vérifier les permissions
  const checkPermissions = async (): Promise<boolean> => {
    const { status: foreground } = await Location.getForegroundPermissionsAsync();
    const { status: background } = await Location.getBackgroundPermissionsAsync();

    const hasAllPermissions = foreground === 'granted' && background === 'granted';
    setHasPermission(hasAllPermissions);
    return hasAllPermissions;
  };

  // Demander les permissions
  const requestPermission = async (): Promise<boolean> => {
    try {
      // Demander la permission foreground d'abord
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'L\'accès à votre position est nécessaire pour le suivi des missions. Veuillez activer la permission dans les réglages.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Réglages', onPress: openSettings },
          ]
        );
        return false;
      }

      // Demander la permission background
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Permission limitée',
          'Pour un suivi optimal pendant vos missions, autorisez la localisation "Toujours" dans les réglages.',
          [
            { text: 'Continuer sans', style: 'cancel' },
            { text: 'Réglages', onPress: openSettings },
          ]
        );
        // On peut quand même continuer avec le foreground
      }

      const hasAll = foregroundStatus === 'granted' && backgroundStatus === 'granted';
      setHasPermission(hasAll);
      return foregroundStatus === 'granted';
    } catch (error) {
      console.error('[Location] Permission error:', error);
      return false;
    }
  };

  // Ouvrir les réglages
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // Envoyer la position au serveur
  const sendLocationUpdate = async (location: LocationData, missionId?: string) => {
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/pro/location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          missionId,
        }),
      });
    } catch (error) {
      console.error('[Location] Update error:', error);
    }
  };

  // Démarrer le tracking
  const startTracking = useCallback(async (missionId?: string): Promise<boolean> => {
    // Vérifier les permissions
    const hasPermissions = await checkPermissions();
    if (!hasPermissions) {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      // Stocker le missionId pour le background task
      currentMissionId = missionId || null;

      // Activer le partage côté serveur
      await fetch(`${API_URL}/api/pro/location/start-sharing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ missionId }),
      });

      // Obtenir la position initiale
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        timestamp: initialLocation.timestamp,
      };

      setCurrentLocation(locationData);
      await sendLocationUpdate(locationData, missionId);

      // Démarrer le foreground tracking
      foregroundSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_UPDATE_INTERVAL,
          distanceInterval: 50, // 50 mètres
        },
        (location) => {
          const newLocation: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
          };
          setCurrentLocation(newLocation);
          sendLocationUpdate(newLocation, missionId);
        }
      );

      // Démarrer le background tracking si possible
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      if (backgroundStatus === 'granted') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_UPDATE_INTERVAL,
          distanceInterval: 50,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'CleanHouse Pro',
            notificationBody: 'Suivi de position actif pour votre mission',
            notificationColor: '#4cb04f',
          },
        });
      }

      setIsTracking(true);
      return true;
    } catch (error) {
      console.error('[Location] Start tracking error:', error);
      Alert.alert('Erreur', 'Impossible de démarrer le suivi de position');
      return false;
    }
  }, [token]);

  // Arrêter le tracking
  const stopTracking = useCallback(async () => {
    try {
      // Arrêter le foreground subscription
      if (foregroundSubscription.current) {
        foregroundSubscription.current.remove();
        foregroundSubscription.current = null;
      }

      // Arrêter le background task
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      // Désactiver le partage côté serveur
      if (token) {
        await fetch(`${API_URL}/api/pro/location/stop-sharing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      currentMissionId = null;
      setIsTracking(false);
    } catch (error) {
      console.error('[Location] Stop tracking error:', error);
    }
  }, [token]);

  return {
    isTracking,
    currentLocation,
    startTracking,
    stopTracking,
    hasPermission,
    requestPermission,
    openSettings,
  };
};

export default useLocationTracking;
