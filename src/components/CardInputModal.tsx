import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {CardField, useStripe, CardFieldInput} from '@stripe/stripe-react-native';
import {Colors} from '../config/theme';

interface CardInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  amount: string;
  clientSecret: string;
  isIndeterminate?: boolean;
  saveCard?: boolean;
}

export default function CardInputModal({
  visible,
  onClose,
  onSuccess,
  onError,
  amount,
  clientSecret,
  isIndeterminate = false,
  saveCard = false,
}: CardInputModalProps) {
  const {confirmPayment} = useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async () => {
    if (!cardComplete) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs de la carte');
      return;
    }

    if (!clientSecret) {
      Alert.alert('Erreur', 'Erreur de configuration du paiement');
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const {error, paymentIntent} = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {},
        },
      });

      if (error) {
        console.log('Payment error:', error);
        const errorMessage = error.message || 'Le paiement a échoué';
        Alert.alert('Erreur de paiement', errorMessage);
        onError?.(errorMessage);
      } else if (paymentIntent) {
        console.log('Payment successful:', paymentIntent.id);
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.log('Payment exception:', err);
      const errorMessage = 'Une erreur est survenue lors du paiement';
      Alert.alert('Erreur', errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardChange = (cardDetails: CardFieldInput.Details) => {
    setCardComplete(cardDetails.complete);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              if (!isLoading) onClose();
            }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderIcon}>
                  <Text style={styles.modalIconText}>💳</Text>
                </View>
                <View style={styles.modalHeaderTitleContainer}>
                  <Text style={styles.modalHeaderTitle}>Carte bancaire</Text>
                  <Text style={styles.modalHeaderSubtitle}>
                    {isIndeterminate
                      ? `Pré-autorisation de ${amount}`
                      : `Montant: ${amount}`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Card Form */}
              <View style={styles.formContainer}>
                {/* Info pour durée indéterminée */}
                {isIndeterminate && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <Text style={styles.infoText}>
                      Une pré-autorisation sera effectuée. Le montant final sera
                      débité à la fin de la prestation.
                    </Text>
                  </View>
                )}

                {/* Stripe CardField */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Informations de carte</Text>
                  <CardField
                    postalCodeEnabled={false}
                    placeholders={{
                      number: '4242 4242 4242 4242',
                    }}
                    cardStyle={styles.cardFieldStyle}
                    style={styles.cardField}
                    onCardChange={handleCardChange}
                  />
                </View>

                {/* Sécurité */}
                <View style={styles.securityInfo}>
                  <Text style={styles.securityIcon}>🔒</Text>
                  <Text style={styles.securityText}>
                    Paiement sécurisé par Stripe
                  </Text>
                </View>

                {/* Bouton de confirmation */}
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (!cardComplete || isLoading) && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!cardComplete || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      {isIndeterminate ? 'Autoriser le paiement' : `Payer ${amount}`}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
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
  keyboardAvoid: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
  modalHeaderTitleContainer: {
    flex: 1,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  modalHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
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
  },
  formContainer: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#8b5a4a',
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  cardFieldStyle: {
    backgroundColor: Colors.background.secondary,
    textColor: Colors.text.primary,
    borderRadius: 12,
    fontSize: 16,
    placeholderColor: '#999',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  securityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  securityText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
