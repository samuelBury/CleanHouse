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
import BackgroundSVG from '../components/BackgroundSVG';
import HeroCard from '../components/HeroCard';
import UpcomingBookingsCard from '../components/UpcomingBookingsCard';
import ServicesSection from '../components/ServicesSection';
import BookingModal, { BookingData } from '../components/BookingModal';
import PaymentModal from '../components/PaymentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import SearchingProfessional from '../components/SearchingProfessional';
import BookingDetailsModal from '../components/BookingDetailsModal';
import NotificationsModal, { Notification } from '../components/NotificationsModal';

import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { useNotifications } from '../hooks/useNotifications';
import { Colors } from '../config/theme';
import type { ServiceType, Booking } from '../types';

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { bookings, fetchBookings, createBooking, cancelBooking, clearCurrentBooking, hasPendingBooking } = useBooking();
  const { notification } = useNotifications();

  // UI State
  const [refreshing, setRefreshing] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  // Écouter les notifications pour rafraîchir les données
  useEffect(() => {
    if (notification) {
      const notifType = notification.request.content.data?.type;
      if (notifType === 'booking_confirmed' || notifType === 'professional_assigned' || notifType === 'booking_updated') {
        // Rafraîchir les réservations
        fetchBookings();
      }
    }
  }, [notification]);

  // Ajouter une notification
  const addNotification = (type: Notification['type'], title: string, message: string) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      date: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Marquer une notification comme lue
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Vérifier s'il y a des notifications non lues
  const hasUnreadNotifications = notifications.some(n => !n.read);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleBookingConfirm = (data: BookingData) => {
    // Stocker les données de réservation
    setBookingDate(data.date);
    setBookingTime(data.time);
    setBookingDuration(data.duration);
    setBookingAddress(data.address);
    setIsIndeterminate(data.isIndeterminate);

    setShowBookingModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentIntentId: string) => {
    setShowPaymentModal(false);

    if (selectedService) {
      try {
        await createBooking({
          service: selectedService,
          date: bookingDate,
          time: bookingTime,
          duration: bookingDuration,
          address: bookingAddress,
          paymentIntentId,
        });
        await fetchBookings();
        addNotification(
          'booking_created',
          'Réservation confirmée',
          `Votre prestation ${selectedService} du ${bookingDate} à ${bookingTime} a été réservée.`
        );
        setShowConfirmation(true);
      } catch (error) {
        // Erreur lors de la création
      }
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

  // Ouvrir les détails d'une réservation
  const handleBookingPress = (booking: Booking) => {
    setSelectedBooking(booking);
    setTimeout(() => setShowBookingDetails(true), 50);
  };

  // Annuler une réservation
  const handleCancelBooking = async (bookingId: string) => {
    const result = await cancelBooking(bookingId);
    if (result.success) {
      fetchBookings();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} translucent={false} />
      <BackgroundSVG />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header
          userName={user?.name || 'Utilisateur'}
          onProfilePress={() => {}}
          onNotificationPress={() => setShowNotifications(true)}
          hasUnreadNotifications={hasUnreadNotifications}
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
          <UpcomingBookingsCard
            bookings={bookings || []}
            onBookingPress={handleBookingPress}
          />
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
        payment={`${getServicePrice() * (bookingDuration || 1)}€`}
        isIndeterminate={isIndeterminate}
      />

      
      <BookingDetailsModal
        visible={showBookingDetails}
        booking={selectedBooking}
        onClose={() => {
          setShowBookingDetails(false);
          setSelectedBooking(null);
        }}
        onCancel={handleCancelBooking}
      />

      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
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
