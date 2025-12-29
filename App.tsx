import React, {useState} from 'react';
import {ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
// import {StripeProvider} from '@stripe/stripe-react-native';
// import {STRIPE_PUBLISHABLE_KEY} from './config/stripe';
import BackgroundSVG from './components/BackgroundSVG';
import Header from './components/Header';
import HeroCard from './components/HeroCard';
import ServicesSection from './components/ServicesSection';
import BookingSection from './components/BookingSection';
import BottomNav from './components/BottomNav';
import BookingModal from './components/BookingModal';
import PaymentModal from './components/PaymentModal';
import ConfirmationModal from './components/ConfirmationModal';
import SearchingProfessional from './components/SearchingProfessional';
import SplashScreen from './components/SplashScreen';
import ProfileDrawer from './components/ProfileDrawer';
import AgendaScreen, {Reservation} from './components/AgendaScreen';
import WalletScreen, {Transaction, PaymentMethod} from './components/WalletScreen';
import HistoryScreen from './components/HistoryScreen';

// Données de démonstration pour l'agenda
const initialReservations: Reservation[] = [
  {
    id: '1',
    service: 'Ménage',
    date: '17/05/2025',
    time: '14:00',
    duration: 3,
    address: '123 Rue de Paris, 75001 Paris',
    price: 45,
    status: 'confirmed',
  },
  {
    id: '2',
    service: 'Repassage',
    date: '10/01/2025',
    time: '10:00',
    duration: 2,
    address: '45 Avenue des Champs, 75008 Paris',
    price: 20,
    status: 'completed',
  },
];

// Données de démonstration pour le portefeuille
const initialTransactions: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    description: 'Rechargement du portefeuille',
    amount: 100,
    date: '05/01/2025',
  },
  {
    id: '2',
    type: 'expense',
    description: 'Ménage - 3h',
    amount: 45,
    date: '10/01/2025',
    service: 'Ménage',
  },
  {
    id: '3',
    type: 'expense',
    description: 'Repassage - 2h',
    amount: 20,
    date: '10/01/2025',
    service: 'Repassage',
  },
];

const initialPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    name: 'Visa',
    lastDigits: '4242',
    isDefault: true,
  },
];

export default function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState<'home' | 'agenda' | 'wallet' | 'history'>('home');
  const [profileVisible, setProfileVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(35); // 100 - 45 - 20 = 35€
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);

  // Booking data
  const [bookingData, setBookingData] = useState({
    service: '',
    duration: 3,
    date: new Date().toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'}),
    time: '15:00',
    address: '123 Rue de Paris, 75001 Paris',
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
    setIsSearching(true);
  };

  const handleConfirmationClose = () => {
    setConfirmationModalVisible(false);
    setIsSearching(false);

    // Ajouter la nouvelle réservation à l'agenda
    const rate = bookingData.service === 'Ménage' ? 15 : bookingData.service === 'Repassage' ? 10 : 20;
    const newReservation: Reservation = {
      id: Date.now().toString(),
      service: bookingData.service,
      date: bookingData.date,
      time: bookingData.time,
      duration: bookingData.duration,
      address: bookingData.address,
      price: rate * bookingData.duration,
      status: 'confirmed',
    };
    setReservations([...reservations, newReservation]);

    // Ajouter la transaction au portefeuille
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'expense',
      description: `${bookingData.service} - ${bookingData.duration}h`,
      amount: rate * bookingData.duration,
      date: bookingData.date,
      service: bookingData.service,
    };
    setTransactions([...transactions, newTransaction]);
    setWalletBalance(walletBalance - (rate * bookingData.duration));
  };

  // Wallet handlers
  const handleAddMoney = (amount: number) => {
    setWalletBalance(walletBalance + amount);
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      description: 'Rechargement du portefeuille',
      amount: amount,
      date: new Date().toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'}),
    };
    setTransactions([...transactions, newTransaction]);
  };

  const handleAddPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethods([...paymentMethods, method]);
  };

  // Afficher le splash screen pendant le chargement
  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.backgroundContainer}>
        <BackgroundSVG />
      </View>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {activeScreen === 'home' && (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Header />
          <HeroCard />
          {isSearching && <SearchingProfessional />}
          <ServicesSection onServicePress={handleServicePress} />
          <BookingSection />
        </ScrollView>
      )}
      {activeScreen === 'agenda' && (
        <AgendaScreen reservations={reservations} />
      )}
      {activeScreen === 'wallet' && (
        <WalletScreen
          balance={walletBalance}
          transactions={transactions}
          paymentMethods={paymentMethods}
          onAddMoney={handleAddMoney}
          onAddPaymentMethod={handleAddPaymentMethod}
        />
      )}
      {activeScreen === 'history' && (
        <HistoryScreen reservations={reservations} />
      )}

      <BottomNav
        activeTab={activeScreen}
        onHomePress={() => setActiveScreen('home')}
        onAgendaPress={() => setActiveScreen('agenda')}
        onProfilePress={() => setProfileVisible(true)}
      />
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
        service={bookingData.service}
        date={bookingData.date}
        time={bookingData.time}
        duration={bookingData.duration}
        isIndeterminate={false}
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
      <ProfileDrawer
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        onWalletPress={() => setActiveScreen('wallet')}
        onHistoryPress={() => setActiveScreen('history')}
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
