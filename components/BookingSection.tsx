import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

export default function BookingSection() {
  return (
    <View style={styles.container}>
      {/* Booking Card */}
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingTitle}>Ménage</Text>
          <TouchableOpacity style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Confirmer</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bookingDate}>17 MAI 20 H 00 - 21 H 00</Text>
      </View>

      {/* Employee Section */}
      <View style={styles.employeeSection}>
        <View style={styles.firstBookingCard}>
          <Text style={styles.firstBookingIcon}>📱</Text>
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
    backgroundColor: '#fff',
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
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#789C8D',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDate: {
    fontSize: 12,
    color: '#666',
  },
  employeeSection: {
    padding: 20,
    paddingTop: 0,
  },
  firstBookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  firstBookingIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  firstBookingContent: {
    flex: 1,
  },
  firstBookingTitle: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  firstBookingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  promoCodeBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  promoCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
    letterSpacing: 0.5,
  },
});
