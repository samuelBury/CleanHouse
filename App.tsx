// App principal - CleanHouse
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';

import { AuthProvider } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51ShsNC90Od9MQpmiEh5qhipQNjaBktdVx6eieMsc9OpgMdeYbWinmcpG8s0JUBGLilqS59CAG1FT3gCwQ7SMqsXp00HeUwDdeJ';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <AuthProvider>
          <BookingProvider>
            <AppProvider>
              <AppNavigator />
            </AppProvider>
          </BookingProvider>
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
