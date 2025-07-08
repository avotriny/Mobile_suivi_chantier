// App.jsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ContextProvider from './src/components/context/ContextProvider';
import AppContent from './src/components/AppContent';

export default function App() {
  return (
    <SafeAreaProvider>
      <ContextProvider>
        <AppContent />
      </ContextProvider>
    </SafeAreaProvider>
  );
}
