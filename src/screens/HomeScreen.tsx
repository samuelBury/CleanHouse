// Écran d'accueil principal
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../components/Header';
import HeroCard from '../components/HeroCard';
import ServicesSection from '../components/ServicesSection';
import BookingSection from '../components/BookingSection';
import BookingModal from '../components/BookingModal';
import PaymentModal from '../components/PaymentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import SearchingProfessional from '../components/SearchingProfessional';
import ProfileDrawer from '../components/ProfileDrawer';
import BackgroundSVG from '../components/BackgroundSVG';

import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { useNotifications } from '../hooks/useNotifications';
import { Colors } from '../config/theme';
import type { ServiceType } from '../types';

const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { bookings, fetchBookings, createBooking, currentBooking, setCurrentBooking, clearCurrentBooking, hasPendingBooking, getPendingBooking } = useBooking();
  const { notification } = useNotifications();

  // UI State
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Afficher la recherche si une réservation est en attente
  const showSearching = hasPendingBooking();

  // Booking state
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDuration, setBookingDuration] = useState(0);
  const [bookingAddress, setBookingAddress] = useState('');
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  // Écouter les notifications pour détecter quand un pro accepte
  useEffect(() => {
    if (notification) {
      const notifType = notification.request.content.data?.type;
      if (notifType === 'booking_confirmed' || notifType === 'professional_assigned') {
        // Rafraîchir les réservations → statut passera à 'confirmed'
        fetchBookings();
        // Afficher la confirmation
        setShowConfirmation(true);
      }
    }
  }, [notification]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleBookingConfirm = () => {
    setShowBookingModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentIntentId: string) => {
    setShowPaymentModal(false);

    // Paiement réussi ! Créer la réservation avec le paymentIntentId
    if (selectedService) {
      await createBooking({
        service: selectedService,
        date: bookingDate,
        time: bookingTime,
        duration: bookingDuration,
        address: bookingAddress,
        paymentIntentId, // Associer le paiement à la réservation
      });
      // SearchingProfessional s'affichera car hasPendingBooking() sera true
      // La confirmation s'affichera quand le pro acceptera (via notification)
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    resetBooking();
  };

  const resetBooking = () => {
    setSelectedService(null);
    setBookingDate('');
    setBookingTime('');
    setBookingDuration(0);
    setBookingAddress('');
    setIsIndeterminate(false);
    clearCurrentBooking();
  };

  // Get price for selected service
  const getServicePrice = () => {
    switch (selectedService) {
      case 'Ménage': return 15;
      case 'Repassage': return 10;
      case 'Ménage + Repassage': return 20;
      default: return 0;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} translucent={false} />
      <BackgroundSVG />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header
          userName={user?.name || 'Utilisateur'}
          onProfilePress={() => setShowProfileDrawer(true)}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <HeroCard />
          <ServicesSection onServiceSelect={handleServiceSelect} />
          <BookingSection reservations={bookings || []} />
          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onConfirm={handleBookingConfirm}
        service={selectedService || ''}
      />

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirm}
        service={selectedService || ''}
        date={bookingDate}
        time={bookingTime}
        duration={bookingDuration}
        isIndeterminate={isIndeterminate}
      />

      <SearchingProfessional visible={showSearching} />

      <ConfirmationModal
        visible={showConfirmation}
        onClose={handleConfirmationClose}
        service={selectedService || ''}
        date={bookingDate}
        time={bookingTime}
        duration={bookingDuration}
        price={getServicePrice() * bookingDuration}
      />

      <ProfileDrawer
        visible={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        user={user}
        onLogout={logout}
        stats={{
          totalReservations: (bookings || []).length,
          hoursBooked: (bookings || []).reduce((acc, b) => acc + b.duration, 0),
          totalSpent: (bookings || []).reduce((acc, b) => acc + b.price, 0),
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;
