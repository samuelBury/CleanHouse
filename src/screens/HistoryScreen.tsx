// Écran Historique - wrapper du composant existant
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import HistoryView from '../components/HistoryView';
import BookingDetailsModal from '../components/BookingDetailsModal';
import { useBooking } from '../context/BookingContext';
import { Colors } from '../config/theme';
import type { Booking } from '../types';

const HistoryScreen: React.FC = () => {
  const { bookings, fetchBookings, cancelBooking } = useBooking();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  // Convert bookings to the format expected by the component
  const formattedReservations = (bookings || []).map(booking => ({
    id: booking.id,
    service: booking.service,
    date: booking.date,
    time: booking.time,
    duration: booking.duration,
    address: booking.address,
    price: booking.price,
    status: booking.status as 'confirmed' | 'completed' | 'cancelled',
  }));

  const handleBookingPress = (reservation: any) => {
    // Trouver le booking complet
    const fullBooking = (bookings || []).find(b => b.id === reservation.id);
    if (fullBooking) {
      setSelectedBooking(fullBooking);
      setTimeout(() => setShowDetails(true), 50);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const result = await cancelBooking(bookingId);
    if (result.success) {
      fetchBookings();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <HistoryView
        reservations={formattedReservations}
        onBookingPress={handleBookingPress}
      />
      <BookingDetailsModal
        visible={showDetails}
        booking={selectedBooking}
        onClose={() => {
          setShowDetails(false);
          setSelectedBooking(null);
        }}
        onCancel={handleCancelBooking}
      />
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
