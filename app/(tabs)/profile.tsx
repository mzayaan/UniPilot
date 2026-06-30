import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, value, onPress, danger }: SettingRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.divider }]} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={[styles.rowLabel, { color: danger ? Colors.danger : colors.text }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, subscription, user, signOut } = useAuth();
  const { colors, isDark, mode, setMode } = useTheme();

  const planLabel = {
    free: 'Free Plan',
    pro: 'Pro',
    pro_plus: 'Pro+',
  }[subscription?.plan_name ?? 'free'];

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? '?';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar + info */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>
            {profile?.full_name ?? 'Student'}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
          <View style={[styles.planPill, { backgroundColor: Colors.primary + '20' }]}>
            <Text style={[styles.planText, { color: Colors.primary }]}>✨ {planLabel}</Text>
          </View>
        </View>

        {/* Profile info */}
        <Card style={styles.section} padding={false}>
          <SettingRow icon="🎓" label="University" value={profile?.university ?? 'Not set'} />
          <SettingRow icon="📚" label="Degree" value={profile?.degree ?? 'Not set'} />
          <SettingRow
            icon="🗓"
            label="Year of Study"
            value={profile?.year_of_study ? `Year ${profile.year_of_study}` : 'Not set'}
          />
          <SettingRow
            icon="🎯"
            label="Target Grade"
            value={profile?.target_grade ? `${profile.target_grade}%` : 'Not set'}
          />
        </Card>

        {/* Subscription */}
        {subscription?.plan_name === 'free' && (
          <TouchableOpacity onPress={() => router.push('/subscription')}>
            <View style={[styles.upgradeCard, { backgroundColor: Colors.primary }]}>
              <View>
                <Text style={styles.upgradeTitle}>Unlock UniPilot Pro</Text>
                <Text style={styles.upgradeSubtitle}>Unlimited modules, AI Coach, Budget tracker & more</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={32} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        {/* App Settings */}
        <Card style={styles.section} padding={false}>
          <SettingRow
            icon="🌙"
            label="Dark Mode"
            value={mode === 'system' ? 'System' : isDark ? 'On' : 'Off'}
            onPress={() => {
              const next = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';
              setMode(next);
            }}
          />
          <SettingRow
            icon="🔔"
            label="Notifications"
            onPress={() => router.push('/settings')}
          />
          <SettingRow
            icon="⚙️"
            label="Settings"
            onPress={() => router.push('/settings')}
          />
        </Card>

        {/* Legal */}
        <Card style={styles.section} padding={false}>
          <SettingRow icon="🔒" label="Privacy Policy" onPress={() => {}} />
          <SettingRow icon="📄" label="Terms of Use" onPress={() => {}} />
          <SettingRow icon="ℹ️" label="App Version" value="1.0.0" />
        </Card>

        {/* Sign out */}
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          fullWidth
          style={{ marginTop: Spacing.sm, borderColor: Colors.danger }}
          textStyle={{ color: Colors.danger }}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.base, gap: Spacing.base },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { color: '#fff', fontSize: Typography.xl, fontWeight: Typography.bold },
  name: { fontSize: Typography.lg, fontWeight: Typography.bold },
  email: { fontSize: Typography.sm },
  planPill: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  planText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  section: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowIcon: { fontSize: 20 },
  rowLabel: { fontSize: Typography.base, fontWeight: Typography.medium },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowValue: { fontSize: Typography.sm },
  upgradeCard: { borderRadius: BorderRadius.xl, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  upgradeTitle: { color: '#fff', fontSize: Typography.md, fontWeight: Typography.bold },
  upgradeSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: Typography.sm, marginTop: 2, maxWidth: 220 },
});
