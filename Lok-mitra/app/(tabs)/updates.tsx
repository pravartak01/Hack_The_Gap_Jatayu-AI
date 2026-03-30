import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function UpdatesTabScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Updates</Text>
        <Text style={styles.subtitle}>Latest alerts and government updates appear here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F6F3',
    padding: 20,
  },
  card: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    padding: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1C',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#585858',
  },
});
