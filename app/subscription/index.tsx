import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../src/lib/theme';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { getOfferings, purchasePackage, restorePurchases } from '../../src/lib/purchases';

// ── Static plan display data ──────────────────────────────────────────────────
const PLAN_DISPLAY = [
  {
    id: 'free',
    name: 'Free',
    price: 'Rs 0',
    period: 'forever',
    color: '#9CA3AF',
    features: [
      '3 modules',
      '10 active tasks',
      'Basic timetable',
      'Basic grade calculator',
      'Basic dashboard',
      '3 AI summaries/month',
    ],
    missing: ['AI quizzes & flashcards', 'Budget tracker', 'File upload', 'Group projects'],
  },
  {
    id: 'pro_monthly',
    rcId: 'pro_monthly',
    name: 'Pro',
    price: 'Rs 199',
    period: 'per month',
    color: Colors.primary,
    badge: 'POPULAR',
    entitlement: 'pro_access',
    features: [
      'Unlimited modules',
      'Unlimited tasks',
      'Advanced priority engine',
      '100 AI summaries/month',
      'AI quizzes & flashcards',
      'AI study plan generator',
      'Budget tracker',
      'File upload',
      'Priority notifications',
    ],
    missing: ['Group projects', 'CV builder'],
  },
  {
    id: 'pro_plus_monthly',
    rcId: 'pro_plus_monthly',
    name: 'Pro+',
    price: 'Rs 299',
    period: 'per month',
    color: Colors.secondary,
    badge: 'EVERYTHING',
    entitlement: 'pro_plus_access',
    features: [
      'Everything in Pro',
      '300 AI summaries/month',
      'Group project workspace',
      'Shared task boards',
      'Internship tracker',
      'CV builder',
      'AI presentation planner',
      'Advanced analytics',
      'PDF export',
    ],
    missing: [],
  },
];

const YEARLY_DISCOUNT = { pro_monthly: { id: 'pro_yearly', label: 'Rs 2,149 / year', saving: 'Save Rs 239' }, pro_plus_monthly: { id: 'pro_plus_yearly', label: 'Rs 3,229 / year', saving: 'Save Rs 359' } } as Record<string, { id: string; label: string; saving: string }>;

