import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
// ត្រូវប្រាកដថាអ្នកមានឯកសារនេះនៅក្នុង src/screens/SyncScreen.tsx
import SyncScreen from './src/screens/SyncScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <SyncScreen />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});