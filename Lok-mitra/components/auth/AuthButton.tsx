import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { authTheme } from '@/constants/authTheme';

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'saffron' | 'green';
};

export function AuthButton({ label, onPress, loading = false, variant = 'saffron' }: AuthButtonProps) {
  const bgColor = variant === 'green' ? authTheme.colors.greenAccent : authTheme.colors.saffronAccent;

  return (
    <Pressable onPress={onPress} disabled={loading} style={({ pressed }) => [styles.button, { backgroundColor: bgColor, opacity: pressed || loading ? 0.8 : 1 }]}>
      {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  label: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
