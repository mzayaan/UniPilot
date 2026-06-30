import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Switch, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Colors, Typography, Spacing, BorderRadius } from '../src/lib/theme';
import { Card } from '../src/components/ui/Card';
import { useTheme } from '../src/context/ThemeContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, mode, setMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  async function checkNotificationPermission() {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  }

  async function toggleNotifications(value: boolean) {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotificationsEnabled(true);
        scheduleDeadlineReminders();
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.'
        );
      }
    } else {
      setNotificationsEnabled(false);
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }

  async function scheduleDeadlineReminders() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 UniPilot Study Reminder',
        body: "Don't forget to check your tasks and deadlines today!",
        sound: true,
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <Card style={styles.section} padding={false}>
          {[
            { label: 'System Default', value: 'system' },
            { label: 'Light Mode', value: 'light' },
            { label: 'Dark Mode', value: 'dark' },
          ].map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.row, { borderBottomColor: colors.divider }]}
              onPress={() => setMode(opt.value as any)}
            >
              <Text style={[styles.rowLabel, { color: colors.text }]}>{opt.label}</Text>
              {mode === opt.value && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </Card>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
        <Card style={styles.section} padding={false}>
          <View style={[styles.row, { borderBottomColor: colors.divider }]}>
            <View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Enable Notifications</Text>
              <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>Get reminders and alerts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: Colors.primary + '80' }}
              thumbColor={notificationsEnabled ? Colors.primary : colors.textTertiary}
            />
          </View>
          <View style={[styles.row, { borderBottomColor: colors.divider }]}>
            <View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Deadline Reminders</Text>
              <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>Alert before tasks are due</Text>
            </View>
            <Switch
              value={deadlineReminders && notificationsEnabled}
              onValueChange={setDeadlineReminders}
              disabled={!notificationsEnabled}
              trackColor={{ false: colors.border, true: Colors.primary + '80' }}
              thumbColor={deadlineReminders && notificationsEnabled ? Colors.primary : colors.textTertiary}
            />
          </View>
          <View style={styles.row}>
            <View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Daily Study Reminder</Text>
              <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>Morning reminder at 9:00 AM</Text>
            </View>
            <Switch
              value={studyReminders && notificationsEnabled}
              onValueChange={setStudyReminders}
              disabled={!notificationsEnabled}
              trackColor={{ false: colors.border, true: Colors.primary + '80' }}
              thumbColor={studyReminders && notificationsEnabled ? Colors.primary : colors.textTertiary}
            />
          </View>
        </Card>

        {/* About */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ABOUT</Text>
        <Card style={styles.section} padding={false}>
          <View style={[styles.row, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>App Version</Text>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>1.0.0 (MVP)</Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Built With</Text>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>Expo + Supabase</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>AI Powered By</Text>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>Gemini (Google)</Text>
          </View>
        </Card>

        <Text style={[styles.footer, { color: colors.textTertiary }]}>
          UniPilot — Your personal university autopilot 🎓{'\n'}
          Know what to do next.
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1 },
  title: { fontSize: Typography.md, fontWeight: Typography.bold },
  content: { padding: Spacing.base, gap: Spacing.sm },
  sectionLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 1, paddingLeft: 4, marginTop: Spacing.sm },
  section: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  rowLabel: { fontSize: Typography.base, fontWeight: Typography.medium },
  rowSubtext: { fontSize: Typography.xs, marginTop: 2 },
  rowValue: { fontSize: Typography.sm },
  footer: { fontSize: Typography.xs, textAlign: 'center', lineHeight: 20, marginTop: Spacing.xl },
});
