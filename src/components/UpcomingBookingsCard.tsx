import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors} from '../config/theme';
import HeroCard from './HeroCard';
import type {Booking} from '../types';

interface UpcomingBookingsCardProps {
  bookings: Booking[];
  onBookingPress?: (booking: Booking) => void;
}

// Helper pour parser une date (ISO ou DD/MM/YYYY)
const parseBookingDate = (dateStr: string, timeStr?: string): Date => {
  // Si c'est une date ISO (contient T ou Z)
  if (dateStr.includes('T') || dateStr.includes('Z')) {
    const d = new Date(dateStr);
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      d.setHours(hours, minutes, 0, 0);
    }
    return d;
  }
  // Sinon c'est DD/MM/YYYY
  const [day, month, year] = dateStr.split('/').map(Number);
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

// Helper pour formater une date en DD/MM/YYYY
const formatDateDisplay = (dateStr: string): string => {
  // Si c'est une date ISO
  if (dateStr.includes('T') || dateStr.includes('Z')) {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  // Sinon retourner tel quel
  return dateStr;
};

export default function UpcomingBookingsCard({
  bookings,
  onBookingPress,
}: UpcomingBookingsCardProps) {
  // Filtrer les réservations à venir (pending, confirmed, in_progress)
  const upcomingBookings = bookings
    .filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status))
    .sort((a, b) => {
      // Trier par date puis par heure
      const dateA = parseBookingDate(a.date, a.time);
      const dateB = parseBookingDate(b.date, b.time);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3); // Max 3 réservations affichées

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return {label: 'En attente', color: '#f59e0b'};
      case 'confirmed':
        return {label: 'Confirmé', color: Colors.primaryLight};
      case 'in_progress':
        return {label: 'En cours', color: Colors.primary};
      default:
        return {label: status, color: '#6b7280'};
    }
  };

  if (upcomingBookings.length === 0) {
    return <HeroCard />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prestations à venir</Text>
        <Text style={styles.count}>{upcomingBookings.length}</Text>
      </View>

      {upcomingBookings.map((booking, index) => {
        const statusInfo = getStatusLabel(booking.status);
        return (
          <TouchableOpacity
            key={booking.id}
            style={[
              styles.bookingItem,
              index === upcomingBookings.length - 1 && styles.bookingItemLast,
            ]}
            onPress={() => onBookingPress?.(booking)}
            activeOpacity={0.7}>
            <View style={styles.bookingIcon}>
              <FontAwesome5 name={getServiceIcon(booking.service)} size={20} color={Colors.primary} solid />
            </View>

            <View style={styles.bookingContent}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingService}>{booking.service}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: statusInfo.color + '20'},
                  ]}>
                  <Text style={[styles.statusText, {color: statusInfo.color}]}>
                    {statusInfo.label}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                  <FontAwesome5 name="calendar-alt" size={12} color={Colors.text.secondary} style={styles.detailIcon} />
                  <Text style={styles.detailText}>
                    {formatDateDisplay(booking.date)} à {booking.time}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <FontAwesome5 name="map-marker-alt" size={12} color={Colors.text.secondary} style={styles.detailIcon} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {booking.address}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingFooter}>
                <Text style={styles.durationText}>
                  {booking.duration}h de prestation
                </Text>
                <Text style={styles.priceText}>{booking.price}€</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    marginBottom: 10,
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondaryDark,
    backgroundColor: Colors.secondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  count: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.inverse,
    overflow: 'hidden',
  },
  bookingItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  bookingItemLast: {
    borderBottomWidth: 0,
  },
  bookingIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookingContent: {
    flex: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingService: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.text.secondary,
    flex: 1,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
});
