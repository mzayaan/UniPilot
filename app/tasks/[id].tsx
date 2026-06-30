import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, priorityColors, statusColors } from '../../src/lib/theme';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useTasks } from '../../src/hooks/useTasks';
import { useTheme } from '../../src/context/ThemeContext';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { tasks, loading, updateTask, updateProgress, deleteTask } = useTasks();

  const task = tasks.find(t => t.id === id);
  const [editingProgress, setEditingProgress] = useState(false);
  const [progress, setProgress] = useState(task?.progress?.toString() ?? '0');

  if (loading) return <LoadingSpinner fullScreen />;
  if (!task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 100 }}>Task not found.</Text>
      </SafeAreaView>
    );
  }

  async function handleSaveProgress() {
    const pct = Math.min(100, Math.max(0, parseInt(progress) || 0));
    await updateProgress(id, pct);
    setEditingProgress(false);
  }

  async function handleDelete() {
    Alert.alert('Delete Task', `Delete "${task!.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteTask(id);
        router.back();
      }},
    ]);
  }

  async function handleComplete() {
    await updateProgress(id, 100);
  }

  const formattedDue = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'No deadline set';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>Task Detail</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title & badges */}
        <Card style={styles.mainCard}>
          <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
          {task.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>{task.description}</Text>
          )}
          <View style={styles.badgeRow}>
            <Badge label={task.status} color={statusColors[task.status]} />
            <Badge label={task.priority} color={priorityColors[task.priority]} />
            <Badge label={task.task_type} color={Colors.info} />
          </View>
        </Card>

        {/* Details */}
        <Card style={styles.detailCard}>
          {[
            { icon: 'book-outline', label: 'Module', value: task.module?.module_name ?? 'Personal' },
            { icon: 'calendar-outline', label: 'Due Date', value: formattedDue },
            { icon: 'time-outline', label: 'Estimated Time', value: `${task.estimated_minutes} minutes` },
            { icon: 'bar-chart-outline', label: 'Weight', value: task.weight ? `${task.weight}%` : 'Not specified' },
          ].map(item => (
            <View key={item.label} style={[styles.detailRow, { borderBottomColor: colors.divider }]}>
              <Ionicons name={item.icon as any} size={18} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{item.value}</Text>
            </View>
          ))}
        </Card>

        {/* Progress */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Progress</Text>
            <TouchableOpacity onPress={() => setEditingProgress(!editingProgress)}>
              <Text style={{ color: Colors.primary, fontSize: Typography.sm }}>
                {editingProgress ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.progressPct, { color: task.module?.color ?? Colors.primary }]}>
            {task.progress}%
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, {
              width: `${task.progress}%`,
              backgroundColor: task.module?.color ?? Colors.primary,
            }]} />
          </View>
          {editingProgress && (
            <View style={styles.editProgress}>
              <TextInput
                style={[styles.progressInput, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                value={progress}
                onChangeText={setProgress}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={{ color: colors.textSecondary }}>%</Text>
              <Button title="Save" onPress={handleSaveProgress} size="sm" style={{ marginLeft: Spacing.sm }} />
            </View>
          )}
        </Card>

        {/* Actions */}
        {task.status !== 'Completed' && (
          <Button
            title="✅ Mark as Complete"
            onPress={handleComplete}
            fullWidth
            size="lg"
            style={{ backgroundColor: Colors.success }}
          />
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1 },
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.bold },
  content: { padding: Spacing.base, gap: Spacing.base },
  mainCard: { gap: Spacing.md },
  taskTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, lineHeight: 28 },
  description: { fontSize: Typography.base, lineHeight: 22 },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  detailCard: { gap: 0, padding: 0, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base, borderBottomWidth: 1 },
  detailLabel: { fontSize: Typography.sm, flex: 1 },
  detailValue: { fontSize: Typography.sm, fontWeight: Typography.medium },
  progressCard: { gap: Spacing.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { fontSize: Typography.base, fontWeight: Typography.semibold },
  progressPct: { fontSize: Typography['2xl'], fontWeight: Typography.bold },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  editProgress: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  progressInput: { borderWidth: 1.5, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, width: 70, fontSize: Typography.base, textAlign: 'center' },
});
