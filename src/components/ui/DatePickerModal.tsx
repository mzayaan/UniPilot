import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
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

function parseDate(dateStr: string): Date {
  if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }
  return new Date();
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DatePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
  title = 'Select Date',
  minDate,
}: DatePickerModalProps) {
  const { colors } = useTheme();
  const [tempDate, setTempDate] = useState<Date>(parseDate(value));

  useEffect(() => {
    if (!visible) return;

    const current = parseDate(value);
    setTempDate(current);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate: minDate ? parseDate(minDate) : undefined,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            onConfirm(formatDateStr(selectedDate));
          }
          onClose();
        },
      });
    }
  }, [visible]);

  // Android uses the imperative API above — nothing to render
  if (Platform.OS === 'android') return null;

  // iOS: bottom sheet with native spinner
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity
              onPress={() => { onConfirm(formatDateStr(tempDate)); onClose(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.headerBtn, { color: Colors.primary, fontWeight: Typography.semibold }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            minimumDate={minDate ? parseDate(minDate) : undefined}
            onChange={(_, date) => { if (date) setTempDate(date); }}
            style={styles.picker}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing['3xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  headerBtn: {
    fontSize: Typography.base,
  },
  picker: {
    height: 200,
  },
});
