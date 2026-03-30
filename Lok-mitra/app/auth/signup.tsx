import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useRouter } from 'expo-router';
import {
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
  ActivityIndicator,
} from 'react-native';
import { setAuthToken, signupCitizen, verifyCitizenOtp } from '@/lib/authApi';

// ─── Tricolor Design Tokens ───────────────────────────────────────────────────
const C = {
  white:         '#FFFFFF',
  bgPage:        '#F7F6F3',

  saffron:       '#FF6914',
  saffronLight:  '#FFF4EE',
  saffronMid:    '#FFE4CF',
  saffronBorder: '#FFCDA8',

  green:         '#138044',
  greenLight:    '#EDF7F1',
  greenMid:      '#C3E8D4',
  greenBorder:   '#9FD6B8',

  chakraBlue:    '#1A3A6B',

  textPrimary:   '#1C1C1C',
  textSecondary: '#585858',
  textMuted:     '#9B9B9B',
  textLabel:     '#3A3A3A',

  border:        '#E8E4DC',
  error:         '#D93025',
  errorBg:       '#FFF0EF',
  successBg:     '#EDF7F1',
};

// ─── Tricolor Rule Bar ────────────────────────────────────────────────────────
function TriBar() {
  return (
    <View style={{ flexDirection: 'row', height: 4 }}>
      <View style={{ flex: 1, backgroundColor: C.saffron }} />
      <View style={{ flex: 1, backgroundColor: C.white, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#E0DDD8' }} />
      <View style={{ flex: 1, backgroundColor: C.green }} />
    </View>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  error,
  ...props
}: { label: string; hint?: string; error?: string } & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
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
          style={f.input}
          placeholderTextColor={C.textMuted}
          onFocus={onFocus}
          onBlur={onBlur}
          {...props}
        />
      </Animated.View>
      {error  ? <Text style={f.error}>{error}</Text> : null}
      {hint && !error ? <Text style={f.hint}>{hint}</Text> : null}
    </View>
  );
}
const f = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: C.textLabel, marginBottom: 6, letterSpacing: 0.2 },
  box:   { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, height: 48, justifyContent: 'center' },
  input: { fontSize: 14, color: C.textPrimary, fontWeight: '500' },
  error: { marginTop: 4, fontSize: 11, color: C.error },
  hint:  { marginTop: 4, fontSize: 11, color: C.textMuted },
});

// ─── Button ───────────────────────────────────────────────────────────────────
function Btn({
  label, onPress, loading, variant = 'saffron',
}: { label: string; onPress: () => void; loading?: boolean; variant?: 'saffron' | 'green' }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pi = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 40 }).start();
  const po = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 40 }).start();
  const bg  = variant === 'green' ? C.green : C.saffron;

  return (
    <TouchableOpacity onPress={onPress} onPressIn={pi} onPressOut={po} activeOpacity={1} disabled={loading}>
      <Animated.View style={[b.base, { backgroundColor: bg, transform: [{ scale }] }]}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={b.label}>{label}</Text>
        }
      </Animated.View>
    </TouchableOpacity>
  );
}
const b = StyleSheet.create({
  base:  { height: 50, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 0.4 },
});

// ─── Step Indicator ───────────────────────────────────────────────────────────
function Steps({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            height: 4, borderRadius: 2,
            width: i + 1 === step ? 28 : 16,
            backgroundColor: i + 1 <= step ? (i + 1 === total && step === total ? C.green : C.saffron) : C.border,
          }}
        />
      ))}
    </View>
  );
}

