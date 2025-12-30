// Hook de géolocalisation pour CleanHouse
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import type { Location as LocationType } from '../types';

interface UseLocationResult {
  location: LocationType | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationType | null>;
  getAddressFromCoords: (latitude: number, longitude: number) => Promise<string | null>;
}

export const useLocation = (): UseLocationResult => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request location permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        return false;
      }
      return true;
    } catch (err) {
      setError('Erreur lors de la demande de permission');
      return false;
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async (): Promise<LocationType | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationType = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      // Get address from coordinates
      const addressResult = await getAddressFromCoords(
        locationData.latitude,
        locationData.longitude
      );

      if (addressResult) {
        locationData.address = addressResult;
        setAddress(addressResult);
      }

      setLocation(locationData);
      setIsLoading(false);
      return locationData;
    } catch (err) {
      setError('Impossible de récupérer la localisation');
      setIsLoading(false);
      return null;
    }
  }, [requestPermission]);

  // Get address from coordinates (reverse geocoding)
  const getAddressFromCoords = useCallback(
    async (latitude: number, longitude: number): Promise<string | null> => {
      try {
        const [result] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (result) {
          const parts = [
            result.streetNumber,
            result.street,
            result.postalCode,
            result.city,
          ].filter(Boolean);

          return parts.join(' ');
        }
        return null;
      } catch (err) {
        console.error('Reverse geocoding error:', err);
        return null;
      }
    },
    []
  );

  return {
    location,
    address,
    isLoading,
    error,
    requestPermission,
    getCurrentLocation,
    getAddressFromCoords,
  };
};

export default useLocation;
