import React from 'react';
import {
  View, Text, StyleSheet, Image, SafeAreaView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🎓</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>UniPilot</Text>
          <Text style={[styles.tagline, { color: Colors.primary }]}>
            Know what to do next.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: '⏰', text: 'Never miss a deadline' },
            { icon: '📊', text: 'Track your grades & progress' },
            { icon: '🤖', text: 'AI-powered study coach' },
            { icon: '🧭', text: 'Smart priority engine' },
          ].map((f, i) => (
            <View key={i} style={[styles.featureRow, { backgroundColor: colors.surface }]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
            size="lg"
          />
          <Button
            title="I already have an account"
            onPress={() => router.push('/(auth)/login')}
            variant="ghost"
            fullWidth
            style={styles.loginBtn}
          />
        </View>

        <Text style={[styles.terms, { color: colors.textTertiary }]}>
          By continuing, you agree to our Terms of Use and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'space-between',
    paddingVertical: Spacing['2xl'],
  },
  hero: { alignItems: 'center', paddingTop: Spacing['2xl'] },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoEmoji: { fontSize: 52 },
  appName: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.extrabold,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    marginTop: Spacing.xs,
  },
  features: { gap: Spacing.sm },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  featureIcon: { fontSize: 24 },
  featureText: { fontSize: Typography.base, fontWeight: Typography.medium },
  actions: { gap: Spacing.sm },
  loginBtn: { marginTop: -Spacing.xs },
  terms: { fontSize: Typography.xs, textAlign: 'center', lineHeight: 18 },
});
