import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import CardInputModal from './CardInputModal';
import {Colors} from '../config/theme';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => void;
  service: string;
  date: string;
  time: string;
  duration: number;
  isIndeterminate: boolean;
}

export default function PaymentModal({visible, onClose, onConfirm, service, date, time, duration, isIndeterminate}: PaymentModalProps) {
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showCardInput, setShowCardInput] = useState(false);

  const paymentMethods = [
    {id: 'card', name: 'Carte bancaire', icon: '💳'},
  ];

  // Calculer le montant
  const getPrice = () => {
    const rate = service === 'Ménage' ? 15 : service === 'Repassage' ? 10 : 20;
    if (isIndeterminate) {
      return `${rate}€/h`;
    }
    return `${rate * duration}€`;
  };

  const handleCardSuccess = () => {
    setShowCardInput(false);
    onConfirm('Carte bancaire');
  };

  return (
    <>
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderIcon}>
              <Text style={styles.modalIconText}>💳</Text>
            </View>
            <Text style={styles.modalHeaderTitle}>Moyen de paiement</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
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
                <Text style={styles.summaryPrice}>
                  {isIndeterminate
                    ? `${service === 'Ménage' ? '15' : service === 'Repassage' ? '10' : '20'}€/h`
                    : `${(service === 'Ménage' ? 15 : service === 'Repassage' ? 10 : 20) * duration}€`
                  }
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Choisissez votre méthode de paiement</Text>

            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  selectedPayment === method.id && styles.paymentOptionSelected,
                ]}
                onPress={() => setSelectedPayment(method.id)}
              >
                <View style={styles.paymentIconContainer}>
                  <Text style={styles.paymentIcon}>{method.icon}</Text>
                </View>
                <Text style={styles.paymentName}>{method.name}</Text>
                <View style={styles.radioButton}>
                  {selectedPayment === method.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedPayment && styles.confirmButtonDisabled,
              ]}
              disabled={!selectedPayment}
              onPress={() => {
                if (selectedPayment === 'card') {
                  setShowCardInput(true);
                }
              }}
            >
              <Text style={styles.confirmButtonText}>Continuer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    {/* Card Input Modal - en dehors de PaymentModal */}
    <CardInputModal
      visible={showCardInput}
      onClose={() => setShowCardInput(false)}
      onSuccess={handleCardSuccess}
      amount={getPrice()}
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
    maxHeight: '80%',
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
    marginBottom: 20,
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
    backgroundColor: '#e3f2fd',
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
    fontSize: 24,
  },
  paymentName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
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
