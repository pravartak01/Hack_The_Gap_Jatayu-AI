import React, { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { loginCitizen, setAuthToken } from '@/lib/authApi';

const C = {
  white: '#FFFFFF',
  bgPage: '#F7F6F3',

  saffron: '#FF6914',
  saffronLight: '#FFF4EE',
  saffronMid: '#FFE4CF',
  saffronBorder: '#FFCDA8',

  green: '#138044',
  greenLight: '#EDF7F1',
  greenBorder: '#9FD6B8',

  chakraBlue: '#1A3A6B',

  textPrimary: '#1C1C1C',
  textSecondary: '#585858',
  textMuted: '#9B9B9B',
  textLabel: '#3A3A3A',

  border: '#E8E4DC',
  error: '#D93025',
  errorBg: '#FFF0EF',
  successBg: '#EDF7F1',
};

function TriBar() {
  return (
    <View style={{ flexDirection: 'row', height: 4 }}>
      <View style={{ flex: 1, backgroundColor: C.saffron }} />
      <View
        style={{
          flex: 1,
          backgroundColor: C.white,
          borderTopWidth: 0.5,
          borderBottomWidth: 0.5,
          borderColor: '#E0DDD8',
        }}
      />
      <View style={{ flex: 1, backgroundColor: C.green }} />
    </View>
  );
}

function Field({
  label,
  error,
  ...props
}: { label: string; error?: string } & React.ComponentProps<typeof TextInput>) {
  const anim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };

  const onBlur = () => {
    Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: false }).start();
  };

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? C.error : C.border, error ? C.error : C.saffron],
  });

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.white, error ? C.errorBg : C.saffronLight],
  });

  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <Animated.View style={[f.box, { borderColor, backgroundColor: bg }]}>
        <TextInput
          {...props}
          style={f.input}
          placeholderTextColor={C.textMuted}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </Animated.View>
      {error ? <Text style={f.error}>{error}</Text> : null}
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textLabel,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  box: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    color: C.textPrimary,
    fontWeight: '500',
  },
  error: {
    marginTop: 4,
    fontSize: 11,
    color: C.error,
  },
});

function Btn({
  label,
  onPress,
  loading,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 40 }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      disabled={loading}
    >
      <Animated.View style={[b.base, { transform: [{ scale }] }]}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={b.label}>{label}</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
}

const b = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.green,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
  },
});

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fade, slideY]);

  const handleLogin = async () => {
    setLoading(true);
    setMessage('');

    try {
      const data = await loginCitizen({
        email: email.trim(),
        password,
        role: 'CITIZEN',
      });

      if (data?.token) {
        setAuthToken(data.token);
      }
      setIsError(false);
      setMessage(data?.message ?? 'Login successful');
      router.replace('/(tabs)/home');
    } catch (error) {
      setIsError(true);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TriBar />

          <Animated.View style={[s.header, { opacity: fade, transform: [{ translateY: slideY }] }]}>
            <View style={s.emblemRow}>
              <View style={s.badge}>
                <View style={s.badgeInner}>
                  <Text style={{ fontSize: 20 }}>🏛</Text>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.govMicro}>भारत सरकार  ·  Government of India</Text>
                <Text style={s.appName}>Lok Mitra</Text>
                <Text style={s.appSub}>Citizen Services Portal</Text>
              </View>
            </View>

            <View style={s.triRule}>
              <View style={{ flex: 3, backgroundColor: C.saffron, height: 3, borderRadius: 2 }} />
              <View style={{ flex: 1, backgroundColor: C.chakraBlue, height: 3, borderRadius: 2 }} />
              <View style={{ flex: 3, backgroundColor: C.green, height: 3, borderRadius: 2 }} />
            </View>
          </Animated.View>

          <Animated.View style={[s.card, { opacity: fade, transform: [{ translateY: slideY }] }]}>
            <View style={{ height: 3, backgroundColor: C.green }} />

            <View style={s.cardBody}>
              <Text style={s.cardTitle}>Citizen Login</Text>
              <Text style={s.cardSub}>Sign in with your registered details to access citizen services.</Text>

              <View style={s.hairline} />

              <Field
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Field
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <View style={{ marginTop: 10 }}>
                <Btn label="Sign In Securely" onPress={handleLogin} loading={loading} />
              </View>

              {message ? (
                <View style={[s.msgBox, isError ? s.msgBoxErr : s.msgBoxOk]}>
                  <View style={[s.msgDot, { backgroundColor: isError ? C.error : C.green }]} />
                  <Text style={[s.msgText, { color: isError ? C.error : C.green }]}>{message}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          <Animated.View style={[s.footer, { opacity: fade }]}>
            <Text style={s.footerTxt}>New citizen user?</Text>
            <Link href="/auth/signup" style={s.footerLink}>
              Create Account →
            </Link>

            <View style={s.disclaimer}>
              <Text style={s.disclaimerTxt}>
                🔒 Your information is protected under the{`\n`}
                Digital Personal Data Protection Act, 2023
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgPage },
  scroll: { paddingBottom: 48 },

  header: {
    backgroundColor: C.white,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  emblemRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: C.saffronBorder,
    backgroundColor: C.saffronLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.saffronMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  govMicro: {
    fontSize: 9,
    color: C.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  appName: { fontSize: 24, fontWeight: '800', color: C.textPrimary, letterSpacing: 0.2 },
  appSub: { fontSize: 11, color: C.textSecondary, letterSpacing: 0.4, marginTop: 1 },
  triRule: { flexDirection: 'row', gap: 3 },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardBody: { padding: 20 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.1 },
  cardSub: { fontSize: 11.5, color: C.textMuted, marginTop: 2, marginBottom: 14 },
  hairline: { height: 1, backgroundColor: C.border, marginBottom: 18 },

  msgBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 11,
    borderRadius: 8,
    borderWidth: 1,
  },
  msgBoxErr: { backgroundColor: C.errorBg, borderColor: '#FFCCCC' },
  msgBoxOk: { backgroundColor: C.successBg, borderColor: C.greenBorder },
  msgDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  msgText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 17 },

  footer: {
    marginTop: 22,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 24,
  },
  footerTxt: { fontSize: 13, color: C.textMuted },
  footerLink: { fontSize: 13, fontWeight: '700', color: C.saffron, letterSpacing: 0.2 },
  disclaimer: {
    marginTop: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
  },
  disclaimerTxt: {
    fontSize: 10.5,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