// ─── Thin Divider with Label ──────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
      <Text style={{ fontSize: 10.5, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SignupScreen() {
  const router = useRouter();
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [empID,       setEmpID]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [otp,         setOtp]         = useState('');

  const [signupLoading, setSignupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [message,  setMessage]  = useState('');
  const [isError,  setIsError]  = useState(false);
  const [otpSent,  setOtpSent]  = useState(false);

  const fade    = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(20)).current;
  const otpFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,   { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (otpSent) Animated.timing(otpFade, { toValue: 1, duration: 360, useNativeDriver: true }).start();
  }, [otpSent]);

  const isPasswordMismatch = useMemo(
    () => confirmPass.length > 0 && password !== confirmPass,
    [password, confirmPass],
  );

  const handleSignup = async () => {
    setMessage('');
    if (isPasswordMismatch) { setMessage('Passwords do not match'); setIsError(true); return; }
    setSignupLoading(true);
    try {
      const data = await signupCitizen({
        name: name.trim(), email: email.trim(), empID: empID.trim(),
        password, confirmPass, role: 'CITIZEN',
      });
      setOtpSent(true); setIsError(false);
      setMessage(data?.message ?? 'OTP sent to your email address');
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : 'Signup failed. Please try again.');
    } finally { setSignupLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setVerifyLoading(true); setMessage('');
    try {
      const data = await verifyCitizenOtp({ email: email.trim(), otp: otp.trim(), role: 'CITIZEN' });
      if (data?.token) {
        setAuthToken(data.token);
      }
      setIsError(false);
      setMessage(data?.message ?? 'Account activated. You may now sign in.');
      router.replace('/(tabs)/home');
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : 'OTP verification failed');
    } finally { setVerifyLoading(false); }
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

          {/* Top tricolor stripe */}
          <TriBar />

          {/* ── Government Header ── */}
          <Animated.View style={[s.header, { opacity: fade, transform: [{ translateY: slideY }] }]}>
            <View style={s.emblemRow}>
              {/* Emblem badge */}
              <View style={s.badge}>
                <View style={s.badgeInner}>
                  <Text style={{ fontSize: 20 }}>🏛</Text>
                </View>
              </View>

              {/* Gov title */}
              <View style={{ flex: 1 }}>
                <Text style={s.govMicro}>भारत सरकार  ·  Government of India</Text>
                <Text style={s.appName}>Lok Mitra</Text>
                <Text style={s.appSub}>Citizen Services Portal</Text>
              </View>
            </View>

            {/* Tricolor accent rule */}
            <View style={s.triRule}>
              <View style={{ flex: 3, backgroundColor: C.saffron, height: 3, borderRadius: 2 }} />
              <View style={{ flex: 1, backgroundColor: C.chakraBlue, height: 3, borderRadius: 2 }} />
              <View style={{ flex: 3, backgroundColor: C.green, height: 3, borderRadius: 2 }} />
            </View>
          </Animated.View>

          {/* ── Form Card ── */}
          <Animated.View style={[s.card, { opacity: fade, transform: [{ translateY: slideY }] }]}>

            {/* Saffron top border */}
            <View style={{ height: 3, backgroundColor: C.saffron }} />

            <View style={s.cardBody}>
              {/* Card title row */}
              <View style={s.cardTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>
                    {otpSent ? 'Verify Your Identity' : 'Create Citizen Account'}
                  </Text>
                  <Text style={s.cardSub}>
                    {otpSent ? `OTP dispatched to ${email}` : 'OTP verification required for activation'}
                  </Text>
                </View>
                <Steps step={otpSent ? 2 : 1} total={2} />
              </View>

              <View style={s.hairline} />

              {/* ── Step 1 ── */}
              {!otpSent && (
                <>
                  <Field
                    label="Full Name"
                    placeholder="As per official documents"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                  <Field
                    label="Email Address"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Field
                    label="Adhaar Number"
                    placeholder="Your official ID number"
                    value={empID}
                    onChangeText={setEmpID}
                    autoCapitalize="characters"
                    hint="As printed on your government-issued ID card"
                  />

                  <SectionDivider label="Password" />

                  <Field
                    label="Password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <Field
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    value={confirmPass}
                    onChangeText={setConfirmPass}
                    secureTextEntry
                    error={isPasswordMismatch ? 'Passwords do not match' : undefined}
                  />

                  <View style={{ marginTop: 10 }}>
                    <Btn label="Create Account & Send OTP" onPress={handleSignup} loading={signupLoading} variant="saffron" />
                  </View>
                </>
              )}

              {/* ── Step 2: OTP ── */}
              {otpSent && (
                <Animated.View style={{ opacity: otpFade }}>
                  {/* OTP notice */}
                  <View style={s.otpNotice}>
                    <View style={s.otpIconBox}>
                      <Text style={{ fontSize: 18 }}>✉️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.otpNoticeTitle}>OTP Sent Successfully</Text>
                      <Text style={s.otpNoticeSub}>
                        Enter the 6-digit code sent to your inbox. Valid for 10 minutes.
                      </Text>
                    </View>
                  </View>

                  <Field
                    label="One-Time Password"
                    placeholder="_ _ _ _ _ _"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <View style={{ marginTop: 10 }}>
                    <Btn label="Verify & Activate Account" onPress={handleVerifyOtp} loading={verifyLoading} variant="green" />
                  </View>

                  <TouchableOpacity style={s.backBtn} onPress={() => { setOtpSent(false); setMessage(''); }}>
                    <Text style={s.backBtnText}>← Edit registration details</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* ── Message ── */}
              {message ? (
                <View style={[s.msgBox, isError ? s.msgBoxErr : s.msgBoxOk]}>
                  <View style={[s.msgDot, { backgroundColor: isError ? C.error : C.green }]} />
                  <Text style={[s.msgText, { color: isError ? C.error : C.green }]}>{message}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* ── Footer ── */}
          <Animated.View style={[s.footer, { opacity: fade }]}>
            <Text style={s.footerTxt}>Already registered?</Text>
            <Link href="/auth/login" style={s.footerLink}>Sign In →</Link>

            <View style={s.disclaimer}>
              <Text style={s.disclaimerTxt}>
                🔒 Your information is protected under the{'\n'}
                Digital Personal Data Protection Act, 2023
              </Text>
            </View>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Main Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bgPage },
  scroll: { paddingBottom: 48 },

  // Header
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
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: C.saffronBorder,
    backgroundColor: C.saffronLight,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeInner: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1, borderColor: C.saffronMid,
    alignItems: 'center', justifyContent: 'center',
  },
  govMicro: {
    fontSize: 9, color: C.textMuted, fontWeight: '600',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2,
  },
  appName: { fontSize: 24, fontWeight: '800', color: C.textPrimary, letterSpacing: 0.2 },
  appSub:  { fontSize: 11, color: C.textSecondary, letterSpacing: 0.4, marginTop: 1 },
  triRule: { flexDirection: 'row', gap: 3 },

  // Card
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
  cardBody:     { padding: 20 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.1 },
  cardSub:      { fontSize: 11.5, color: C.textMuted, marginTop: 2, maxWidth: 200 },
  hairline:     { height: 1, backgroundColor: C.border, marginBottom: 18 },

  // OTP
  otpNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.greenBorder,
    borderRadius: 10, padding: 13, marginBottom: 18,
  },
  otpIconBox: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.greenMid,
    alignItems: 'center', justifyContent: 'center',
  },
  otpNoticeTitle: { fontSize: 13, fontWeight: '700', color: C.green, marginBottom: 3 },
  otpNoticeSub:   { fontSize: 11, color: C.textSecondary, lineHeight: 15 },

  backBtn:     { marginTop: 14, alignItems: 'center' },
  backBtnText: { fontSize: 12, color: C.textMuted, fontWeight: '500' },

  // Message
  msgBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: 16, padding: 11, borderRadius: 8, borderWidth: 1,
  },
  msgBoxErr: { backgroundColor: C.errorBg, borderColor: '#FFCCCC' },
  msgBoxOk:  { backgroundColor: C.successBg, borderColor: C.greenBorder },
  msgDot:    { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  msgText:   { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 17 },

  // Footer
  footer: {
    marginTop: 22, alignItems: 'center',
    gap: 5, paddingHorizontal: 24,
  },
  footerTxt:  { fontSize: 13, color: C.textMuted },
  footerLink: { fontSize: 13, fontWeight: '700', color: C.saffron, letterSpacing: 0.2 },
  disclaimer: {
    marginTop: 14,
    backgroundColor: C.white,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, width: '100%',
  },
  disclaimerTxt: {
    fontSize: 10.5, color: C.textMuted, textAlign: 'center', lineHeight: 16,
  },
});