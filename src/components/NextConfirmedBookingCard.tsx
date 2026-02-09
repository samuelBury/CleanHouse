import React, {useRef, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated, Easing} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {Colors} from '../config/theme';
import type {Booking} from '../types';

interface NextConfirmedBookingCardProps {
  bookings: Booking[];
  onBookingPress?: (booking: Booking) => void;
}

// Helper pour parser une date (ISO ou DD/MM/YYYY)
const parseBookingDate = (dateStr: string, timeStr?: string): Date => {
  if (dateStr.includes('T') || dateStr.includes('Z')) {
    const d = new Date(dateStr);
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      d.setHours(hours, minutes, 0, 0);
    }
    return d;
  }
  const [day, month, year] = dateStr.split('/').map(Number);
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

// Helper pour formater une date en format lisible
const formatDateDisplay = (dateStr: string): string => {
  const date = dateStr.includes('T') || dateStr.includes('Z')
    ? new Date(dateStr)
    : (() => {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
      })();

  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
};

export default function NextConfirmedBookingCard({
  bookings,
  onBookingPress,
}: NextConfirmedBookingCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation de pulsation subtile
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  // Trouver la prochaine réservation (pending ou confirmed)
  const filteredBookings = bookings?.filter(b => b.status === 'pending' || b.status === 'confirmed') || [];

  const nextBooking = filteredBookings
    .sort((a, b) => {
      const dateA = parseBookingDate(a.date, a.time);
      const dateB = parseBookingDate(b.date, b.time);
      return dateA.getTime() - dateB.getTime();
    })[0];

  if (!nextBooking) {
    return null;
  }

  const isConfirmed = nextBooking.status === 'confirmed';

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'Ménage':
        return 'home';
      case 'Repassage':
        return 'tshirt';
      case 'Ménage + Repassage':
        return 'magic';
      default:
        return 'broom';
    }
  };

  return (
    <Animated.View style={[styles.container, {transform: [{scale: pulseAnim}]}]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onBookingPress?.(nextBooking)}
      >
        <LinearGradient
          colors={Colors.gradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.gradient}
        >
          {/* Badge "Prochaine prestation" */}
          <View style={styles.badge}>
            <FontAwesome5
              name={isConfirmed ? "check-circle" : "clock"}
              size={10}
              color={isConfirmed ? Colors.primary : '#f59e0b'}
              solid
            />
            <Text style={[styles.badgeText, !isConfirmed && {color: '#f59e0b'}]}>
              {isConfirmed ? 'Prochaine prestation confirmée' : 'Prestation en attente de confirmation'}
            </Text>
          </View>

          {/* Contenu principal */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name={getServiceIcon(nextBooking.service)} size={24} color={Colors.primary} solid />
            </View>

            <View style={styles.info}>
              <Text style={styles.serviceName}>{nextBooking.service}</Text>
              <View style={styles.dateRow}>
                <FontAwesome5 name="calendar-alt" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.dateText}>{formatDateDisplay(nextBooking.date)}</Text>
              </View>
              <View style={styles.timeRow}>
                <FontAwesome5 name="clock" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.timeText}>{nextBooking.time} - {nextBooking.duration}h</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceValue}>{nextBooking.price}€</Text>
              <View style={styles.arrowButton}>
                <FontAwesome5 name="chevron-right" size={12} color={Colors.primary} />
              </View>
            </View>
          </View>

          {/* Adresse */}
          <View style={styles.addressRow}>
            <FontAwesome5 name="map-marker-alt" size={11} color="rgba(255,255,255,0.7)" />
            <Text style={styles.addressText} numberOfLines={1}>{nextBooking.address}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  gradient: {
    borderRadius: 16,
    padding: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.inverse,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    color: Colors.text.inverse,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.inverse,
    marginBottom: 6,
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  addressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
  },
});
