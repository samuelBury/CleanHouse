// Écran Historique - wrapper du composant existant
import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import HistoryView from '../components/HistoryView';
import { useBooking } from '../context/BookingContext';
import { Colors } from '../config/theme';

const HistoryScreen: React.FC = () => {
  const { bookings, fetchBookings } = useBooking();

  useEffect(() => {
    fetchBookings();
  }, []);

  // Convert bookings to the format expected by the component
  const formattedReservations = bookings.map(booking => ({
    id: booking.id,
    service: booking.service,
    date: booking.date,
    time: booking.time,
    duration: booking.duration,
    address: booking.address,
    price: booking.price,
    status: booking.status as 'confirmed' | 'completed' | 'cancelled',
  }));

  return (
    <SafeAreaView style={styles.container}>
      <HistoryView reservations={formattedReservations} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
});

export default HistoryScreen;
