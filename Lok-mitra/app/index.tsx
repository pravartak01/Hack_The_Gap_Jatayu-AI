import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

export default function DemoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Lok Mitra Demo Screen</Text>
      <Text style={styles.subtitle}>Your React Native app is ready.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555555',
  },
});
