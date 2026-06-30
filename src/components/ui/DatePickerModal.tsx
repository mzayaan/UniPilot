import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';

interface DatePickerModalProps {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onConfirm: (date: string) => void;
  onClose: () => void;
  title?: string;
  minDate?: string; // YYYY-MM-DD
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS_OF_WEEK = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function DatePickerModal({ visible, value, onConfirm, onClose, title = 'Select Date', minDate }: DatePickerModalProps) {
  const { colors } = useTheme();

  const initial = value && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? new Date(value + 'T00:00:00')
    : new Date();

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(
    value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value : ''
  );

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function toDateStr(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function isDisabled(day: number) {
    if (!minDate) return false;
    return toDateStr(viewYear, viewMonth, day) < minDate;
  }

  function handleDay(day: number) {
    if (isDisabled(day)) return;
    setSelectedDate(toDateStr(viewYear, viewMonth, day));
  }

  function handleConfirm() {
    if (selectedDate) onConfirm(selectedDate);
    onClose();
  }

  // Build calendar grid (pad with nulls)
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Month navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.weekRow}>
            {DAYS_OF_WEEK.map(d => (
              <Text key={d} style={[styles.weekDay, { color: colors.textTertiary }]}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day === null) return <View key={`e-${i}`} style={styles.cell} />;
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isSelected = dateStr === selectedDate;
              const disabled = isDisabled(day);
              const isToday = dateStr === toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
              return (
                <TouchableOpacity
                  key={`d-${day}`}
                  style={[
                    styles.cell,
                    isSelected && { backgroundColor: Colors.primary, borderRadius: 20 },
                    isToday && !isSelected && { borderWidth: 1.5, borderRadius: 20, borderColor: Colors.primary },
                  ]}
                  onPress={() => handleDay(day)}
                  disabled={disabled}
                >
                  <Text style={[
                    styles.dayText,
                    { color: disabled ? colors.textTertiary : isSelected ? '#fff' : colors.text },
                    isToday && !isSelected && { color: Colors.primary, fontWeight: Typography.bold },
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={{ color: colors.textSecondary, fontSize: Typography.base }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.confirmBtn, { backgroundColor: Colors.primary }, !selectedDate && { opacity: 0.4 }]}
              disabled={!selectedDate}
            >
              <Text style={{ color: '#fff', fontWeight: Typography.semibold, fontSize: Typography.base }}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title: { fontSize: Typography.base, fontWeight: Typography.semibold },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  navBtn: { padding: Spacing.sm },
  monthLabel: { fontSize: Typography.base, fontWeight: Typography.bold },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: Typography.sm },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  confirmBtn: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});
