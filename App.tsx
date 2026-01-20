// App principal - CleanHouse
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51ShsNC90Od9MQpmiEh5qhipQNjaBktdVx6eieMsc9OpgMdeYbWinmcpG8s0JUBGLilqS59CAG1FT3gCwQ7SMqsXp00HeUwDdeJ';

// Conditionally import StripeProvider (not available in Expo Go)
let StripeProvider: React.ComponentType<{ publishableKey: string; children: React.ReactNode }> | null = null;
try {
  StripeProvider = require('@stripe/stripe-react-native').StripeProvider;
} catch (e) {
  console.log('Stripe native module not available (Expo Go). Payment features disabled.');
}

export default function App(): React.JSX.Element {
  const content = (
    <AuthProvider>
      <BookingProvider>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </BookingProvider>
    </AuthProvider>
  );

  return (
    <SafeAreaProvider>
      {StripeProvider ? (
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
          {content}
        </StripeProvider>
      ) : (
        content
      )}
    </SafeAreaProvider>
  );
}
