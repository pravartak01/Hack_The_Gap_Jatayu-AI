import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { authTheme } from '@/constants/authTheme';

type AuthScreenShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthScreenShell({ title, subtitle, children }: AuthScreenShellProps) {
  return (
    <View style={styles.page}>
      <View style={styles.topStripe} />
      <View style={styles.bottomStripe} />
      <View style={styles.glassCircleLeft} />
      <View style={styles.glassCircleRight} />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandWrap}>
            <View style={styles.emblem}>
              <Text style={styles.emblemText}>IN</Text>
            </View>
            <Text style={styles.brandTopLine}>Government Citizen Services</Text>
            <Text style={styles.brandTitle}>Lok Mitra</Text>
            <Text style={styles.brandSubtitle}>Official application for citizen support and assistance</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: authTheme.colors.whiteBase,
  },
  topStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: authTheme.colors.saffronSoft,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
  },
  bottomStripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '26%',
    backgroundColor: authTheme.colors.greenSoft,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
  },
  glassCircleLeft: {
    position: 'absolute',
    top: 56,
    left: -32,
    height: 140,
    width: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF55',
  },
  glassCircleRight: {
    position: 'absolute',
    top: 120,
    right: -22,
    height: 96,
    width: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF66',
  },
  keyboardContainer: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emblem: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: authTheme.colors.whiteCard,
    borderWidth: 1,
    borderColor: authTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emblemText: {
    fontSize: 14,
    fontWeight: '800',
    color: authTheme.colors.saffronAccent,
  },
  brandTopLine: {
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: authTheme.colors.textSecondary,
    fontWeight: '700',
  },
  brandTitle: {
    marginTop: 4,
    fontSize: 32,
    fontWeight: '800',
    color: authTheme.colors.textPrimary,
  },
  brandSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: authTheme.colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: authTheme.colors.whiteCard,
    borderWidth: 1,
    borderColor: authTheme.colors.border,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: authTheme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 18,
    color: authTheme.colors.textSecondary,
  },
});
