import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { TimePickerModal } from '../../src/components/ui/TimePickerModal';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useModules } from '../../src/hooks/useModules';
import { supabase } from '../../src/lib/supabase';
import { TimetableEntry } from '../../src/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ENTRY_TYPES = ['Lecture', 'Tutorial', 'Lab', 'Seminar', 'Workshop', 'Personal'];

export default function TimetableScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { modules } = useModules();

  const [selectedDay, setSelectedDay] = useState(SHORT_DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New entry form
  const [moduleId, setModuleId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [entryType, setEntryType] = useState('Lecture');
  const [saving, setSaving] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('timetable_entries')
      .select('*, module:modules(*)')
      .eq('user_id', user.id)
      .order('start_time');
    setEntries((data as TimetableEntry[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const todayEntries = entries.filter(e => {
    const dayIdx = SHORT_DAYS.indexOf(selectedDay);
    return e.day_of_week === DAYS[dayIdx];
  }).sort((a, b) => a.start_time.localeCompare(b.start_time));

  async function handleSave() {
    if (!user) return;
    if (!startTime || !endTime) { Alert.alert('Error', 'Please enter start and end times.'); return; }
    setSaving(true);
    const dayIdx = SHORT_DAYS.indexOf(selectedDay);
    const { error } = await supabase.from('timetable_entries').insert({
      user_id: user.id,
      module_id: moduleId || null,
      day_of_week: DAYS[dayIdx],
      start_time: startTime,
      end_time: endTime,
      location: location.trim() || null,
      entry_type: entryType,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else { setShowModal(false); fetchEntries(); }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Entry', 'Remove this timetable entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('timetable_entries').delete().eq('id', id);
        fetchEntries();
      }},
    ]);
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Timetable</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: Colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
        {SHORT_DAYS.map(d => (
          <TouchableOpacity
            key={d}
            style={[
              styles.dayBtn,
              { borderColor: selectedDay === d ? Colors.primary : colors.border },
              selectedDay === d && { backgroundColor: Colors.primary },
            ]}
            onPress={() => setSelectedDay(d)}
          >
            <Text style={[styles.dayText, { color: selectedDay === d ? '#fff' : colors.textSecondary }]}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Entries */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {todayEntries.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No Classes Today"
            message={`No entries for ${DAYS[SHORT_DAYS.indexOf(selectedDay)]}. Add your classes with the + button.`}
            actionLabel="Add Entry"
            onAction={() => setShowModal(true)}
          />
        ) : todayEntries.map(entry => (
          <Card key={entry.id} style={styles.entryCard}>
            <View style={styles.entryRow}>
              <View style={[styles.timePill, { backgroundColor: entry.module?.color ? entry.module.color + '20' : Colors.primary + '20' }]}>
                <Text style={[styles.timeText, { color: entry.module?.color ?? Colors.primary }]}>
                  {entry.start_time.slice(0, 5)}
                </Text>
                <Text style={[styles.timeSep, { color: entry.module?.color ?? Colors.primary }]}>–</Text>
                <Text style={[styles.timeText, { color: entry.module?.color ?? Colors.primary }]}>
                  {entry.end_time.slice(0, 5)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.entryTitle, { color: colors.text }]}>
                  {entry.module?.module_name ?? 'Personal'}
                </Text>
                <Text style={[styles.entryMeta, { color: colors.textSecondary }]}>
                  {entry.entry_type}{entry.location ? ` • ${entry.location}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Add Entry — {selectedDay}</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">

            {/* Module */}
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Module</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <TouchableOpacity
                style={[styles.chip, { borderColor: !moduleId ? Colors.primary : colors.border }, !moduleId && { backgroundColor: Colors.primary + '20' }]}
                onPress={() => setModuleId('')}
              >
                <Text style={[styles.chipText, { color: !moduleId ? Colors.primary : colors.textSecondary }]}>Personal</Text>
              </TouchableOpacity>
              {modules.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.chip, { borderColor: moduleId === m.id ? m.color : colors.border }, moduleId === m.id && { backgroundColor: m.color + '20' }]}
                  onPress={() => setModuleId(m.id)}
                >
                  <Text style={[styles.chipText, { color: moduleId === m.id ? m.color : colors.textSecondary }]}>{m.module_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Type */}
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Type</Text>
            <View style={styles.chipWrap}>
              {ENTRY_TYPES.map(t => (
                <TouchableOpacity key={t}
                  style={[styles.chip, { borderColor: entryType === t ? Colors.primary : colors.border }, entryType === t && { backgroundColor: Colors.primary + '20' }]}
                  onPress={() => setEntryType(t)}>
                  <Text style={[styles.chipText, { color: entryType === t ? Colors.primary : colors.textSecondary }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Start Time</Text>
            <TouchableOpacity
              style={[styles.timeBtn, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={[styles.timeBtnText, { color: colors.text }]}>{startTime}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>End Time</Text>
            <TouchableOpacity
              style={[styles.timeBtn, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={[styles.timeBtnText, { color: colors.text }]}>{endTime}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <TimePickerModal
              visible={showStartTimePicker}
              value={startTime}
              onConfirm={(t) => setStartTime(t)}
              onClose={() => setShowStartTimePicker(false)}
              title="Start Time"
            />
            <TimePickerModal
              visible={showEndTimePicker}
              value={endTime}
              onConfirm={(t) => setEndTime(t)}
              onClose={() => setShowEndTimePicker(false)}
              title="End Time"
            />
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Location</Text>
            <TextInput
              style={[styles.timeInput, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              value={location}
              onChangeText={setLocation}
              placeholder="Room 201, Block B"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
            />

            <Button title="Save Entry" onPress={handleSave} loading={saving} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, borderBottomWidth: 1 },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dayRow: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
  dayBtn: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  dayText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  content: { padding: Spacing.base, gap: Spacing.sm },
  entryCard: {},
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  timePill: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', minWidth: 70 },
  timeText: { fontSize: Typography.sm, fontWeight: Typography.bold },
  timeSep: { fontSize: Typography.xs },

  entryTitle: { fontSize: Typography.base, fontWeight: Typography.semibold },
  entryMeta: { fontSize: Typography.xs, marginTop: 2 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1 },
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.semibold },
  modalContent: { padding: Spacing.base },
  formLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1.5, marginRight: Spacing.xs },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.medium },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1.5, marginBottom: Spacing.md },
  timeBtnText: { flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold },
});
