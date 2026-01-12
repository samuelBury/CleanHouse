import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PlatformPay, usePlatformPay, PlatformPayButton} from '@stripe/stripe-react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import CardInputModal from './CardInputModal';
import {Colors} from '../config/theme';
import {paymentService} from '../services/paymentService';
import type {PaymentMethod} from '../types';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (paymentIntentId: string) => void;
  service: string;
  date: string;
  time: string;
  duration: number;
  isIndeterminate: boolean;
}

export default function PaymentModal({
  visible,
  onClose,
  onConfirm,
  service,
  date,
  time,
  duration,
  isIndeterminate,
}: PaymentModalProps) {
  const insets = useSafeAreaInsets();
  const {isPlatformPaySupported, confirmPlatformPayPayment} = usePlatformPay();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showCardInput, setShowCardInput] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [applePayAvailable, setApplePayAvailable] = useState(false);

  // Vérifier si Apple Pay est disponible
  useEffect(() => {
    const checkApplePay = async () => {
      if (Platform.OS === 'ios') {
        const isSupported = await isPlatformPaySupported();
        setApplePayAvailable(isSupported);
      }
    };
    checkApplePay();
  }, []);

  // Charger les cartes sauvegardées
  useEffect(() => {
    if (visible) {
      loadSavedCards();
    }
  }, [visible]);

  const loadSavedCards = async () => {
    setLoadingCards(true);
    const result = await paymentService.getPaymentMethods();
    if (result.success && result.data) {
      setSavedCards(result.data);
    }
    setLoadingCards(false);
  };

  // Paiement Apple Pay
  const handleApplePay = async () => {
    setIsLoading(true);

    try {
      // Créer le PaymentIntent côté serveur
      const intentResult = await paymentService.createPaymentIntent(getAmountInCents());

      if (!intentResult.success || !intentResult.data?.clientSecret) {
        Alert.alert('Erreur', intentResult.error || 'Impossible de créer le paiement');
        setIsLoading(false);
        return;
      }

      // Confirmer le paiement avec Apple Pay
      const {error, paymentIntent} = await confirmPlatformPayPayment(
        intentResult.data.clientSecret,
        {
          applePay: {
            cartItems: [
              {
                label: service,
                amount: String(getAmountInCents() / 100),
                paymentType: PlatformPay.PaymentType.Immediate,
              },
            ],
            merchantCountryCode: 'FR',
            currencyCode: 'EUR',
          },
        }
      );

      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Erreur', error.message || 'Le paiement a échoué');
        }
      } else if (paymentIntent) {
        // Paiement réussi - Appeler directement onConfirm pour créer la réservation
        onConfirm(paymentIntent.id);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors du paiement');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer le prix
  const getRate = () => {
    switch (service) {
      case 'Ménage':
        return 15;
      case 'Repassage':
        return 10;
      case 'Ménage + Repassage':
        return 20;
      default:
        return 15;
    }
  };

  const getPrice = () => {
    const rate = getRate();
    if (isIndeterminate) {
      return `${rate}€/h`;
    }
    const hours = duration > 0 ? duration : 1;
    return `${rate * hours}€`;
  };

  const getAmountInCents = () => {
    const rate = getRate();
    // Pour durée indéterminée, pré-autoriser 3h
    // Si duration est 0 mais pas indéterminée, utiliser 1h minimum
    const hours = isIndeterminate ? 3 : (duration > 0 ? duration : 1);
    return rate * hours * 100; // Stripe utilise les centimes
  };

  const handlePaymentSelect = async () => {
    if (!selectedPayment) return;

    // Si c'est une nouvelle carte, ne rien faire ici (géré par handleNewCardPress)
    if (selectedPayment === 'new_card') {
      return;
    }

    // Sinon, payer avec la carte sauvegardée
    const savedCard = savedCards.find(c => c.id === selectedPayment);
    if (!savedCard) return;

    setIsLoading(true);

    try {
      console.log('Paying with saved card:', savedCard.stripeId);
      const result = await paymentService.payWithSavedCard(
        savedCard.stripeId,
        getAmountInCents()
      );

      if (result.success && result.data?.paymentIntentId) {
        console.log('Payment successful:', result.data.paymentIntentId);
        // Appeler directement onConfirm pour créer la réservation
        onConfirm(result.data.paymentIntentId);
      } else {
        Alert.alert('Erreur', result.error || 'Le paiement a échoué');
      }
    } catch (error) {
      console.log('Payment error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du paiement');
    } finally {
      setIsLoading(false);
    }
  };

  // Nouvelle carte - ouvre directement le formulaire
  const handleNewCardPress = async () => {
    console.log('=== handleNewCardPress called ===');
    console.log('Amount in cents:', getAmountInCents());

    if (isLoading) {
      console.log('Already loading, skipping...');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Creating PaymentIntent...');
      const result = await paymentService.createPaymentIntent(getAmountInCents());
      console.log('PaymentIntent result:', result);

      if (result.success && result.data?.clientSecret) {
        console.log('PaymentIntent created successfully');
        setClientSecret(result.data.clientSecret);
        setShowCardInput(true);
      } else {
        console.log('PaymentIntent failed:', result.error);
        Alert.alert('Erreur', result.error || 'Impossible de créer le paiement');
      }
    } catch (error) {
      console.log('PaymentIntent error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardSuccess = async (paymentIntentId: string, shouldSaveCard: boolean) => {
    console.log('=== handleCardSuccess ===');
    console.log('paymentIntentId:', paymentIntentId);
    console.log('shouldSaveCard:', shouldSaveCard);

    setShowCardInput(false);
    setClientSecret('');

    // Sauvegarder la carte si demandé (en arrière-plan)
    if (shouldSaveCard) {
      paymentService.saveCardFromPayment(paymentIntentId)
        .then(result => {
          if (result.success) {
            console.log('Card saved successfully:', result.data);
          } else {
            console.log('Failed to save card:', result.error);
          }
        })
        .catch(error => console.log('Error saving card:', error));
    }

    // Appeler directement onConfirm pour créer la réservation
    console.log('=== Calling onConfirm with paymentIntentId ===');
    onConfirm(paymentIntentId);
  };

  const handleCardError = (error: string) => {
    console.log('Payment error:', error);
  };

  const handleClose = () => {
    setSelectedPayment(null);
    setClientSecret('');
    onClose();
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible && !showCardInput}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
          />
          <View style={[styles.modalContent, {paddingBottom: insets.bottom + 20}]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <FontAwesome5 name="credit-card" size={18} color={Colors.text.inverse} solid />
              </View>
              <Text style={styles.modalHeaderTitle}>Moyen de paiement</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={handleClose}>
                <FontAwesome5 name="times" size={16} color={Colors.text.inverse} />
              </TouchableOpacity>
            </View>

            {/* Payment Methods - Scrollable */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Récapitulatif de la commande */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Récapitulatif</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service</Text>
                  <Text style={styles.summaryValue}>{service}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryValue}>{date}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Heure</Text>
                  <Text style={styles.summaryValue}>{time}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Durée</Text>
                  <Text style={styles.summaryValue}>
                    {isIndeterminate ? 'Indéterminée' : `${duration > 0 ? duration : 1}h`}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Prix</Text>
                  <Text style={styles.summaryPrice}>{getPrice()}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Choisissez votre méthode de paiement</Text>

              {/* Apple Pay */}
              {applePayAvailable && (
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    styles.applePayOption,
                    selectedPayment === 'apple_pay' && styles.paymentOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedPayment('apple_pay');
                    handleApplePay();
                  }}
                  disabled={isLoading}
                >
                  <View style={styles.applePayIconContainer}>
                    <Text style={styles.applePayIcon}></Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.applePayText}>Apple Pay</Text>
                    <Text style={styles.applePaySubtext}>Paiement rapide et sécurisé</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Cartes sauvegardées */}
              {loadingCards ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : (
                <>
                  {savedCards.map((card) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[
                        styles.paymentOption,
                        selectedPayment === card.id && styles.paymentOptionSelected,
                      ]}
                      onPress={() => setSelectedPayment(card.id)}
                    >
                      <View style={styles.paymentIconContainer}>
                        <FontAwesome5 name="credit-card" size={18} color={Colors.primary} solid />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.paymentName}>
                          {card.brand} •••• {card.last4}
                        </Text>
                        <Text style={styles.cardExpiry}>
                          Expire {card.expMonth}/{card.expYear}
                        </Text>
                      </View>
                      {card.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Par défaut</Text>
                        </View>
                      )}
                      <View style={styles.radioButton}>
                        {selectedPayment === card.id && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Option nouvelle carte */}
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPayment === 'new_card' && styles.paymentOptionSelected,
                ]}
                onPress={() => {
                  console.log('=== Nouvelle carte pressed ===');
                  setSelectedPayment('new_card');
                  // Ouvrir directement le formulaire de carte
                  handleNewCardPress();
                }}
                disabled={isLoading}
              >
                <View style={styles.paymentIconContainer}>
                  <FontAwesome5 name="plus" size={18} color={Colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.paymentName}>Nouvelle carte</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Confirm Button - Fixed at bottom */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.confirmButtonContainer}
                disabled={!selectedPayment || isLoading || selectedPayment === 'new_card'}
                onPress={handlePaymentSelect}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={[
                    styles.confirmButton,
                    (!selectedPayment || isLoading || selectedPayment === 'new_card') && styles.confirmButtonDisabled,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Continuer</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Card Input Modal */}
      <CardInputModal
        visible={showCardInput}
        onClose={() => {
          setShowCardInput(false);
          setClientSecret('');
        }}
        onSuccess={handleCardSuccess}
        onError={handleCardError}
        amount={getPrice()}
        clientSecret={clientSecret}
        isIndeterminate={isIndeterminate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 10,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: Colors.secondary,
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalIconText: {
    fontSize: 20,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.inverse,
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: Colors.text.inverse,
    fontWeight: '400',
  },
  summaryContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'Colors.primaryBackground',
  },
  applePayOption: {
    backgroundColor: '#000',
  },
  applePayIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  applePayIcon: {
    fontSize: 24,
    color: '#000',
  },
  applePayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  applePaySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentIcon: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  cardExpiry: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  confirmButtonContainer: {
    marginTop: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: 'Colors.primary',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButton: {
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
