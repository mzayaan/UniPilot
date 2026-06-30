import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useGrades } from '../../src/hooks/useGrades';
import { useModules } from '../../src/hooks/useModules';
import { useTheme } from '../../src/context/ThemeContext';

const ASSESSMENT_TYPES = ['Assignment', 'Exam', 'Quiz', 'Coursework', 'Project', 'Presentation', 'Other'];

export default function GradesScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { grades, loading, addGrade, deleteGrade, calculateCurrentMark, projectFinalMark } = useGrades(moduleId);
  const { modules, updateModule } = useModules();
  const module = modules.find(m => m.id === moduleId);

  const [showModal, setShowModal] = useState(false);
  const [assessmentName, setAssessmentName] = useState('');
  const [assessmentType, setAssessmentType] = useState('Assignment');
  const [weight, setWeight] = useState('');
  const [markObtained, setMarkObtained] = useState('');
  const [maxMark, setMaxMark] = useState('100');
  const [saving, setSaving] = useState(false);

  const currentMark = calculateCurrentMark();
  const projected = currentMark !== null ? projectFinalMark(module?.target_mark ?? 60) : null;
  const totalWeight = grades.reduce((s, g) => s + g.weight, 0);

  async function handleSave() {
    if (!assessmentName.trim() || !weight) { Alert.alert('Error', 'Name and weight are required.'); return; }
    setSaving(true);
    const { error } = await addGrade({
      module_id: moduleId,
      assessment_name: assessmentName.trim(),
      assessment_type: assessmentType,
      weight: parseFloat(weight),
      mark_obtained: markObtained ? parseFloat(markObtained) : null,
      max_mark: parseFloat(maxMark) || 100,
    });
    // Sync current_mark back to module
    const newMark = calculateCurrentMark();
    if (newMark !== null && module) {
      await updateModule(module.id, { current_mark: newMark });
    }
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else { setShowModal(false); setAssessmentName(''); setWeight(''); setMarkObtained(''); setMaxMark('100'); }
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {module?.module_name ?? 'Grade Calculator'}
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: Colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <Card style={styles.summaryCard}>
          <View style={[styles.summaryHeader, { backgroundColor: module?.color ?? Colors.primary }]}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {currentMark !== null ? `${currentMark}%` : '—'}
              </Text>
              <Text style={styles.summaryLabel}>Current</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{module?.target_mark ?? 60}%</Text>
              <Text style={styles.summaryLabel}>Target</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalWeight}%</Text>
              <Text style={styles.summaryLabel}>Weighted</Text>
            </View>
          </View>
          {projected !== null && (
            <View style={styles.projectedRow}>
              <Ionicons name="trending-up" size={16} color={Colors.info} />
              <Text style={[styles.projectedText, { color: colors.textSecondary }]}>
                Projected final: <Text style={{ color: colors.text, fontWeight: Typography.bold }}>{projected}%</Text>
                {projected >= (module?.target_mark ?? 60)
                  ? ' ✅ On track'
                  : ' ⚠️ Below target'}
              </Text>
            </View>
          )}
        </Card>

        {/* Assessments */}
        {grades.length === 0 ? (
          <EmptyState
            icon="bar-chart-outline"
            title="No Assessments Yet"
            message="Add your assignments, exams, and coursework to track your grade."
            actionLabel="Add Assessment"
            onAction={() => setShowModal(true)}
          />
        ) : grades.map(g => {
          const pct = g.mark_obtained !== null ? ((g.mark_obtained / g.max_mark) * 100).toFixed(1) : null;
          return (
            <Card key={g.id} style={styles.gradeCard}>
              <View style={styles.gradeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gradeName, { color: colors.text }]}>{g.assessment_name}</Text>
                  <Text style={[styles.gradeMeta, { color: colors.textSecondary }]}>
                    {g.assessment_type} • {g.weight}% weight
                  </Text>
                </View>
                <View style={styles.gradeRight}>
                  <Text style={[styles.gradePct, { color: pct ? (parseFloat(pct) >= (module?.target_mark ?? 60) ? Colors.success : Colors.warning) : colors.textTertiary }]}>
                    {pct ? `${pct}%` : 'Pending'}
                  </Text>
                  <Text style={[styles.gradeRaw, { color: colors.textSecondary }]}>
                    {g.mark_obtained !== null ? `${g.mark_obtained}/${g.max_mark}` : '—'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Delete', 'Remove this assessment?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteGrade(g.id) },
                ])}>
                  <Ionicons name="trash-outline" size={16} color={colors.textTertiary} style={{ marginLeft: Spacing.sm }} />
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Add Assessment</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Assessment Name</Text>
            <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              value={assessmentName} onChangeText={setAssessmentName} placeholder="Coursework 1" placeholderTextColor={colors.placeholder} autoCapitalize="words" />

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              {ASSESSMENT_TYPES.map(t => (
                <TouchableOpacity key={t}
                  style={[styles.chip, { borderColor: assessmentType === t ? Colors.primary : colors.border }, assessmentType === t && { backgroundColor: Colors.primary + '20' }]}
                  onPress={() => setAssessmentType(t)}>
                  <Text style={[styles.chipText, { color: assessmentType === t ? Colors.primary : colors.textSecondary }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Weight (%)</Text>
                <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
                  value={weight} onChangeText={setWeight} placeholder="30" placeholderTextColor={colors.placeholder} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Max Mark</Text>
                <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
                  value={maxMark} onChangeText={setMaxMark} placeholder="100" placeholderTextColor={colors.placeholder} keyboardType="numeric" />
              </View>
            </View>

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Mark Obtained (leave blank if pending)</Text>
            <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              value={markObtained} onChangeText={setMarkObtained} placeholder="Leave blank until marked" placeholderTextColor={colors.placeholder} keyboardType="numeric" />

            <Button title="Save Assessment" onPress={handleSave} loading={saving} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1 },
  title: { fontSize: Typography.md, fontWeight: Typography.bold, flex: 1, textAlign: 'center' },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base, gap: Spacing.sm },
  summaryCard: { padding: 0, overflow: 'hidden' },
  summaryHeader: { flexDirection: 'row', padding: Spacing.lg },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: '#fff', fontSize: Typography.xl, fontWeight: Typography.bold },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.xs, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  projectedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  projectedText: { fontSize: Typography.sm },
  gradeCard: { gap: Spacing.sm },
  gradeHeader: { flexDirection: 'row', alignItems: 'center' },
  gradeName: { fontSize: Typography.base, fontWeight: Typography.medium },
  gradeMeta: { fontSize: Typography.xs, marginTop: 2 },
  gradeRight: { alignItems: 'flex-end', marginRight: Spacing.sm },
  gradePct: { fontSize: Typography.md, fontWeight: Typography.bold },
  gradeRaw: { fontSize: Typography.xs },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1 },
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.semibold },
  modalContent: { padding: Spacing.base },
  formLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  input: { borderWidth: 1.5, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.base, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1.5, marginRight: Spacing.sm },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.medium },
});
