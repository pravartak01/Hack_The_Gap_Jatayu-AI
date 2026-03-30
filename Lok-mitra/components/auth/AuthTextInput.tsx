import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { authTheme } from '@/constants/authTheme';

type AuthTextInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AuthTextInput({ label, error, style, ...props }: AuthTextInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor={authTheme.colors.textSecondary}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: authTheme.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: authTheme.colors.border,
    backgroundColor: '#FFFEFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: authTheme.colors.textPrimary,
    fontSize: 15,
  },
  error: {
    marginTop: 4,
    color: authTheme.colors.error,
    fontSize: 12,
  },
});
