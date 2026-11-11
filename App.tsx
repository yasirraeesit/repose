import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DebugSignalScreen } from './src/screens/DebugSignalScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <DebugSignalScreen />
    </SafeAreaProvider>
  );
}
