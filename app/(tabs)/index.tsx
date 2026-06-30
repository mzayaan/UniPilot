import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  SafeAreaView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useModules } from '../../src/hooks/useModules';
import { useTasks } from '../../src/hooks/useTasks';
import { getTopRecommendation } from '../../src/lib/priority-engine';
import { priorityColors, statusColors } from '../../src/lib/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, subscription } = useAuth();
  const { colors } = useTheme();
  const { modules, loading: modLoading, refetch: refetchMods } = useModules();
  const { tasks, loading: taskLoading, refetch: refetchTasks } = useTasks();
  const [refreshing, setRefreshing] = useState(false);

  const loading = modLoading || taskLoading;

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([refetchMods(), refetchTasks()]);
    setRefreshing(false);
  }

  const recommendation = getTopRecommendation(tasks, modules);
  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile?.full_name?.split(' ')[0] ?? 'Student';

  const upcomingTasks = tasks
    .filter(t => t.due_date && t.status !== 'Completed')
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 4);

  const overdueTasks = tasks.filter(t => t.status === 'Overdue');
  const atRiskModules = modules.filter(m => m.current_mark !== null && m.current_mark < m.target_mark);

  function formatDue(dateStr: string) {
    const due = new Date(dateStr);
    const diff = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `Due in ${diff} days`;
  }

  if (loading) return <LoadingSpinner fullScreen message="Loading your dashboard..." />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting},</Text>
            <Text style={[styles.name, { color: colors.text }]}>{name} 👋</Text>
          </View>
          <TouchableOpacity
            style={[styles.aiBtn, { backgroundColor: Colors.primary }]}
            onPress={() => router.push('/ai')}
          >
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.aiBtnText}>AI Coach</Text>
          </TouchableOpacity>
        </View>

        {/* What Should I Do Now */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => recommendation.task && router.push(`/tasks/${recommendation.task.id}`)}
        >
          <View style={styles.priorityCard}>
            <View style={styles.priorityHeader}>
              <Text style={styles.priorityEmoji}>🧭</Text>
              <Text style={styles.priorityTitle}>What Should I Do Now?</Text>
            </View>
            <Text style={styles.priorityMessage}>{recommendation.message}</Text>
            {recommendation.task && (
              <View style={styles.priorityFooter}>
                <Text style={styles.priorityTime}>⏱ {recommendation.suggestedMinutes} min session</Text>
                <Text style={styles.priorityArrow}>Start →</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Overdue Warning */}
        {overdueTasks.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
            <View style={styles.overdueAlert}>
              <Ionicons name="warning" size={18} color={Colors.danger} />
              <Text style={styles.overdueText}>
                {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} — tap to view
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Modules', value: modules.length, icon: 'book-outline', color: Colors.primary },
            { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'Completed').length, icon: 'list-outline', color: Colors.warning },
            { label: 'Completed', value: tasks.filter(t => t.status === 'Completed').length, icon: 'checkmark-circle-outline', color: Colors.success },
          ].map(stat => (
            <Card key={stat.label} style={styles.statCard} padding={false}>
              <View style={[styles.statCardInner, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Quick Tools */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Tools</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity
              style={[styles.toolCard, { backgroundColor: Colors.primary + '12', borderColor: Colors.primary + '30' }]}
              onPress={() => router.push('/calendar')}
            >
              <Ionicons name="calendar" size={26} color={Colors.primary} />
              <Text style={[styles.toolLabel, { color: Colors.primary }]}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolCard, { backgroundColor: '#43E97B12', borderColor: '#43E97B30' }]}
              onPress={() => router.push('/budget')}
            >
              <Ionicons name="wallet-outline" size={26} color="#2ECC71" />
              <Text style={[styles.toolLabel, { color: '#2ECC71' }]}>Budget</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolCard, { backgroundColor: '#6C5CE712', borderColor: '#6C5CE730' }]}
              onPress={() => router.push('/group-projects')}
            >
              <Ionicons name="people-outline" size={26} color="#6C5CE7" />
              <Text style={[styles.toolLabel, { color: '#6C5CE7' }]}>Projects</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolCard, { backgroundColor: '#FFB34712', borderColor: '#FFB34730' }]}
              onPress={() => router.push('/ai')}
            >
              <Ionicons name="sparkles" size={26} color="#FF8C00" />
              <Text style={[styles.toolLabel, { color: '#FF8C00' }]}>AI Coach</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Deadlines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Deadlines</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
              <Text style={{ color: Colors.primary, fontSize: Typography.sm }}>See all</Text>
            </TouchableOpacity>
          </View>
          {upcomingTasks.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No upcoming deadlines 🎉</Text>
            </Card>
          ) : upcomingTasks.map(task => (
            <TouchableOpacity key={task.id} onPress={() => router.push(`/tasks/${task.id}`)}>
              <Card style={styles.taskCard}>
                <View style={styles.taskCardInner}>
                  <View style={[styles.taskDot, { backgroundColor: task.module?.color ?? Colors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>{task.title}</Text>
                    <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>
                      {task.module?.module_name ?? 'Personal'} • {formatDue(task.due_date!)}
                    </Text>
                  </View>
                  <Badge label={task.priority} color={priorityColors[task.priority]} small />
                </View>
                {task.progress > 0 && (
                  <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, {
                      width: `${task.progress}%`,
                      backgroundColor: task.module?.color ?? Colors.primary,
                    }]} />
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Modules At Risk */}
        {atRiskModules.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Grade Risk</Text>
            {atRiskModules.map(m => (
              <TouchableOpacity key={m.id} onPress={() => router.push(`/grades/${m.id}`)}>
                <Card style={styles.riskCard}>
                  <View style={styles.riskInner}>
                    <View style={[styles.riskDot, { backgroundColor: m.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskTitle, { color: colors.text }]}>{m.module_name}</Text>
                      <Text style={[styles.taskMeta, { color: Colors.danger }]}>
                        {m.current_mark}% / {m.target_mark}% target — {(m.target_mark - (m.current_mark ?? 0)).toFixed(1)}% gap
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pro Upgrade Banner */}
        {subscription?.plan_name === 'free' && (
          <TouchableOpacity onPress={() => router.push('/subscription')}>
            <View style={styles.proBanner}>
              <Text style={styles.proText}>✨ Upgrade to Pro for unlimited modules, AI quizzes & more</Text>
              <Text style={styles.proArrow}>Upgrade →</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.base, gap: Spacing.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  greeting: { fontSize: Typography.sm },
  name: { fontSize: Typography.xl, fontWeight: Typography.bold },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  aiBtnText: { color: '#fff', fontWeight: Typography.semibold, fontSize: Typography.sm },

  priorityCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  priorityHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  priorityEmoji: { fontSize: 22 },
  priorityTitle: { color: '#fff', fontWeight: Typography.bold, fontSize: Typography.md },
  priorityMessage: { color: 'rgba(255,255,255,0.9)', fontSize: Typography.base, lineHeight: 22 },
  priorityFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  priorityTime: { color: 'rgba(255,255,255,0.75)', fontSize: Typography.sm },
  priorityArrow: { color: '#fff', fontWeight: Typography.bold, fontSize: Typography.sm },

  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.danger + '15',
    borderColor: Colors.danger + '40',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  overdueText: { color: Colors.danger, fontSize: Typography.sm, fontWeight: Typography.medium },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1 },
  statCardInner: { alignItems: 'center', padding: Spacing.md, gap: 4, borderRadius: BorderRadius.xl },

  statValue: { fontSize: Typography.xl, fontWeight: Typography.bold },
  statLabel: { fontSize: Typography.xs },

  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.bold },
  emptyCard: { padding: Spacing.lg },

  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  toolCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  toolLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },

  taskCard: { marginBottom: 0 },
  taskCardInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  taskDot: { width: 10, height: 10, borderRadius: 5 },
  taskTitle: { fontSize: Typography.base, fontWeight: Typography.medium },
  taskMeta: { fontSize: Typography.xs, marginTop: 2 },
  progressTrack: { height: 3, borderRadius: 2, marginTop: Spacing.sm, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  riskCard: { marginBottom: 0 },
  riskInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  riskDot: { width: 12, height: 12, borderRadius: 6 },

  proBanner: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary + '40',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  proText: { color: Colors.primary, fontWeight: Typography.medium, fontSize: Typography.sm },
  proArrow: { color: Colors.primary, fontWeight: Typography.bold, fontSize: Typography.sm },
});
