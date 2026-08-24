import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider } from './src/context/AuthContext';
import { WizardProvider } from './src/context/WizardContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <WizardProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </WizardProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
