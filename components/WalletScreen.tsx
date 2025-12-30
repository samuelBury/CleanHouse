import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';

export interface Transaction {
  id: string;
  type: 'expense' | 'deposit' | 'refund';
  description: string;
  amount: number;
  date: string;
  service?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay';
  name: string;
  lastDigits?: string;
  isDefault: boolean;
}

interface WalletScreenProps {
  balance: number;
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  onAddMoney: (amount: number) => void;
  onAddPaymentMethod: (method: PaymentMethod) => void;
}

export default function WalletScreen({
  balance,
  transactions,
  paymentMethods,
  onAddMoney,
  onAddPaymentMethod,
}: WalletScreenProps) {
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');

  const getTransactionIcon = (type: string, service?: string) => {
    if (type === 'deposit') return '💰';
    if (type === 'refund') return '↩️';
    if (service === 'Ménage') return '🏠';
    if (service === 'Repassage') return '👔';
    return '✨';
  };

  const getTransactionColor = (type: string) => {
    if (type === 'deposit' || type === 'refund') return '#4CAF50';
    return '#789C8D';
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'card': return '💳';
      case 'paypal': return '🅿️';
      case 'apple_pay': return '🍎';
      default: return '💳';
    }
  };

  const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
  };

  const handleAddMoney = () => {
    const amount = parseFloat(addAmount);
    if (amount > 0) {
      onAddMoney(amount);
      setAddAmount('');
      setShowAddMoney(false);
    }
  };

  const handleAddCard = () => {
    if (cardNumber.length >= 16 && cardName) {
      const newCard: PaymentMethod = {
        id: Date.now().toString(),
        type: 'card',
        name: cardName,
        lastDigits: cardNumber.slice(-4),
        isDefault: paymentMethods.length === 0,
      };
      onAddPaymentMethod(newCard);
      setCardNumber('');
      setCardName('');
      setShowAddCard(false);
    }
  };

  const quickAmounts = [10, 20, 50, 100];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec solde */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Portefeuille</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde disponible</Text>
          <Text style={styles.balanceAmount}>{balance.toFixed(2)} €</Text>
          <TouchableOpacity
            style={styles.addMoneyButton}
            onPress={() => setShowAddMoney(true)}
          >
            <Text style={styles.addMoneyIcon}>+</Text>
            <Text style={styles.addMoneyText}>Ajouter de l'argent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Moyens de paiement */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Moyens de paiement</Text>
          <TouchableOpacity onPress={() => setShowAddCard(true)}>
            <Text style={styles.addButton}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {paymentMethods.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>Aucun moyen de paiement</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddCard(true)}
            >
              <Text style={styles.emptyButtonText}>Ajouter une carte</Text>
            </TouchableOpacity>
          </View>
        ) : (
          paymentMethods.map((method) => (
            <View key={method.id} style={styles.paymentCard}>
              <View style={styles.paymentIcon}>
                <Text style={styles.paymentIconText}>{getPaymentIcon(method.type)}</Text>
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>{method.name}</Text>
                {method.lastDigits && (
                  <Text style={styles.paymentDetails}>•••• {method.lastDigits}</Text>
                )}
              </View>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Par défaut</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Historique des transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique des dépenses</Text>

        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Aucune transaction</Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={[styles.transactionIcon, {backgroundColor: `${getTransactionColor(transaction.type)}20`}]}>
                <Text style={styles.transactionIconText}>
                  {getTransactionIcon(transaction.type, transaction.service)}
                </Text>
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDesc}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                {color: getTransactionColor(transaction.type)}
              ]}>
                {transaction.type === 'expense' ? '-' : '+'}{transaction.amount.toFixed(2)} €
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Statistiques */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résumé</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>
              {transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0).toFixed(2)} €
            </Text>
            <Text style={styles.statLabel}>Total dépensé</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🧾</Text>
            <Text style={styles.statValue}>
              {transactions.filter(t => t.type === 'expense').length}
            </Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />

      {/* Modal Ajouter de l'argent */}
      <Modal visible={showAddMoney} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddMoney(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter de l'argent</Text>
              <TouchableOpacity onPress={() => setShowAddMoney(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Montant</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  value={addAmount}
                  onChangeText={setAddAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#999"
                />
                <Text style={styles.currencySymbol}>€</Text>
              </View>

              <View style={styles.quickAmounts}>
                {quickAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmountButton}
                    onPress={() => setAddAmount(amount.toString())}
                  >
                    <Text style={styles.quickAmountText}>{amount} €</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.confirmButton, !addAmount && styles.confirmButtonDisabled]}
                onPress={handleAddMoney}
                disabled={!addAmount}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Ajouter une carte */}
      <Modal visible={showAddCard} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddCard(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter une carte</Text>
              <TouchableOpacity onPress={() => setShowAddCard(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nom sur la carte</Text>
              <TextInput
                style={styles.textInput}
                value={cardName}
                onChangeText={setCardName}
                placeholder="Jean Dupont"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Numéro de carte</Text>
              <TextInput
                style={styles.textInput}
                value={cardNumber}
                onChangeText={(text) => setCardNumber(text.replace(/\D/g, '').slice(0, 16))}
                keyboardType="numeric"
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!cardName || cardNumber.length < 16) && styles.confirmButtonDisabled
                ]}
                onPress={handleAddCard}
                disabled={!cardName || cardNumber.length < 16}
              >
                <Text style={styles.confirmButtonText}>Ajouter la carte</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#789C8D',
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginTop: -10,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe5d9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addMoneyIcon: {
    fontSize: 18,
    color: '#789C8D',
    fontWeight: '700',
    marginRight: 8,
  },
  addMoneyText: {
    fontSize: 14,
    color: '#789C8D',
    fontWeight: '600',
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  addButton: {
    fontSize: 14,
    color: '#789C8D',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#789C8D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffe5d9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentIconText: {
    fontSize: 24,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#ffe5d9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    color: '#789C8D',
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 22,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 20,
    color: '#999',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: '#ffe5d9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#789C8D',
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#789C8D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
