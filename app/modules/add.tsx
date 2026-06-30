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
import { useModules } from '../../src/hooks/useModules';
import { useTheme } from '../../src/context/ThemeContext';

const MODULE_COLORS = [
  '#6C63FF', '#FF6584', '#43E97B', '#FFB347', '#4FC3F7',
  '#FF8A65', '#BA68C8', '#4DB6AC', '#F06292', '#AED581',
];

export default function AddModuleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addModule } = useModules();

  const [moduleName, setModuleName] = useState('');
  const [lecturerName, setLecturerName] = useState('');
  const [targetMark, setTargetMark] = useState('60');
  const [difficultyLevel, setDifficultyLevel] = useState(3);
  const [credits, setCredits] = useState('');
  const [selectedColor, setSelectedColor] = useState(MODULE_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!moduleName.trim()) e.moduleName = 'Module name is required';
    const mark = parseFloat(targetMark);
    if (isNaN(mark) || mark < 0 || mark > 100) e.targetMark = 'Enter a valid percentage (0-100)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);
    const { error } = await addModule({
      module_name: moduleName.trim(),
      lecturer_name: lecturerName.trim() || null,
      target_mark: parseFloat(targetMark),
      current_mark: null,
      difficulty_level: difficultyLevel,
      color: selectedColor,
      credits: credits ? parseInt(credits) : null,
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Module</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label="Module Name *"
          value={moduleName}
          onChangeText={setModuleName}
          leftIcon="book-outline"
          placeholder="Database Design"
          error={errors.moduleName}
          autoCapitalize="words"
        />
        <Input
          label="Lecturer / Tutor"
          value={lecturerName}
          onChangeText={setLecturerName}
          leftIcon="person-outline"
          placeholder="Dr. Smith"
          autoCapitalize="words"
        />
        <Input
          label="Target Mark (%)"
          value={targetMark}
          onChangeText={setTargetMark}
          leftIcon="trophy-outline"
          placeholder="60"
          keyboardType="numeric"
          error={errors.targetMark}
        />
        <Input
          label="Credits"
          value={credits}
          onChangeText={setCredits}
          leftIcon="star-outline"
          placeholder="15"
          keyboardType="numeric"
        />

        {/* Difficulty */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Difficulty Level</Text>
        <View style={styles.diffRow}>
          {[1, 2, 3, 4, 5].map(d => (
            <TouchableOpacity
              key={d}
              style={[
                styles.diffBtn,
                { borderColor: difficultyLevel >= d ? selectedColor : colors.border },
                difficultyLevel >= d && { backgroundColor: selectedColor + '20' },
              ]}
              onPress={() => setDifficultyLevel(d)}
            >
              <Text style={[styles.diffText, { color: difficultyLevel >= d ? selectedColor : colors.textTertiary }]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.diffLabel, { color: colors.textTertiary }]}>
          {['Very Easy', 'Easy', 'Moderate', 'Hard', 'Very Hard'][difficultyLevel - 1]}
        </Text>

        {/* Color */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Module Color</Text>
        <View style={styles.colorRow}>
          {MODULE_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                selectedColor === c && styles.colorSelected,
              ]}
              onPress={() => setSelectedColor(c)}
            >
              {selectedColor === c && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Save Module"
          onPress={handleSave}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.semibold },
  content: { padding: Spacing.base, gap: Spacing.xs },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  diffRow: { flexDirection: 'row', gap: Spacing.sm },
  diffBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  diffText: { fontWeight: Typography.bold, fontSize: Typography.base },
  diffLabel: { fontSize: Typography.xs, textAlign: 'center', marginTop: 4 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: { borderWidth: 3, borderColor: '#fff', elevation: 4 },
});
