import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {Colors} from '../config/theme';

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  service: string;
  duration: number;
  date: string;
  time: string;
  payment: string;
  mode?: 'booking' | 'payment';
  isIndeterminate?: boolean;
}

export default function ConfirmationModal({
  visible,
  onClose,
  service,
  duration,
  date,
  time,
  payment,
  mode = 'booking',
  isIndeterminate = false,
}: ConfirmationModalProps) {
  const isPaymentMode = mode === 'payment';
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pingScale = useRef(new Animated.Value(1)).current;
  const pingOpacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    if (visible && !isPaymentMode) {
      // Animation de pulsation d'opacité (animate-pulse) - seulement en mode booking
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animation ping (expansion + disparition)
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pingScale, {
              toValue: 2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pingOpacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pingScale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(pingOpacity, {
              toValue: 0.2,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, [visible, pulseAnim, pingScale, pingOpacity, isPaymentMode]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            {/* Ping circle (background) - seulement en mode booking */}
            {!isPaymentMode && (
              <Animated.View
                style={[
                  styles.pingCircle,
                  {
                    transform: [{scale: pingScale}],
                    opacity: pingOpacity,
                  },
                ]}
              />
            )}
            {/* Main circle with gradient effect and pulse */}
            <Animated.View
              style={[
                styles.iconCircle,
                isPaymentMode && styles.iconCircleSuccess,
                {
                  opacity: isPaymentMode ? 1 : pulseAnim,
                },
              ]}
            >
              <FontAwesome5 name={isPaymentMode ? 'check' : 'search'} size={50} color="#fff" />
            </Animated.View>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isPaymentMode ? 'Paiement réussi !' : 'Réservation confirmée !'}
          </Text>
          <Text style={styles.subtitle}>
            {isPaymentMode
              ? 'Votre paiement a été traité avec succès'
              : 'En attente de trouver un professionnel...'}
          </Text>

          {/* Reservation Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{service}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Durée</Text>
              <Text style={styles.detailValue}>
                {isIndeterminate ? 'Indéterminée' : `${duration}h`}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{date}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Heure</Text>
              <Text style={styles.detailValue}>{time}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{isPaymentMode ? 'Montant' : 'Paiement'}</Text>
              <Text style={[styles.detailValue, isPaymentMode && styles.paymentAmount]}>
                {payment}
              </Text>
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity style={styles.confirmButtonContainer} onPress={onClose} activeOpacity={0.8}>
            <LinearGradient colors={Colors.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.confirmButton}>
              <FontAwesome5 name="check" size={20} color={Colors.text.inverse} style={styles.confirmIcon} />
              <Text style={styles.confirmButtonText}>
                {isPaymentMode ? 'Continuer' : 'Compris'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: 24,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    position: 'relative',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSuccess: {
    backgroundColor: Colors.primaryLight,
  },
  iconText: {
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginBottom: 24,
    textAlign: 'center',
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  paymentAmount: {
    color: Colors.primaryLight,
    fontWeight: 'bold',
  },
  confirmButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  confirmButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIcon: {
    marginRight: 8,
  },
  confirmButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
