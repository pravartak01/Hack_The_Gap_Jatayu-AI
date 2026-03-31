import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getAuthUser } from '@/lib/authApi';

type ProfileState = {
  fullName: string;
  email: string;
  phone: string;
  ward: string;
  address: string;
};

type PreferenceState = {
  pushAlerts: boolean;
  updateDigests: boolean;
  emergencySms: boolean;
  anonymousMode: boolean;
};

const initialProfile: ProfileState = {
  fullName: 'Riya Patil',
  email: 'riya.patil@lokmitra.app',
  phone: '+91 98765 12048',
  ward: 'Ward 12 - CIDCO',
  address: 'Sambhaji Nagar Housing Society, Chhatrapati Sambhajinagar',
};

function buildProfileFromAuthUser() {
  const authUser = getAuthUser?.();
  if (!authUser) return initialProfile;

  return {
    fullName: authUser.name || initialProfile.fullName,
    email: authUser.email || initialProfile.email,
    phone: initialProfile.phone,
    ward: authUser.empID ? `Citizen ID: ${authUser.empID}` : initialProfile.ward,
    address: initialProfile.address,
  };
}

const initialPreferences: PreferenceState = {
  pushAlerts: true,
  updateDigests: true,
  emergencySms: false,
  anonymousMode: false,
};

const trustedContacts = [
  { id: 'c1', label: 'Emergency Helpline', value: '112' },
  { id: 'c2', label: 'Traffic Control Room', value: '+91 240 233 4455' },
  { id: 'c3', label: 'Municipal Quick Response', value: '+91 240 224 1199' },
];

const recentActivity = [
  { id: 'a1', title: 'Garbage complaint submitted', time: 'Today, 10:42 AM' },
  { id: 'a2', title: 'Profile details updated', time: 'Yesterday, 07:18 PM' },
  { id: 'a3', title: 'Subscribed to safety digest', time: 'Mon, 08:05 AM' },
];

