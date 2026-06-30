import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/lib/theme';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { DatePickerModal } from '../src/components/ui/DatePickerModal';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

const STUDY_TIMES = ['Morning', 'Afternoon', 'Evening', 'Night'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { colors } = useTheme();

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [semesterStart, setSemesterStart] = useState('');
  const [semesterEnd, setSemesterEnd] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [targetGrade, setTargetGrade] = useState('60');
  const [studyTime, setStudyTime] = useState('Evening');
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('users_profile')
      .update({
        full_name: fullName.trim(),
        university: university.trim(),
        degree: degree.trim(),
        year_of_study: yearOfStudy,
        semester_start: semesterStart || null,
        semester_end: semesterEnd || null,
        target_grade: parseFloat(targetGrade) || 60,
        preferred_study_time: studyTime,
        onboarding_complete: true,
      })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }
    await refreshProfile();
    router.replace('/(tabs)');
  }

  function nextStep() {
    if (step === 1 && !fullName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else handleFinish();
  }

  const progress = step / TOTAL_STEPS;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
          Step {step} of {TOTAL_STEPS}
        </Text>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={[styles.title, { color: colors.text }]}>Let's get started</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tell us a bit about yourself
            </Text>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              leftIcon="person-outline"
              placeholder="Zayaan Dulmeera"
              autoCapitalize="words"
            />
            <Input
              label="University"
              value={university}
              onChangeText={setUniversity}
              leftIcon="school-outline"
              placeholder="University of Mauritius"
              autoCapitalize="words"
            />
          </View>
        )}

        {/* Step 2: Course Details */}
        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.emoji}>📚</Text>
            <Text style={[styles.title, { color: colors.text }]}>Your Course</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              What are you studying?
            </Text>
            <Input
              label="Degree / Programme"
              value={degree}
              onChangeText={setDegree}
              leftIcon="book-outline"
              placeholder="BSc Computer Science"
              autoCapitalize="words"
            />
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Year of Study</Text>
            <View style={styles.chipRow}>
              {YEARS.map((y, i) => (
                <TouchableOpacity
                  key={y}
                  style={[
                    styles.chip,
                    { borderColor: yearOfStudy === i + 1 ? Colors.primary : colors.border },
                    yearOfStudy === i + 1 && { backgroundColor: Colors.primary + '20' },
                  ]}
                  onPress={() => setYearOfStudy(i + 1)}
                >
                  <Text style={[
                    styles.chipText,
                    { color: yearOfStudy === i + 1 ? Colors.primary : colors.textSecondary },
                  ]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Semester Dates */}
        {step === 3 && (
          <View style={styles.step}>
            <Text style={styles.emoji}>📅</Text>
            <Text style={[styles.title, { color: colors.text }]}>Semester Dates</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              When does your semester start and end?
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Semester Start</Text>
            <TouchableOpacity
              style={[styles.dateBtn, { borderColor: colors.border, backgroundColor: colors.input }]}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={semesterStart ? Colors.primary : colors.placeholder} />
              <Text style={{ color: semesterStart ? colors.text : colors.placeholder, fontSize: Typography.base, flex: 1 }}>
                {semesterStart
                  ? new Date(semesterStart + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Tap to pick start date'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Semester End</Text>
            <TouchableOpacity
              style={[styles.dateBtn, { borderColor: colors.border, backgroundColor: colors.input }]}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={semesterEnd ? Colors.primary : colors.placeholder} />
              <Text style={{ color: semesterEnd ? colors.text : colors.placeholder, fontSize: Typography.base, flex: 1 }}>
                {semesterEnd
                  ? new Date(semesterEnd + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Tap to pick end date'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <DatePickerModal
              visible={showStartPicker}
              value={semesterStart}
              onConfirm={(d) => setSemesterStart(d)}
              onClose={() => setShowStartPicker(false)}
              title="Semester Start Date"
            />
            <DatePickerModal
              visible={showEndPicker}
              value={semesterEnd}
              onConfirm={(d) => setSemesterEnd(d)}
              onClose={() => setShowEndPicker(false)}
              title="Semester End Date"
              minDate={semesterStart || undefined}
            />
          </View>
        )}

        {/* Step 4: Goals & Preferences */}
        {step === 4 && (
          <View style={styles.step}>
            <Text style={styles.emoji}>🎯</Text>
            <Text style={[styles.title, { color: colors.text }]}>Your Goals</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Set your target and preferred study time
            </Text>
            <Input
              label="Target Grade (%)"
              value={targetGrade}
              onChangeText={setTargetGrade}
              leftIcon="trophy-outline"
              placeholder="60"
              keyboardType="numeric"
            />
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Preferred Study Time</Text>
            <View style={styles.chipRow}>
              {STUDY_TIMES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.chip,
                    { borderColor: studyTime === t ? Colors.primary : colors.border },
                    studyTime === t && { backgroundColor: Colors.primary + '20' },
                  ]}
                  onPress={() => setStudyTime(t)}
                >
                  <Text style={[
                    styles.chipText,
                    { color: studyTime === t ? Colors.primary : colors.textSecondary },
                  ]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navRow}>
          {step > 1 && (
            <Button
              title="Back"
              onPress={() => setStep(s => s - 1)}
              variant="outline"
              style={styles.navBtn}
            />
          )}
          <Button
            title={step === TOTAL_STEPS ? "Let's Go! 🚀" : "Continue"}
            onPress={nextStep}
            loading={loading}
            style={[styles.navBtn, step === 1 && styles.fullBtn]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: Spacing['2xl'], flexGrow: 1 },
  progressTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  stepLabel: { fontSize: Typography.sm, marginBottom: Spacing['2xl'] },
  step: { flex: 1, gap: Spacing.md },
  emoji: { fontSize: 48, marginBottom: Spacing.sm },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.base, lineHeight: 22, marginBottom: Spacing.lg },
  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.medium },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, marginBottom: Spacing.sm, marginTop: Spacing.md },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1.5, marginBottom: Spacing.sm },
  navRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing['3xl'] },
  navBtn: { flex: 1 },
  fullBtn: { flex: 1 },
});
