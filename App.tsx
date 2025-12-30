// App principal - CleanHouse
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BookingProvider>
          <AppProvider>
            <AppNavigator />
          </AppProvider>
        </BookingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
