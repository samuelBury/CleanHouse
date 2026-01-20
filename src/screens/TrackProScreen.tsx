// Ecran de suivi du professionnel en temps réel pour le client
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_URL } from '../config/constants';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface RouteParams {
  missionId: string;
}

interface ProLocation {
  latitude: number;
  longitude: number;
  updatedAt: string;
}

interface Destination {
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface Professional {
  id: string;
  firstName: string;
  avatar: string | null;
}

const TrackProScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { missionId } = (route.params as RouteParams) || {};

  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [proLocation, setProLocation] = useState<ProLocation | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Charger les données
  const loadLocationData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/bookings/missions/${missionId}/pro-location`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur de chargement');
      }

      setProfessional(data.data.professional);
      setProLocation(data.data.location);
      setDestination(data.data.destination);
      setMessage(data.data.message || null);

      // Ajuster la vue de la carte
      if (data.data.location && data.data.destination?.latitude) {
        fitMapToMarkers(data.data.location, {
          latitude: data.data.destination.latitude,
          longitude: data.data.destination.longitude,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ajuster la carte pour afficher les deux points
  const fitMapToMarkers = (
    proLoc: ProLocation,
    dest: { latitude: number; longitude: number }
  ) => {
    if (!mapRef.current) return;

    mapRef.current.fitToCoordinates(
      [
        { latitude: proLoc.latitude, longitude: proLoc.longitude },
        { latitude: dest.latitude, longitude: dest.longitude },
      ],
      {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      }
    );
  };

  // Charger et rafraîchir les données
  useEffect(() => {
    loadLocationData();

    // Rafraîchir toutes les 15 secondes
    const interval = setInterval(loadLocationData, 15000);
    return () => clearInterval(interval);
  }, [missionId, token]);

  // Formater le temps écoulé
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'À l\'instant';
    if (diffMin === 1) return 'Il y a 1 minute';
    if (diffMin < 60) return `Il y a ${diffMin} minutes`;
    return 'Il y a plus d\'une heure';
  };

  // Ouvrir l'app de navigation
  const openNavigation = () => {
    if (!destination?.latitude || !destination?.longitude) return;

    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const url = Platform.select({
      ios: `maps:?daddr=${destination.latitude},${destination.longitude}`,
      android: `google.navigation:q=${destination.latitude},${destination.longitude}`,
    });

    Linking.openURL(url || '');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4cb04f" />
        <Text style={styles.loadingText}>Chargement de la position...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erreur</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadLocationData}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: destination?.latitude || 48.8566,
          longitude: destination?.longitude || 2.3522,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Marqueur du professionnel */}
        {proLocation && (
          <Marker
            coordinate={{
              latitude: proLocation.latitude,
              longitude: proLocation.longitude,
            }}
            title={professional?.firstName || 'Professionnel'}
          >
            <View style={styles.proMarker}>
              {professional?.avatar ? (
                <Image
                  source={{ uri: professional.avatar }}
                  style={styles.proMarkerImage}
                />
              ) : (
                <View style={styles.proMarkerPlaceholder}>
                  <Text style={styles.proMarkerInitial}>
                    {professional?.firstName?.charAt(0) || 'P'}
                  </Text>
                </View>
              )}
              <View style={styles.proMarkerPulse} />
            </View>
          </Marker>
        )}

        {/* Marqueur de la destination */}
        {destination?.latitude && destination?.longitude && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Votre adresse"
          >
            <View style={styles.destinationMarker}>
              <View style={styles.destinationMarkerInner}>
                <Text style={styles.destinationMarkerIcon}>🏠</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Ligne entre les deux points */}
        {proLocation && destination?.latitude && destination?.longitude && (
          <Polyline
            coordinates={[
              { latitude: proLocation.latitude, longitude: proLocation.longitude },
              { latitude: destination.latitude, longitude: destination.longitude },
            ]}
            strokeColor="#4cb04f"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suivi en direct</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Info panel */}
      <View style={styles.infoPanel}>
        {/* Message si pas de position */}
        {message && !proLocation && (
          <View style={styles.messageCard}>
            <Text style={styles.messageIcon}>📍</Text>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}

        {/* Info professionnel */}
        <View style={styles.proCard}>
          <View style={styles.proInfo}>
            {professional?.avatar ? (
              <Image
                source={{ uri: professional.avatar }}
                style={styles.proAvatar}
              />
            ) : (
              <View style={styles.proAvatarPlaceholder}>
                <Text style={styles.proAvatarInitial}>
                  {professional?.firstName?.charAt(0) || 'P'}
                </Text>
              </View>
            )}
            <View style={styles.proDetails}>
              <Text style={styles.proName}>{professional?.firstName}</Text>
              {proLocation ? (
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>En route vers vous</Text>
                </View>
              ) : (
                <Text style={styles.statusTextInactive}>En attente de partage</Text>
              )}
            </View>
          </View>

          {proLocation && (
            <Text style={styles.lastUpdate}>
              Mis à jour {formatTimeAgo(proLocation.updatedAt)}
            </Text>
          )}
        </View>

        {/* Adresse de destination */}
        {destination && (
          <TouchableOpacity style={styles.addressCard} onPress={openNavigation}>
            <View style={styles.addressIcon}>
              <Text>🏠</Text>
            </View>
            <View style={styles.addressDetails}>
              <Text style={styles.addressLabel}>Votre adresse</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {destination.address}
              </Text>
            </View>
            <Text style={styles.addressArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4cb04f',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  messageIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
  },
  proCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  proInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  proAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4cb04f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proAvatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  proDetails: {
    marginLeft: 16,
    flex: 1,
  },
  proName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4cb04f',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#4cb04f',
    fontWeight: '500',
  },
  statusTextInactive: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'right',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressDetails: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  addressArrow: {
    fontSize: 24,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  proMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  proMarkerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#4cb04f',
  },
  proMarkerPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4cb04f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  proMarkerInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  proMarkerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(76, 176, 79, 0.3)',
    zIndex: -1,
  },
  destinationMarker: {
    alignItems: 'center',
  },
  destinationMarkerInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  destinationMarkerIcon: {
    fontSize: 18,
  },
});

export default TrackProScreen;