export default function SubscriptionScreen() {
  const router = useRouter();
  const { subscription, user, refreshSubscription } = useAuth();
  const { colors } = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [offeringsLoading, setOfferingsLoading] = useState(true);

  const currentPlan = subscription?.plan_name ?? 'free';

  useEffect(() => {
    loadOfferings();
  }, []);

  async function loadOfferings() {
    setOfferingsLoading(true);
    const offerings = await getOfferings();
    setOffering(offerings?.current ?? null);
    setOfferingsLoading(false);
  }

  function findPackage(productId: string): PurchasesPackage | undefined {
    return offering?.availablePackages.find(
      p => p.product.identifier === productId
    );
  }

  async function handleSubscribe(planId: string) {
    if (!user) return;

    const effectiveId = billingCycle === 'yearly' && YEARLY_DISCOUNT[planId]
      ? YEARLY_DISCOUNT[planId].id
      : planId;

    const pkg = findPackage(effectiveId);

    if (!pkg) {
      // Offering not loaded yet or not configured in RC dashboard
      Alert.alert(
        'Not Available',
        'This plan is not yet available in your region. Please check back soon.',
      );
      return;
    }

    setPurchasing(planId);
    const { success, error } = await purchasePackage(pkg, user.id);
    setPurchasing(null);

    if (success) {
      await refreshSubscription();
      Alert.alert('Welcome to UniPilot Pro! 🎉', 'Your subscription is now active.');
      router.back();
    } else if (error && error !== 'cancelled') {
      Alert.alert('Purchase Failed', error);
    }
  }

  async function handleRestore() {
    if (!user) return;
    setRestoring(true);
    const { success, error } = await restorePurchases(user.id);
    setRestoring(false);

    if (success) {
      await refreshSubscription();
      const newPlan = subscription?.plan_name ?? 'free';
      if (newPlan !== 'free') {
        Alert.alert('Restored!', 'Your previous purchase has been restored.');
      } else {
        Alert.alert('No Active Subscription', 'No previous purchase found for this account.');
      }
    } else {
      Alert.alert('Restore Failed', error ?? 'Could not restore purchases.');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Choose Your Plan</Text>
        <TouchableOpacity onPress={handleRestore} disabled={restoring}>
          {restoring
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={styles.restoreText}>Restore</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.heroText, { color: colors.text }]}>
          Unlock your full academic potential 🚀
        </Text>

        {/* Billing toggle */}
        <View style={[styles.toggleWrapper, { backgroundColor: colors.input }]}>
          {(['monthly', 'yearly'] as const).map(cycle => (
            <TouchableOpacity
              key={cycle}
              style={[styles.toggleBtn, billingCycle === cycle && { backgroundColor: Colors.primary }]}
              onPress={() => setBillingCycle(cycle)}
            >
              <Text style={[styles.toggleText, { color: billingCycle === cycle ? '#fff' : colors.textSecondary }]}>
                {cycle === 'monthly' ? 'Monthly' : 'Yearly (Save 10%)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {offeringsLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading plans…</Text>
          </View>
        )}

        {/* Plan cards */}
        {PLAN_DISPLAY.map(plan => {
          const yearly = plan.rcId ? YEARLY_DISCOUNT[plan.rcId] : undefined;
          const displayPrice = billingCycle === 'yearly' && yearly ? yearly.label : plan.price;
          const displayPeriod = billingCycle === 'yearly' && yearly ? '' : plan.period;
          const isFree = plan.id === 'free';
          const isCurrentPlan =
            currentPlan === plan.id ||
            (currentPlan === 'pro' && plan.id === 'pro_monthly') ||
            (currentPlan === 'pro_plus' && plan.id === 'pro_plus_monthly');

          return (
            <Card key={plan.id} style={styles.planCard} padding={false}>
              {/* Card header */}
              <View style={[styles.planHeader, { backgroundColor: plan.color }]}>
                <View style={styles.planHeaderLeft}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.badge && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.planPrice}>{displayPrice}</Text>
                  {!!displayPeriod && <Text style={styles.planPeriod}>{displayPeriod}</Text>}
                </View>
              </View>

              {billingCycle === 'yearly' && yearly && (
                <View style={[styles.savingBadge, { backgroundColor: Colors.success + '20' }]}>
                  <Text style={[styles.savingText, { color: Colors.success }]}>{yearly.saving} vs monthly</Text>
                </View>
              )}

              {/* Features */}
              <View style={styles.featuresSection}>
                {plan.features.map(f => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                    <Text style={[styles.featureText, { color: colors.text }]}>{f}</Text>
                  </View>
                ))}
                {plan.missing.map(f => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                    <Text style={[styles.missingText, { color: colors.textTertiary }]}>{f}</Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              {!isFree && (
                <View style={styles.ctaSection}>
                  {isCurrentPlan ? (
                    <View style={[styles.currentBadge, { backgroundColor: Colors.success + '20' }]}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                      <Text style={[styles.currentText, { color: Colors.success }]}>Current Plan</Text>
                    </View>
                  ) : (
                    <Button
                      title={purchasing === plan.id ? 'Processing…' : `Get ${plan.name}`}
                      onPress={() => handleSubscribe(plan.id)}
                      loading={purchasing === plan.id}
                      disabled={!!purchasing || restoring}
                      style={{ backgroundColor: plan.color }}
                      fullWidth
                    />
                  )}
                </View>
              )}
            </Card>
          );
        })}

        <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
          Subscriptions are billed through Google Play. Cancel anytime in the Play Store.
          Prices shown in Mauritian Rupees (MUR).
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
  restoreText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.medium },
  content: { padding: Spacing.base, gap: Spacing.base },
  heroText: { fontSize: Typography.lg, fontWeight: Typography.bold, textAlign: 'center', marginBottom: Spacing.sm },
  toggleWrapper: { flexDirection: 'row', borderRadius: BorderRadius.lg, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center' },
  toggleText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md },
  loadingText: { fontSize: Typography.sm },
  planCard: { overflow: 'hidden' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  planHeaderLeft: { gap: 4 },
  planName: { color: '#fff', fontSize: Typography.lg, fontWeight: Typography.bold },
  planBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  planBadgeText: { color: '#fff', fontSize: 9, fontWeight: Typography.bold },
  planPrice: { color: '#fff', fontSize: Typography['2xl'], fontWeight: Typography.extrabold },
  planPeriod: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.xs },
  savingBadge: { paddingHorizontal: Spacing.base, paddingVertical: 6, alignItems: 'center' },
  savingText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  featuresSection: { padding: Spacing.base, gap: Spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureText: { fontSize: Typography.sm, flex: 1 },
  missingText: { fontSize: Typography.sm, flex: 1, textDecorationLine: 'line-through' },
  ctaSection: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  currentBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg, justifyContent: 'center' },
  currentText: { fontSize: Typography.base, fontWeight: Typography.semibold },
  disclaimer: { fontSize: Typography.xs, textAlign: 'center', lineHeight: 18 },
});
