import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors} from '../config/theme';
import type {Booking} from '../types';

interface BookingDetailsModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onCancel?: (bookingId: string) => void;
}

export default function BookingDetailsModal({
  visible,
  booking,
  onClose,
  onCancel,
}: BookingDetailsModalProps) {
  const insets = useSafeAreaInsets();

  // Ne pas afficher si pas de booking
  if (!booking) {
    return (
      <Modal visible={false} transparent>
        <View />
      </Modal>
    );
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'Ménage':
        return 'home';
      case 'Repassage':
        return 'tshirt';
      case 'Ménage + Repassage':
        return 'magic';
      default:
        return 'broom';
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {label: 'En attente de confirmation', color: '#f59e0b', bg: '#fef3c7', icon: 'hourglass-half'};
      case 'confirmed':
        return {label: 'Confirmé', color: 'Colors.primaryLight', bg: 'Colors.primaryBackground', icon: 'check'};
      case 'in_progress':
        return {label: 'En cours', color: Colors.primary, bg: 'Colors.primaryBackground', icon: 'sync-alt'};
      case 'completed':
        return {label: 'Terminé', color: '#6b7280', bg: '#f3f4f6', icon: 'check'};
      case 'cancelled':
        return {label: 'Annulé', color: '#ef4444', bg: '#fee2e2', icon: 'times'};
      default:
        return {label: status, color: '#6b7280', bg: '#f3f4f6', icon: 'question'};
    }
  };

  const formatDate = (dateStr: string): string => {
    if (dateStr.includes('T') || dateStr.includes('Z')) {
      const d = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return d.toLocaleDateString('fr-FR', options);
    }
    return dateStr;
  };

  const formatDateTime = (dateStr: string): string => {
    if (dateStr.includes('T') || dateStr.includes('Z')) {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return dateStr;
  };

  const openMaps = () => {
    const address = encodeURIComponent(booking.address);
    const url = `https://maps.google.com/?q=${address}`;
    Linking.openURL(url);
  };

  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const statusInfo = getStatusInfo(booking.status);

  const handleCancel = () => {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.',
      [
        {text: 'Non', style: 'cancel'},
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            onCancel?.(booking.id);
            onClose();
          },
        },
      ]
    );
  };

  // Calculer le prix horaire
  const hourlyRate = booking.duration > 0 ? (booking.price / booking.duration).toFixed(2) : booking.price;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={[styles.modalOverlay, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View style={styles.modalContent}>
          {/* Header avec statut */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerIcon}>
                <FontAwesome5 name={getServiceIcon(booking.service)} size={32} color={Colors.primary} />
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <FontAwesome5 name="times" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>{booking.service}</Text>
            <View style={styles.statusRow}>
              <FontAwesome5 name={statusInfo.icon} size={16} color="#FFFFFF" style={styles.statusIcon} />
              <Text style={styles.statusLabel}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Date et heure */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date et heure</Text>
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardIconContainer}>
                    <FontAwesome5 name="calendar-alt" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardLabel}>Date</Text>
                    <Text style={styles.cardValue}>{formatDate(booking.date)}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.cardRow}>
                  <View style={styles.cardIconContainer}>
                    <FontAwesome5 name="clock" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardLabel}>Heure de début</Text>
                    <Text style={styles.cardValue}>{booking.time}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.cardRow}>
                  <View style={styles.cardIconContainer}>
                    <FontAwesome5 name="stopwatch" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardLabel}>Durée estimée</Text>
                    <Text style={styles.cardValue}>{booking.duration} heure{booking.duration > 1 ? 's' : ''}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Adresse */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lieu d'intervention</Text>
              <TouchableOpacity style={styles.addressCard} onPress={openMaps} activeOpacity={0.7}>
                <View style={styles.addressIconContainer}>
                  <FontAwesome5 name="map-marker-alt" size={20} color="#ef4444" />
                </View>
                <View style={styles.addressContent}>
                  <Text style={styles.addressText}>{booking.address}</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.addressAction}>Ouvrir dans Maps </Text>
                    <FontAwesome5 name="arrow-right" size={12} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Professionnel */}
            {booking.professional && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Votre professionnel</Text>
                <View style={styles.professionalCard}>
                  <View style={styles.professionalAvatar}>
                    <Text style={styles.professionalAvatarText}>
                      {booking.professional.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.professionalInfo}>
                    <Text style={styles.professionalName}>{booking.professional}</Text>
                    <Text style={styles.professionalRole}>Agent de ménage professionnel</Text>
                    <View style={styles.ratingRow}>
                      <FontAwesome5 name="star" solid size={12} color="#FFD700" />
                      <FontAwesome5 name="star" solid size={12} color="#FFD700" />
                      <FontAwesome5 name="star" solid size={12} color="#FFD700" />
                      <FontAwesome5 name="star" solid size={12} color="#FFD700" />
                      <FontAwesome5 name="star" solid size={12} color="#FFD700" />
                      <Text style={styles.ratingText}>5.0</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Notes */}
            {booking.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions particulières</Text>
                <View style={styles.notesCard}>
                  <FontAwesome5 name="sticky-note" size={20} color="#f59e0b" style={styles.notesIcon} />
                  <Text style={styles.notesText}>{booking.notes}</Text>
                </View>
              </View>
            )}

            {/* Récapitulatif prix */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Récapitulatif du paiement</Text>
              <View style={styles.priceCard}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{booking.service}</Text>
                  <Text style={styles.priceValue}>{hourlyRate}€/h</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Durée</Text>
                  <Text style={styles.priceValue}>× {booking.duration}h</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{booking.price}€</Text>
                </View>
                <View style={styles.paymentStatus}>
                  <FontAwesome5 name="check" size={14} color="Colors.primaryLight" style={styles.paymentStatusIcon} />
                  <Text style={styles.paymentStatusText}>Payé</Text>
                </View>
              </View>
            </View>

            {/* Informations de réservation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>N° de réservation</Text>
                  <Text style={styles.infoValue}>{booking.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Réservé le</Text>
                  <Text style={styles.infoValue}>{formatDateTime(booking.createdAt)}</Text>
                </View>
              </View>
            </View>

            <View style={{height: 20}} />
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {canCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <FontAwesome5 name="times" size={16} color="#ef4444" style={styles.cancelButtonIcon} />
                <Text style={styles.cancelButtonText}>Annuler la réservation</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeActionButton} onPress={onClose}>
              <Text style={styles.closeActionText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    backgroundColor: Colors.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIcon: {
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginLeft: 70,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  addressIcon: {
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  addressAction: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  professionalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 16,
  },
  professionalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  professionalAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  professionalRole: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 2,
  },
  ratingStars: {
    marginRight: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  notesCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 16,
  },
  notesIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  priceCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  priceValue: {
    fontSize: 15,
    color: Colors.text.primary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'Colors.primaryBackground',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
  },
  paymentStatusIcon: {
    fontSize: 14,
    color: 'Colors.primaryLight',
    marginRight: 6,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'Colors.primaryLight',
  },
  infoCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  actions: {
    padding: 20,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    padding: 16,
  },
  cancelButtonIcon: {
    fontSize: 16,
    color: '#ef4444',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  closeActionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  closeActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
