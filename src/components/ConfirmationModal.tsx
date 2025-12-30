import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import {Colors} from '../config/theme';

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  service: string;
  duration: number;
  date: string;
  time: string;
  payment: string;
}

export default function ConfirmationModal({
  visible,
  onClose,
  service,
  duration,
  date,
  time,
  payment,
}: ConfirmationModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pingScale = useRef(new Animated.Value(1)).current;
  const pingOpacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    if (visible) {
      // Animation de pulsation d'opacité (animate-pulse)
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
  }, [visible, pulseAnim, pingScale, pingOpacity]);

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
            {/* Ping circle (background) */}
            <Animated.View
              style={[
                styles.pingCircle,
                {
                  transform: [{scale: pingScale}],
                  opacity: pingOpacity,
                },
              ]}
            />
            {/* Main circle with gradient effect and pulse */}
            <Animated.View
              style={[
                styles.iconCircle,
                {
                  opacity: pulseAnim,
                },
              ]}
            >
              <Text style={styles.iconText}>🔍</Text>
            </Animated.View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Réservation confirmée !</Text>
          <Text style={styles.subtitle}>
            En attente de trouver un professionnel...
          </Text>

          {/* Reservation Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{service}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Durée</Text>
              <Text style={styles.detailValue}>{duration}h</Text>
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
              <Text style={styles.detailLabel}>Paiement</Text>
              <Text style={styles.detailValue}>{payment}</Text>
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
            <Text style={styles.confirmIcon}>✓</Text>
            <Text style={styles.confirmButtonText}>Compris</Text>
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
  iconText: {
    fontSize: 50,
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
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  confirmIcon: {
    fontSize: 20,
    color: Colors.text.inverse,
    marginRight: 8,
  },
  confirmButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
