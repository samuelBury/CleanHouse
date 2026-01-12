import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors} from '../config/theme';
import type {Booking} from '../types';

interface BookingSectionProps {
  reservations: Booking[];
  onBookingPress?: (booking: Booking) => void;
}

export default function BookingSection({reservations = [], onBookingPress}: BookingSectionProps) {
  const formatDate = (date: string, time: string, duration: number) => {
    const d = new Date(date);
    const day = d.getDate();
    const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
    const month = months[d.getMonth()];
    const [hours, minutes] = time.split(':');
    const endHour = parseInt(hours) + duration;
    return `${day} ${month} ${hours} H ${minutes} - ${endHour} H 00`;
  };

  return (
    <View style={styles.container}>
      {/* Booking Cards */}
      {reservations.length > 0 ? (
        reservations.slice(0, 2).map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingTitle}>{booking.service}</Text>
              <TouchableOpacity style={styles.confirmButton} onPress={() => onBookingPress?.(booking)}>
                <Text style={styles.confirmButtonText}>Voir</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.bookingDate}>
              {formatDate(booking.date, booking.time, booking.duration)}
            </Text>
          </View>
        ))
      ) : null}

      {/* Promo Section */}
      <View style={styles.employeeSection}>
        <View style={styles.firstBookingCard}>
          <FontAwesome5 name="mobile-alt" size={28} color={Colors.secondary} style={styles.firstBookingIcon} />
          <View style={styles.firstBookingContent}>
            <Text style={styles.firstBookingTitle}>Première réservation ?</Text>
            <Text style={styles.firstBookingSubtitle}>
              -20% sur votre commande
            </Text>
          </View>
          <View style={styles.promoCodeBadge}>
            <Text style={styles.promoCodeText}>CLEAN20</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
  },
  bookingCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  confirmButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confirmButtonText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDate: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  employeeSection: {
    padding: 20,
    paddingTop: 0,
  },
  firstBookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondaryPastel,
  },
  firstBookingIcon: {
    marginRight: 12,
  },
  firstBookingContent: {
    flex: 1,
  },
  firstBookingTitle: {
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  firstBookingSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  promoCodeBadge: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondaryPastel,
  },
  promoCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
});
