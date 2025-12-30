// Écran Wallet - wrapper du composant existant
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WalletView from '../components/WalletView';
import { useApp } from '../context/AppContext';
import { userService } from '../services/userService';
import { Colors } from '../config/theme';
import type { Transaction, PaymentMethod } from '../types';

const WalletScreen: React.FC = () => {
  const { wallet, setWallet, addTransaction, addPaymentMethod } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setIsLoading(true);
    const result = await userService.getWallet();
    if (result.success && result.data) {
      setWallet(result.data);
    }
    setIsLoading(false);
  };

  const handleAddMoney = async (amount: number) => {
    // In real implementation, this would process through Stripe
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      userId: '',
      type: 'deposit',
      amount,
      description: 'Ajout de fonds',
      createdAt: new Date().toISOString(),
    };
    addTransaction(newTransaction);
  };

  const handleAddPaymentMethod = async (method: Omit<PaymentMethod, 'id' | 'userId' | 'createdAt'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString(),
      userId: '',
      createdAt: new Date().toISOString(),
    };
    addPaymentMethod(newMethod);
  };

  // Convert wallet data to component format
  const transactions = wallet?.transactions.map(t => ({
    id: t.id,
    type: t.type,
    description: t.description,
    amount: t.amount,
    date: new Date(t.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    service: undefined,
  })) || [];

  const paymentMethods = wallet?.paymentMethods.map(pm => ({
    id: pm.id,
    type: pm.type as 'card' | 'paypal' | 'apple_pay',
    name: pm.brand,
    lastDigits: pm.last4,
    isDefault: pm.isDefault,
  })) || [];

  return (
    <SafeAreaView style={styles.container}>
      <WalletView
        balance={wallet?.balance || 0}
        transactions={transactions}
        paymentMethods={paymentMethods}
        onAddMoney={handleAddMoney}
        onAddPaymentMethod={handleAddPaymentMethod}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
});

export default WalletScreen;
