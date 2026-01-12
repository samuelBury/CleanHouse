import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors} from '../config/theme';
import {paymentService} from '../services/paymentService';
import type {PaymentMethod} from '../types';

interface PaymentMethodsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaymentMethodsModal({
  visible,
  onClose,
}: PaymentMethodsModalProps) {
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadCards();
    }
  }, [visible]);

  const loadCards = async () => {
    setLoading(true);
    const result = await paymentService.getPaymentMethods();
    if (result.success && result.data) {
      setCards(result.data);
    }
    setLoading(false);
  };

  const handleDeleteCard = (card: PaymentMethod) => {
    Alert.alert(
      'Supprimer la carte',
      `Voulez-vous supprimer la carte ${card.brand} •••• ${card.last4} ?`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteCard(card.id),
        },
      ]
    );
  };

  const deleteCard = async (cardId: string) => {
    setDeletingId(cardId);
    const result = await paymentService.removePaymentMethod(cardId);
    if (result.success) {
      setCards(prev => prev.filter(c => c.id !== cardId));
      Alert.alert('Succès', 'Carte supprimée');
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de supprimer la carte');
    }
    setDeletingId(null);
  };

  const handleSetDefault = async (cardId: string) => {
    const result = await paymentService.setDefaultPaymentMethod(cardId);
    if (result.success) {
      setCards(prev =>
        prev.map(c => ({
          ...c,
          isDefault: c.id === cardId,
        }))
      );
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de définir comme défaut');
    }
  };

  const getCardIcon = () => {
    return 'credit-card';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Moyens de paiement</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesome5 name="times" size={16} color={Colors.text.inverse} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : cards.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome5 name="credit-card" size={48} color={Colors.text.tertiary} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>Aucune carte enregistrée</Text>
                <Text style={styles.emptySubtext}>
                  Ajoutez une carte lors de votre prochaine réservation
                </Text>
              </View>
            ) : (
              cards.map((card) => (
                <View key={card.id} style={styles.cardItem}>
                  <View style={styles.cardIconContainer}>
                    <FontAwesome5 name={getCardIcon()} size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardBrand}>{card.brand}</Text>
                      {card.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Par défaut</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
                    <Text style={styles.cardExpiry}>
                      Expire {card.expMonth?.toString().padStart(2, '0')}/{card.expYear}
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    {!card.isDefault && (
                      <TouchableOpacity
                        style={styles.defaultButton}
                        onPress={() => handleSetDefault(card.id)}
                      >
                        <Text style={styles.defaultButtonText}>Défaut</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteCard(card)}
                      disabled={deletingId === card.id}
                    >
                      {deletingId === card.id ? (
                        <ActivityIndicator size="small" color={Colors.status.error} />
                      ) : (
                        <FontAwesome5 name="trash-alt" size={16} color={Colors.status.error} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: Colors.text.inverse,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIcon: {
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
  defaultBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardNumber: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primary + '20',
  },
  defaultButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.status.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
  },
});
