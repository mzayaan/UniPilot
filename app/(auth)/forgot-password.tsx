import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/lib/theme';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/context/ThemeContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'unipilot://reset-password',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={{ color: Colors.primary, fontSize: Typography.base }}>← Back</Text>
        </TouchableOpacity>

        {sent ? (
          <View style={styles.center}>
            <Text style={styles.checkEmoji}>📧</Text>
            <Text style={[styles.title, { color: colors.text }]}>Check Your Email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We've sent a password reset link to {email}. Check your inbox and follow the instructions.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => router.replace('/(auth)/login')}
              fullWidth
              style={{ marginTop: Spacing.xl }}
            />
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email and we'll send you a reset link.
            </Text>
            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              leftIcon="mail-outline"
              autoCapitalize="none"
              placeholder="you@university.ac.uk"
            />
            <Button
              title="Send Reset Link"
              onPress={handleReset}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.md }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: Spacing['2xl'], flex: 1 },
  back: { marginBottom: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  checkEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  title: { fontSize: Typography['2xl'], fontWeight: Typography.bold, marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.base, marginBottom: Spacing['2xl'], lineHeight: 22, textAlign: 'center' },
});
