import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
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
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showCardInput, setShowCardInput] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);

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
    return `${rate * duration}€`;
  };

  const getAmountInCents = () => {
    const rate = getRate();
    // Pour durée indéterminée, pré-autoriser 3h
    const hours = isIndeterminate ? 3 : duration;
    return rate * hours * 100; // Stripe utilise les centimes
  };

  const handlePaymentSelect = async () => {
    if (!selectedPayment) return;

    setIsLoading(true);

    try {
      // Créer un PaymentIntent via le backend
      const result = await paymentService.createPaymentIntent(getAmountInCents());

      if (result.success && result.data?.clientSecret) {
        setClientSecret(result.data.clientSecret);
        setShowCardInput(true);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de créer le paiement');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardSuccess = (paymentIntentId: string) => {
    setShowCardInput(false);
    setClientSecret('');
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
        visible={visible}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
          />
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <Text style={styles.modalIconText}>💳</Text>
              </View>
              <Text style={styles.modalHeaderTitle}>Moyen de paiement</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={handleClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Payment Methods */}
            <View style={styles.paymentContainer}>
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
                    {isIndeterminate ? 'Indéterminée' : `${duration}h`}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Prix</Text>
                  <Text style={styles.summaryPrice}>{getPrice()}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Choisissez votre méthode de paiement</Text>

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
                        <Text style={styles.paymentIcon}>💳</Text>
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
                onPress={() => setSelectedPayment('new_card')}
              >
                <View style={styles.paymentIconContainer}>
                  <Text style={styles.paymentIcon}>➕</Text>
                </View>
                <Text style={styles.paymentName}>Nouvelle carte</Text>
                <View style={styles.radioButton}>
                  {selectedPayment === 'new_card' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!selectedPayment || isLoading) && styles.confirmButtonDisabled,
                ]}
                disabled={!selectedPayment || isLoading}
                onPress={handlePaymentSelect}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Continuer</Text>
                )}
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
    paddingBottom: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: Colors.primary,
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
  paymentContainer: {
    padding: 20,
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
    color: Colors.text.primary,
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
    color: Colors.text.primary,
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
    backgroundColor: '#e8f5e9',
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
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.border.medium,
  },
  confirmButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
