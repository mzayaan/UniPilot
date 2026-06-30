import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';

interface TimePickerModalProps {
  visible: boolean;
  value: string; // HH:MM
  onConfirm: (time: string) => void;
  onClose: () => void;
  title?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function TimePickerModal({ visible, value, onConfirm, onClose, title = 'Select Time' }: TimePickerModalProps) {
  const { colors } = useTheme();

  const [hh, mm] = (value || '09:00').split(':');
  const [selectedHour, setSelectedHour] = useState(hh || '09');
  const [selectedMinute, setSelectedMinute] = useState(
    MINUTES.includes(mm) ? mm : '00'
  );

  function handleConfirm() {
    onConfirm(`${selectedHour}:${selectedMinute}`);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={styles.preview}>
            <Text style={[styles.previewTime, { color: Colors.primary }]}>
              {selectedHour}:{selectedMinute}
            </Text>
          </View>

          {/* Pickers */}
          <View style={styles.pickerRow}>
            {/* Hours */}
            <View style={styles.pickerCol}>
              <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Hour</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {HOURS.map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.item,
                      selectedHour === h && { backgroundColor: Colors.primary, borderRadius: BorderRadius.md },
                    ]}
                    onPress={() => setSelectedHour(h)}
                  >
                    <Text style={[
                      styles.itemText,
                      { color: selectedHour === h ? '#fff' : colors.text },
                      selectedHour === h && { fontWeight: Typography.bold },
                    ]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={[styles.colon, { color: colors.textSecondary }]}>:</Text>

            {/* Minutes */}
            <View style={styles.pickerCol}>
              <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Min</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {MINUTES.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.item,
                      selectedMinute === m && { backgroundColor: Colors.primary, borderRadius: BorderRadius.md },
                    ]}
                    onPress={() => setSelectedMinute(m)}
                  >
                    <Text style={[
                      styles.itemText,
                      { color: selectedMinute === m ? '#fff' : colors.text },
                      selectedMinute === m && { fontWeight: Typography.bold },
                    ]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={{ color: colors.textSecondary, fontSize: Typography.base }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.confirmBtn, { backgroundColor: Colors.primary }]}
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
  preview: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  previewTime: {
    fontSize: 48,
    fontWeight: Typography.bold,
    letterSpacing: 2,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  pickerCol: { flex: 1, alignItems: 'center' },
  colLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, marginBottom: Spacing.sm },
  scroll: { height: 180 },
  item: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    marginVertical: 2,
    alignItems: 'center',
  },
  itemText: { fontSize: Typography.md },
  colon: {
    fontSize: 28,
    fontWeight: Typography.bold,
    marginHorizontal: Spacing.sm,
    marginTop: 24,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  confirmBtn: { flex: 2, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
});
