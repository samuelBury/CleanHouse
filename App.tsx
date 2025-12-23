import React, {useState} from 'react';
import {ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import BackgroundSVG from './components/BackgroundSVG';
import Header from './components/Header';
import HeroCard from './components/HeroCard';
import ServicesSection from './components/ServicesSection';
import BookingSection from './components/BookingSection';
import BottomNav from './components/BottomNav';
import BookingModal from './components/BookingModal';
import PaymentModal from './components/PaymentModal';
import ConfirmationModal from './components/ConfirmationModal';

export default function App(): React.JSX.Element {
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);

  // Booking data
  const [bookingData, setBookingData] = useState({
    service: '',
    duration: 3,
    date: new Date().toLocaleDateString('fr-FR'),
    time: '15:46',
    payment: '',
  });

  const handleServicePress = (service: string) => {
    setBookingData({...bookingData, service});
    setBookingModalVisible(true);
  };

  const handleBookingConfirm = () => {
    setBookingModalVisible(false);
    setPaymentModalVisible(true);
  };

  const handlePaymentConfirm = (paymentMethod: string) => {
    setBookingData({...bookingData, payment: paymentMethod});
    setPaymentModalVisible(false);
    setConfirmationModalVisible(true);
  };

  const handleConfirmationClose = () => {
    setConfirmationModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.backgroundContainer}>
        <BackgroundSVG />
      </View>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Header />
        <HeroCard />
        <ServicesSection onServicePress={handleServicePress} />
        <BookingSection />
      </ScrollView>

      <BottomNav />
      <BookingModal
        visible={bookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
        onConfirm={handleBookingConfirm}
        service={bookingData.service}
      />
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onConfirm={handlePaymentConfirm}
      />
      <ConfirmationModal
        visible={confirmationModalVisible}
        onClose={handleConfirmationClose}
        service={bookingData.service}
        duration={bookingData.duration}
        date={bookingData.date}
        time={bookingData.time}
        payment={bookingData.payment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
});
