import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';

/**
 * Main mobile application component for Salesforce metadata management solution.
 * This is the entry point for the mobile app.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <AppNavigator />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}