import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface CardInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: string;
  isIndeterminate: boolean;
}

export default function CardInputModal({
  visible,
  onClose,
  onSuccess,
  amount,
  isIndeterminate,
}: CardInputModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Formater le numéro de carte (ajouter des espaces tous les 4 chiffres)
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // 16 chiffres + 3 espaces
  };

  // Formater la date d'expiration (MM/YY)
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  // Validation basique de la carte (algorithme de Luhn)
  const validateCardNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.length !== 16) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  // Valider la date d'expiration
  const validateExpiryDate = (date: string) => {
    const parts = date.split('/');
    if (parts.length !== 2) return false;

    const month = parseInt(parts[0], 10);
    const year = parseInt('20' + parts[1], 10);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const expiry = new Date(year, month - 1);

    return expiry > now;
  };

  const handleSubmit = async () => {
    // Validation
    if (!cardHolder.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du titulaire');
      return;
    }

    if (!validateCardNumber(cardNumber)) {
      Alert.alert('Erreur', 'Numéro de carte invalide');
      return;
    }

    if (!validateExpiryDate(expiryDate)) {
      Alert.alert('Erreur', "Date d'expiration invalide");
      return;
    }

    if (cvv.length < 3) {
      Alert.alert('Erreur', 'CVV invalide');
      return;
    }

    setIsLoading(true);

    // Simuler un appel API Stripe
    // En production, vous utiliseriez stripe.createPaymentMethod() ou stripe.confirmPayment()
    setTimeout(() => {
      setIsLoading(false);
      // Réinitialiser le formulaire
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardHolder('');
      onSuccess();
    }, 2000);
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
            onClose();
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
                  : `Montant: ${amount}`
                }
              </Text>
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
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
                  Une pré-autorisation sera effectuée. Le montant final sera débité à la fin de la prestation.
                </Text>
              </View>
            )}

            {/* Titulaire de la carte */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Titulaire de la carte</Text>
              <TextInput
                style={styles.formInput}
                placeholder="JEAN DUPONT"
                placeholderTextColor="#999"
                value={cardHolder}
                onChangeText={(text) => setCardHolder(text.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>

            {/* Numéro de carte */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Numéro de carte</Text>
              <TextInput
                style={styles.formInput}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#999"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            {/* Date d'expiration et CVV */}
            <View style={styles.rowGroup}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 12}]}>
                <Text style={styles.formLabel}>Date d'expiration</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="MM/YY"
                  placeholderTextColor="#999"
                  value={expiryDate}
                  onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={[styles.formGroup, {flex: 1}]}>
                <Text style={styles.formLabel}>CVV</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="123"
                  placeholderTextColor="#999"
                  value={cvv}
                  onChangeText={(text) => setCvv(text.replace(/\D/g, '').substring(0, 4))}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
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
                isLoading && styles.confirmButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    backgroundColor: '#5FB17C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#fff',
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
    color: '#fff',
  },
  formContainer: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
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
    color: '#1565C0',
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rowGroup: {
    flexDirection: 'row',
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
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#5FB17C',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
