import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/lib/theme';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { LoadingSpinner } from '../src/components/ui/LoadingSpinner';
import { useTheme } from '../src/context/ThemeContext';
import { useTasks } from '../src/hooks/useTasks';
import { useModules } from '../src/hooks/useModules';
import { priorityColors, statusColors } from '../src/lib/theme';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** 0 = Sunday, 1 = Monday... We want Monday-first grid */
function getFirstWeekday(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1; // convert to Mon=0
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { tasks, loading: taskLoading } = useTasks();
  const { modules } = useModules();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  // Map dateKey -> tasks
  const tasksByDay = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    for (const t of tasks) {
      if (!t.due_date) continue;
      const d = new Date(t.due_date);
      const key = toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [tasks]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = getFirstWeekday(year, month);
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const selectedTasks = selectedDay ? (tasksByDay[selectedDay] ?? []) : [];

  // Color dots for a day (up to 3)
  function dotsForDay(key: string) {
    const dayTasks = tasksByDay[key];
    if (!dayTasks?.length) return null;
    const colors = dayTasks
      .slice(0, 3)
      .map(t => t.module?.color ?? Colors.primary);
    return colors;
  }

  if (taskLoading) return <LoadingSpinner fullScreen />;

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navArrow}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navArrow}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Day labels */}
        <View style={styles.dayLabelRow}>
          {DAY_LABELS.map(d => (
            <Text key={d} style={[styles.dayLabel, { color: colors.textTertiary }]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {cells.map((day, idx) => {
            if (!day) return <View key={`empty-${idx}`} style={styles.cell} />;
            const key = toDateKey(year, month, day);
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;
            const dots = dotsForDay(key);

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.cell,
                  isSelected && [styles.selectedCell, { backgroundColor: Colors.primary }],
                  isToday && !isSelected && [styles.todayCell, { borderColor: Colors.primary }],
                ]}
                onPress={() => setSelectedDay(isSelected ? null : key)}
              >
                <Text style={[
                  styles.dayNumber,
                  { color: isSelected ? '#fff' : isToday ? Colors.primary : colors.text },
                  isSelected && { fontWeight: Typography.bold },
                ]}>
                  {day}
                </Text>
                {dots && (
                  <View style={styles.dotRow}>
                    {dots.map((c, i) => (
                      <View
                        key={i}
                        style={[styles.dot, { backgroundColor: isSelected ? 'rgba(255,255,255,0.85)' : c }]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected day tasks */}
        {selectedDay && (
          <View style={styles.taskList}>
            <Text style={[styles.taskListTitle, { color: colors.text }]}>
              {selectedTasks.length === 0
                ? 'No tasks due on this day'
                : `${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} due`}
            </Text>
            {selectedTasks.map(task => (
              <TouchableOpacity key={task.id} onPress={() => router.push(`/tasks/${task.id}`)}>
                <Card style={styles.taskCard}>
                  <View style={styles.taskRow}>
                    <View style={[styles.taskDot, { backgroundColor: task.module?.color ?? Colors.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>
                        {task.module?.module_name ?? 'Personal'} • {task.task_type}
                      </Text>
                    </View>
                    <View style={{ gap: 4, alignItems: 'flex-end' }}>
                      <Badge label={task.status} color={statusColors[task.status]} small />
                      <Badge label={task.priority} color={priorityColors[task.priority]} small />
                    </View>
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
        )}

        {/* Legend */}
        <View style={[styles.legend, { borderTopColor: colors.border }]}>
          <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>Modules</Text>
          <View style={styles.legendRow}>
            {modules.slice(0, 6).map(m => (
              <View key={m.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {m.module_code ?? m.module_name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderBottomWidth: 1,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  navArrow: { padding: 4 },
  monthTitle: { fontSize: Typography.md, fontWeight: Typography.bold, minWidth: 160, textAlign: 'center' },
  dayLabelRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: BorderRadius.md,
  },
  selectedCell: {
    borderRadius: BorderRadius.full,
  },
  todayCell: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
  },
  dayNumber: { fontSize: Typography.sm },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  taskList: { padding: Spacing.base, gap: Spacing.sm },
  taskListTitle: { fontSize: Typography.base, fontWeight: Typography.bold, marginBottom: Spacing.xs },
  taskCard: { gap: Spacing.xs },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  taskDot: { width: 10, height: 10, borderRadius: 5 },
  taskTitle: { fontSize: Typography.base, fontWeight: Typography.medium },
  taskMeta: { fontSize: Typography.xs, marginTop: 2 },
  progressTrack: { height: 3, borderRadius: 2, marginTop: Spacing.xs, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  legend: { marginHorizontal: Spacing.base, paddingTop: Spacing.base, borderTopWidth: 1 },
  legendTitle: { fontSize: Typography.xs, fontWeight: Typography.semibold, marginBottom: Spacing.sm },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: Typography.xs, maxWidth: 80 },
});
