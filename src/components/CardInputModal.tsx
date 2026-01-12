import React, {useState, useEffect} from 'react';
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
  Switch,
  TextInput,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CardField, useStripe, CardFieldInput} from '@stripe/stripe-react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors} from '../config/theme';

interface CardInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (paymentIntentId: string, shouldSaveCard: boolean) => void;
  onError?: (error: string) => void;
  amount: string;
  clientSecret: string;
  isIndeterminate?: boolean;
}

export default function CardInputModal({
  visible,
  onClose,
  onSuccess,
  onError,
  amount,
  clientSecret,
  isIndeterminate = false,
}: CardInputModalProps) {
  const {confirmPayment} = useStripe();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [shouldSaveCard, setShouldSaveCard] = useState(false);
  const [cardholderName, setCardholderName] = useState('');

  // Réinitialiser le formulaire quand la modal s'ouvre
  useEffect(() => {
    if (visible) {
      setCardholderName('');
      setCardComplete(false);
      setShouldSaveCard(false);
    }
  }, [visible]);

  console.log('=== CardInputModal render ===');
  console.log('visible:', visible);
  console.log('clientSecret:', clientSecret ? 'present' : 'missing');

  const handleSubmit = async () => {
    if (!cardholderName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du titulaire');
      return;
    }

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
          billingDetails: {
            name: cardholderName.trim(),
          },
        },
      });

      if (error) {
        console.log('Payment error:', error);
        const errorMessage = error.message || 'Le paiement a échoué';
        Alert.alert('Erreur de paiement', errorMessage);
        onError?.(errorMessage);
      } else if (paymentIntent) {
        console.log('Payment successful:', paymentIntent.id);
        onSuccess(paymentIntent.id, shouldSaveCard);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
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
            <View style={[styles.modalContent, {paddingBottom: insets.bottom + 20}]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderIcon}>
                  <FontAwesome5 name="credit-card" size={20} color="#fff" />
                </View>
                <View style={styles.modalHeaderTitleContainer}>
                  <Text style={styles.modalHeaderTitle}>Carte bancaire</Text>
                  <Text style={styles.modalHeaderSubtitle}>Montant: {amount}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <FontAwesome5 name="times" size={18} color={Colors.text.inverse} />
                </TouchableOpacity>
              </View>

              {/* Card Form */}
              <View style={styles.formContainer}>
                {/* Nom du titulaire */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Nom du titulaire</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Jean Dupont"
                    placeholderTextColor="#999"
                    value={cardholderName}
                    onChangeText={setCardholderName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

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

                {/* Option enregistrer la carte */}
                <View style={styles.saveCardContainer}>
                  <View style={styles.saveCardTextContainer}>
                    <Text style={styles.saveCardLabel}>Enregistrer cette carte</Text>
                    <Text style={styles.saveCardDescription}>
                      Pour vos prochains paiements
                    </Text>
                  </View>
                  <Switch
                    value={shouldSaveCard}
                    onValueChange={setShouldSaveCard}
                    trackColor={{false: '#ddd', true: Colors.primary}}
                    thumbColor={shouldSaveCard ? '#fff' : '#f4f3f4'}
                  />
                </View>

                {/* Sécurité */}
                <View style={styles.securityInfo}>
                  <FontAwesome5 name="lock" size={14} color={Colors.text.secondary} style={styles.securityIcon} />
                  <Text style={styles.securityText}>
                    Paiement sécurisé par Stripe
                  </Text>
                </View>

                {/* Bouton de confirmation */}
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (!cardComplete || !cardholderName.trim() || isLoading) && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!cardComplete || !cardholderName.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Payer {amount}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    maxHeight: '90%',
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
    color: Colors.text.inverse,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
  textInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
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
  saveCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  saveCardTextContainer: {
    flex: 1,
  },
  saveCardLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  saveCardDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  securityIcon: {
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
