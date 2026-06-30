import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, priorityColors, statusColors } from '../../src/lib/theme';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useTasks } from '../../src/hooks/useTasks';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { TaskStatus, PLAN_LIMITS } from '../../src/types';

const FILTERS: { label: string; value: TaskStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Active', value: 'Not Started' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Overdue', value: 'Overdue' },
  { label: 'Done', value: 'Completed' },
];

export default function TasksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { tasks, loading, refetch, updateProgress } = useTasks();
  const { subscription } = useAuth();
  const plan = subscription?.plan_name ?? 'free';
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.maxTasks ?? 10;
  const activeTasks = tasks.filter(t => t.status !== 'Completed');
  const canAdd = activeTasks.length < limit;
  const [filter, setFilter] = useState<TaskStatus | 'All'>('All');
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);

  function formatDue(dateStr: string | null) {
    if (!dateStr) return 'No deadline';
    const due = new Date(dateStr);
    const diff = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `Due ${due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Tasks</Text>
          {limit !== Infinity && (
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              {activeTasks.length}/{limit} active
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: Colors.primary }]}
          onPress={() => {
            if (!canAdd) {
              const { Alert } = require('react-native');
              Alert.alert(
                'Task Limit Reached',
                `Free plan allows up to ${limit} active tasks. Upgrade to Pro for unlimited tasks.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Upgrade', onPress: () => router.push('/subscription') },
                ]
              );
              return;
            }
            router.push('/tasks/add');
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              { borderColor: filter === f.value ? Colors.primary : colors.border },
              filter === f.value && { backgroundColor: Colors.primary },
            ]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[
              styles.filterText,
              { color: filter === f.value ? '#fff' : colors.textSecondary },
            ]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title={filter === 'All' ? 'No Tasks Yet' : `No ${filter} Tasks`}
            message={filter === 'All' ? 'Add your first task to start tracking your assignments.' : `You have no ${filter.toLowerCase()} tasks right now.`}
            actionLabel={filter === 'All' ? 'Add Task' : undefined}
            onAction={filter === 'All' ? () => {
              if (!canAdd) {
                const { Alert } = require('react-native');
                Alert.alert('Task Limit Reached', `Free plan allows up to ${limit} active tasks.`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Upgrade', onPress: () => router.push('/subscription') },
                ]);
                return;
              }
              router.push('/tasks/add');
            } : undefined}
          />
        ) : (
          filtered.map(task => (
            <TouchableOpacity
              key={task.id}
              activeOpacity={0.85}
              onPress={() => router.push(`/tasks/${task.id}`)}
            >
              <Card style={styles.taskCard}>
                {/* Header row */}
                <View style={styles.taskHeader}>
                  <TouchableOpacity
                    onPress={() => updateProgress(task.id, task.status === 'Completed' ? 0 : 100)}
                    style={styles.checkCircle}
                  >
                    <Ionicons
                      name={task.status === 'Completed' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={26}
                      color={task.status === 'Completed' ? Colors.success : colors.textTertiary}
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: colors.text },
                        task.status === 'Completed' && styles.completedTitle,
                      ]}
                      numberOfLines={2}
                    >
                      {task.title}
                    </Text>
                    <View style={styles.metaRow}>
                      {task.module && (
                        <View style={[styles.modulePill, { backgroundColor: task.module.color + '20' }]}>
                          <View style={[styles.moduleDot, { backgroundColor: task.module.color }]} />
                          <Text style={[styles.moduleText, { color: task.module.color }]} numberOfLines={1}>
                            {task.module.module_name}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.dueText, {
                        color: task.status === 'Overdue' ? Colors.danger : colors.textSecondary,
                      }]}>
                        {formatDue(task.due_date)}
                      </Text>
                    </View>
                  </View>
                  <Badge label={task.priority} color={priorityColors[task.priority]} small />
                </View>

                {/* Progress */}
                {task.progress > 0 && task.status !== 'Completed' && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressMeta}>
                      <Text style={[styles.progressText, { color: colors.textSecondary }]}>Progress</Text>
                      <Text style={[styles.progressText, { color: colors.text, fontWeight: Typography.semibold }]}>
                        {task.progress}%
                      </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressFill, {
                        width: `${task.progress}%`,
                        backgroundColor: task.module?.color ?? Colors.primary,
                      }]} />
                    </View>
                  </View>
                )}

                {/* Footer */}
                <View style={styles.taskFooter}>
                  <Badge label={task.status} color={statusColors[task.status]} small />
                  <Text style={[styles.estimateText, { color: colors.textTertiary }]}>
                    ~{task.estimated_minutes}min
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 24 }} />
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
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  filterRow: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  filterText: { fontSize: Typography.sm, fontWeight: Typography.medium },
  content: { padding: Spacing.base, gap: Spacing.sm },

  taskCard: { gap: Spacing.sm },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  checkCircle: { marginTop: 2 },
  taskTitle: { fontSize: Typography.base, fontWeight: Typography.medium, lineHeight: 22 },
  completedTitle: { textDecorationLine: 'line-through', opacity: 0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4, flexWrap: 'wrap' },
  modulePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  moduleDot: { width: 6, height: 6, borderRadius: 3 },
  moduleText: { fontSize: Typography.xs, fontWeight: Typography.medium },
  dueText: { fontSize: Typography.xs },

  progressSection: { gap: 6 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: Typography.xs },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estimateText: { fontSize: Typography.xs },
});