export default function ProfileTabScreen() {
  const isFocused = useIsFocused();
  const [profile, setProfile] = useState<ProfileState>(() => buildProfileFromAuthUser());
  const [preferences, setPreferences] = useState(initialPreferences);
  const [statusText, setStatusText] = useState('Checking signed-in profile data...');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!isFocused) return;

    const authUser = getAuthUser?.();
    if (!authUser) {
      setStatusText('No active login session found. Showing local profile details.');
      return;
    }

    setProfile((prev) => ({
      ...prev,
      fullName: authUser.name || prev.fullName,
      email: authUser.email || prev.email,
      ward: authUser.empID ? `Citizen ID: ${authUser.empID}` : prev.ward,
    }));
    setStatusText(`Live profile synced for ${authUser.email || 'current user'}.`);
  }, [isFocused]);

  const initials = useMemo(() => {
    const parts = profile.fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'LM';
    return `${parts[0][0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }, [profile.fullName]);

  const updateProfileField = (field: keyof ProfileState, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const togglePreference = (field: keyof PreferenceState) => {
    setPreferences((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusText('Saving your profile settings...');
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSaving(false);
    setStatusText(`Saved successfully at ${new Date().toLocaleTimeString('en-IN')}`);
  };

  const handleReset = () => {
    setProfile(initialProfile);
    setPreferences(initialPreferences);
    setStatusText('Default profile settings restored.');
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Citizen Profile</Text>
          <Text style={styles.heroTitle}>Personal Control Hub</Text>
          <Text style={styles.heroSubtitle}>
            Keep your information accurate for faster issue resolution and emergency coordination.
          </Text>

          <View style={styles.identityRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.identityMeta}>
              <Text style={styles.nameText}>{profile.fullName}</Text>
              <Text style={styles.metaText}>{profile.ward}</Text>
              <View style={styles.verifiedChip}>
                <Text style={styles.verifiedChipText}>Verified Citizen Account</Text>
              </View>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>08</Text>
              <Text style={styles.kpiLabel}>Reports Submitted</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>05</Text>
              <Text style={styles.kpiLabel}>Resolved Cases</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>24h</Text>
              <Text style={styles.kpiLabel}>Avg Response</Text>
            </View>
          </View>
        </View>

        <Text style={styles.statusPill}>{statusText}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <Text style={styles.sectionHint}>These fields help departments identify and respond faster.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={profile.fullName}
              onChangeText={(value) => updateProfileField('fullName', value)}
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGrid}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={profile.email}
                onChangeText={(value) => updateProfileField('email', value)}
                style={styles.input}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                value={profile.phone}
                onChangeText={(value) => updateProfileField('phone', value)}
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="+91"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Ward / Zone</Text>
            <TextInput
              value={profile.ward}
              onChangeText={(value) => updateProfileField('ward', value)}
              style={styles.input}
              placeholder="Ward and locality"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              value={profile.address}
              onChangeText={(value) => updateProfileField('address', value)}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder="Street, area, landmark"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Text style={styles.sectionHint}>Control how you receive alerts and privacy-related updates.</Text>

          <PreferenceRow
            title="Push Notifications"
            subtitle="Instant updates for complaint and city alerts"
            value={preferences.pushAlerts}
            onToggle={() => togglePreference('pushAlerts')}
          />
          <PreferenceRow
            title="Daily Update Digest"
            subtitle="Summary of civic and emergency bulletins"
            value={preferences.updateDigests}
            onToggle={() => togglePreference('updateDigests')}
          />
          <PreferenceRow
            title="Emergency SMS Backup"
            subtitle="Fallback alerts when internet is unavailable"
            value={preferences.emergencySms}
            onToggle={() => togglePreference('emergencySms')}
          />
          <PreferenceRow
            title="Anonymous Report Mode"
            subtitle="Hide identity on publicly visible report timeline"
            value={preferences.anonymousMode}
            onToggle={() => togglePreference('anonymousMode')}
          />
        </View>

        <View style={styles.doubleGrid}>
          <View style={[styles.card, styles.smallCard]}>
            <Text style={styles.sectionTitle}>Trusted Contacts</Text>
            <Text style={styles.sectionHint}>Quick dial references for urgent action.</Text>

            {trustedContacts.map((contact) => (
              <View key={contact.id} style={styles.contactRow}>
                <Text style={styles.contactLabel}>{contact.label}</Text>
                <Text style={styles.contactValue}>{contact.value}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.card, styles.smallCard]}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.sectionHint}>Latest account and complaint interactions.</Text>

            {recentActivity.map((item) => (
              <View key={item.id} style={styles.activityRow}>
                <View style={styles.activityDot} />
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={handleReset}>
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.primaryButton, saving ? styles.primaryButtonDisabled : null]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PreferenceRow({
  title,
  subtitle,
  value,
  onToggle,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceMeta}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F1EC',
  },
  content: {
    padding: 20,
    paddingBottom: 34,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#1E293B',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroEyebrow: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    marginTop: 5,
    fontSize: 25,
    fontWeight: '800',
    color: '#111827',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  identityRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 12,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: '#E9D5FF',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6D28D9',
  },
  identityMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  metaText: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  verifiedChip: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedChipText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '700',
  },
  kpiRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  kpiLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  statusPill: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    color: '#5B21B6',
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '800',
  },
  sectionHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  fieldGroup: {
    marginTop: 12,
  },
  label: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    minHeight: 84,
  },
  fieldGrid: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  gridCol: {
    flex: 1,
  },
  preferenceRow: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  preferenceMeta: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },
  preferenceSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  doubleGrid: {
    marginTop: 0,
    flexDirection: 'row',
    gap: 10,
  },
  smallCard: {
    flex: 1,
  },
  contactRow: {
    marginTop: 9,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    padding: 10,
  },
  contactLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  contactValue: {
    marginTop: 4,
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  activityRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#2563EB',
    marginTop: 6,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },
  activityTime: {
    marginTop: 1,
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
