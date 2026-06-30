import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { DatePickerModal } from '../../src/components/ui/DatePickerModal';
import { useTasks } from '../../src/hooks/useTasks';
import { useModules } from '../../src/hooks/useModules';
import { useTheme } from '../../src/context/ThemeContext';
import { TaskPriority, TaskType } from '../../src/types';

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const TASK_TYPES: TaskType[] = ['Assignment', 'Revision', 'Reading', 'Presentation', 'Group', 'Personal'];
const PRIORITY_COLORS = { Low: '#43E97B', Medium: '#FFB347', High: '#FF8C00', Critical: '#FF5252' };

export default function AddTaskScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addTask } = useTasks();
  const { modules } = useModules();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [taskType, setTaskType] = useState<TaskType>('Assignment');
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState('60');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Task title is required';
    if (dueDate && !/^\d{4}-\d{2}-\d{2}/.test(dueDate)) e.dueDate = 'Use format YYYY-MM-DD';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);
    const { error } = await addTask({
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      priority,
      task_type: taskType,
      module_id: moduleId,
      estimated_minutes: parseInt(estimatedMinutes) || 60,
      weight: weight ? parseFloat(weight) : null,
      progress: 0,
      status: 'Not Started',
    });
    setLoading(false);
    if (error) Alert.alert('Error', error);
    else router.back();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Task</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label="Task Title *"
          value={title}
          onChangeText={setTitle}
          leftIcon="create-outline"
          placeholder="Complete ERD Diagram"
          error={errors.title}
          autoCapitalize="sentences"
        />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Optional details..."
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
          containerStyle={{ marginBottom: Spacing.md }}
        />

        {/* Module selector */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Module (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, { borderColor: !moduleId ? Colors.primary : colors.border },
              !moduleId && { backgroundColor: Colors.primary + '20' }]}
            onPress={() => setModuleId(null)}
          >
            <Text style={[styles.chipText, { color: !moduleId ? Colors.primary : colors.textSecondary }]}>
              Personal
            </Text>
          </TouchableOpacity>
          {modules.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.chip, { borderColor: moduleId === m.id ? m.color : colors.border },
                moduleId === m.id && { backgroundColor: m.color + '20' }]}
              onPress={() => setModuleId(m.id)}
            >
              <View style={[styles.chipDot, { backgroundColor: m.color }]} />
              <Text style={[styles.chipText, { color: moduleId === m.id ? m.color : colors.textSecondary }]}
                numberOfLines={1}>
                {m.module_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Task type */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
        <View style={styles.chipWrap}>
          {TASK_TYPES.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, { borderColor: taskType === t ? Colors.primary : colors.border },
                taskType === t && { backgroundColor: Colors.primary + '20' }]}
              onPress={() => setTaskType(t)}
            >
              <Text style={[styles.chipText, { color: taskType === t ? Colors.primary : colors.textSecondary }]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Priority */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.priorityBtn, { borderColor: priority === p ? PRIORITY_COLORS[p] : colors.border },
                priority === p && { backgroundColor: PRIORITY_COLORS[p] + '20' }]}
              onPress={() => setPriority(p)}
            >
              <Text style={[styles.chipText, { color: priority === p ? PRIORITY_COLORS[p] : colors.textSecondary }]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date picker trigger */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Due Date</Text>
        <TouchableOpacity
          style={[styles.dateBtn, { borderColor: errors.dueDate ? Colors.danger : colors.inputBorder, backgroundColor: colors.input }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={18} color={dueDate ? Colors.primary : colors.placeholder} />
          <Text style={{ color: dueDate ? colors.text : colors.placeholder, fontSize: Typography.base, flex: 1 }}>
            {dueDate
              ? new Date(dueDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Tap to pick a date'}
          </Text>
          {dueDate ? (
            <TouchableOpacity onPress={() => setDueDate('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          )}
        </TouchableOpacity>
        {errors.dueDate && <Text style={styles.errorText}>{errors.dueDate}</Text>}

        <DatePickerModal
          visible={showDatePicker}
          value={dueDate}
          onConfirm={(d) => setDueDate(d)}
          onClose={() => setShowDatePicker(false)}
          title="Pick Due Date"
        />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Est. Minutes"
              value={estimatedMinutes}
              onChangeText={setEstimatedMinutes}
              leftIcon="time-outline"
              placeholder="60"
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Weight (%)"
              value={weight}
              onChangeText={setWeight}
              leftIcon="bar-chart-outline"
              placeholder="25"
              keyboardType="numeric"
            />
          </View>
        </View>

        <Button
          title="Save Task"
          onPress={handleSave}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: Spacing.base }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1 },
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.semibold },
  content: { padding: Spacing.base, gap: Spacing.sm },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, marginBottom: Spacing.xs },
  chipScroll: { marginBottom: Spacing.md },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.medium },
  priorityRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  priorityBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1.5 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1.5, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.xs },
  errorText: { color: Colors.danger, fontSize: Typography.xs, marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
});
