import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useModules } from '../../src/hooks/useModules';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { PLAN_LIMITS } from '../../src/types';

export default function ModulesScreen() {
  const router = useRouter();
  const { subscription } = useAuth();
  const { colors } = useTheme();
  const { modules, loading, refetch, deleteModule } = useModules();
  const [refreshing, setRefreshing] = useState(false);

  const plan = subscription?.plan_name ?? 'free';
  const limit = PLAN_LIMITS[plan].maxModules;
  const canAdd = modules.length < limit;

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert(
      'Delete Module',
      `Delete "${name}"? All associated tasks and grades will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteModule(id);
          },
        },
      ]
    );
  }

  function getRiskLevel(m: any) {
    if (m.current_mark === null) return null;
    const gap = m.target_mark - m.current_mark;
    if (gap > 20) return { label: 'High Risk', color: Colors.danger };
    if (gap > 10) return { label: 'At Risk', color: Colors.warning };
    if (gap > 0) return { label: 'On Track', color: Colors.info };
    return { label: 'Above Target', color: Colors.success };
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Modules</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {modules.length}{limit !== Infinity ? `/${limit}` : ''} modules
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: canAdd ? Colors.primary : colors.border },
          ]}
          onPress={() => {
            if (!canAdd) {
              Alert.alert(
                'Module Limit Reached',
                `Upgrade to Pro to add unlimited modules.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Upgrade', onPress: () => router.push('/subscription') },
                ]
              );
              return;
            }
            router.push('/modules/add');
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {modules.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="No Modules Yet"
            message="Add your first module to start tracking your assignments, grades, and progress."
            actionLabel="Add Module"
            onAction={() => router.push('/modules/add')}
          />
        ) : (
          modules.map(m => {
            const risk = getRiskLevel(m);
            const pct = m.current_mark !== null
              ? Math.min(100, (m.current_mark / m.target_mark) * 100)
              : 0;

            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.85}
                onPress={() => router.push(`/modules/${m.id}`)}
              >
                <Card style={styles.moduleCard}>
                  <View style={styles.moduleHeader}>
                    <View style={[styles.colorDot, { backgroundColor: m.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.moduleName, { color: colors.text }]} numberOfLines={1}>
                        {m.module_name}
                      </Text>
                      {m.lecturer_name && (
                        <Text style={[styles.lecturerName, { color: colors.textSecondary }]} numberOfLines={1}>
                          {m.lecturer_name}
                        </Text>
                      )}
                    </View>
                    <View style={styles.moduleActions}>
                      {risk && <Badge label={risk.label} color={risk.color} small />}
                      <TouchableOpacity
                        onPress={() => handleDelete(m.id, m.module_name)}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Marks */}
                  <View style={styles.marksRow}>
                    <View style={styles.markItem}>
                      <Text style={[styles.markValue, { color: m.color }]}>
                        {m.current_mark !== null ? `${m.current_mark}%` : '—'}
                      </Text>
                      <Text style={[styles.markLabel, { color: colors.textSecondary }]}>Current</Text>
                    </View>
                    <View style={styles.markDivider} />
                    <View style={styles.markItem}>
                      <Text style={[styles.markValue, { color: colors.text }]}>{m.target_mark}%</Text>
                      <Text style={[styles.markLabel, { color: colors.textSecondary }]}>Target</Text>
                    </View>
                    <View style={styles.markDivider} />
                    <View style={styles.markItem}>
                      <Text style={[styles.markValue, { color: colors.text }]}>{m.difficulty_level}/5</Text>
                      <Text style={[styles.markLabel, { color: colors.textSecondary }]}>Difficulty</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: m.color }]} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold },
  subtitle: { fontSize: Typography.sm, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base, gap: Spacing.sm },
  moduleCard: { gap: Spacing.md },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  moduleName: { fontSize: Typography.md, fontWeight: Typography.semibold },
  lecturerName: { fontSize: Typography.sm, marginTop: 2 },
  moduleActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  deleteBtn: { padding: 4 },
  marksRow: { flexDirection: 'row', alignItems: 'center' },
  markItem: { flex: 1, alignItems: 'center' },
  markValue: { fontSize: Typography.md, fontWeight: Typography.bold },
  markLabel: { fontSize: Typography.xs, marginTop: 2 },
  markDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});
