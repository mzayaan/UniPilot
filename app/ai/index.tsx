import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useModules } from '../../src/hooks/useModules';
import { supabase } from '../../src/lib/supabase';
import { AIGenerationType, PLAN_LIMITS } from '../../src/types';

const AI_TYPES: { type: AIGenerationType; label: string; icon: string; description: string; proOnly: boolean }[] = [
  { type: 'summary', label: 'Summarise', icon: '📝', description: 'Get a concise summary of your notes', proOnly: false },
  { type: 'flashcards', label: 'Flashcards', icon: '🃏', description: 'Generate study flashcards', proOnly: true },
  { type: 'quiz', label: 'Quiz', icon: '❓', description: 'Create quiz questions to test yourself', proOnly: true },
  { type: 'explanation', label: 'Explain', icon: '💡', description: 'Get a simple explanation of a topic', proOnly: false },
  { type: 'study_plan', label: 'Study Plan', icon: '📅', description: 'Generate a revision plan', proOnly: true },
];

export default function AICoachScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { subscription } = useAuth();
  const { modules } = useModules();

  const [selectedType, setSelectedType] = useState<AIGenerationType>('summary');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const plan = subscription?.plan_name ?? 'free';
  const limits = PLAN_LIMITS[plan];

  async function handleGenerate() {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter some text or topic to work with.');
      return;
    }

    const selected = AI_TYPES.find(t => t.type === selectedType);
    if (selected?.proOnly && plan === 'free') {
      Alert.alert(
        'Pro Feature',
        `${selected.label} is available on UniPilot Pro. Upgrade to unlock AI quizzes, flashcards, and study plans.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/subscription') },
        ]
      );
      return;
    }

    setLoading(true);
    setOutput('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-study-coach', {
        body: {
          type: selectedType,
          input: inputText.trim(),
          moduleId: selectedModuleId,
          moduleName: modules.find(m => m.id === selectedModuleId)?.module_name ?? null,
        },
      });

      if (error) throw error;
      setOutput(data.output ?? 'No response received.');
    } catch (err: any) {
      Alert.alert('AI Error', err.message ?? 'Failed to generate response. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.text }]}>AI Study Coach</Text>
          <Text style={[styles.subtitle, { color: Colors.primary }]}>Powered by Gemini</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Academic integrity notice */}
        <View style={[styles.integrityNotice, { backgroundColor: Colors.info + '15', borderColor: Colors.info + '40' }]}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
          <Text style={[styles.integrityText, { color: colors.textSecondary }]}>
            UniPilot helps you understand, plan, and improve your work. It does not replace your own academic effort.
          </Text>
        </View>

        {/* Type selector */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>What would you like?</Text>
        <View style={styles.typeGrid}>
          {AI_TYPES.map(t => (
            <TouchableOpacity
              key={t.type}
              style={[
                styles.typeCard,
                { borderColor: selectedType === t.type ? Colors.primary : colors.border },
                selectedType === t.type && { backgroundColor: Colors.primary + '10' },
              ]}
              onPress={() => setSelectedType(t.type)}
            >
              <Text style={styles.typeEmoji}>{t.icon}</Text>
              <Text style={[styles.typeLabel, { color: selectedType === t.type ? Colors.primary : colors.text }]}>
                {t.label}
              </Text>
              {t.proOnly && plan === 'free' && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Module selector */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Module (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
          <TouchableOpacity
            style={[styles.chip, { borderColor: !selectedModuleId ? Colors.primary : colors.border },
              !selectedModuleId && { backgroundColor: Colors.primary + '20' }]}
            onPress={() => setSelectedModuleId(null)}
          >
            <Text style={[styles.chipText, { color: !selectedModuleId ? Colors.primary : colors.textSecondary }]}>General</Text>
          </TouchableOpacity>
          {modules.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.chip, { borderColor: selectedModuleId === m.id ? m.color : colors.border },
                selectedModuleId === m.id && { backgroundColor: m.color + '20' }]}
              onPress={() => setSelectedModuleId(m.id)}
            >
              <Text style={[styles.chipText, { color: selectedModuleId === m.id ? m.color : colors.textSecondary }]}>{m.module_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Text input */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {selectedType === 'summary' ? 'Paste your notes' :
           selectedType === 'quiz' || selectedType === 'flashcards' ? 'Topic or notes to study' :
           selectedType === 'explanation' ? 'What do you need explained?' :
           'Tell me what you need to revise'}
        </Text>
        <TextInput
          style={[styles.textArea, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={selectedType === 'summary'
            ? 'Paste your lecture notes or topic here...'
            : 'Describe the topic or paste relevant text...'}
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoCapitalize="sentences"
        />

        <Button
          title={loading ? 'Generating...' : `Generate ${AI_TYPES.find(t => t.type === selectedType)?.label}`}
          onPress={handleGenerate}
          loading={loading}
          fullWidth
          size="lg"
        />

        {/* Output */}
        {output ? (
          <Card style={styles.outputCard}>
            <View style={styles.outputHeader}>
              <Text style={[styles.outputTitle, { color: colors.text }]}>
                {AI_TYPES.find(t => t.type === selectedType)?.icon} Result
              </Text>
              <TouchableOpacity onPress={() => setOutput('')}>
                <Ionicons name="close-circle-outline" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.outputText, { color: colors.text }]}>{output}</Text>

            {/* Action buttons for flashcards / quiz */}
            {selectedType === 'flashcards' && (
              <TouchableOpacity
                style={[styles.openAsBtn, { backgroundColor: Colors.primary }]}
                onPress={() => router.push({
                  pathname: '/flashcards',
                  params: {
                    content: encodeURIComponent(output),
                    title: encodeURIComponent(
                      selectedModuleId
                        ? `${modules.find(m => m.id === selectedModuleId)?.module_name ?? 'Flashcards'} — Flashcards`
                        : 'Flashcards'
                    ),
                  },
                })}
              >
                <Ionicons name="albums-outline" size={18} color="#fff" />
                <Text style={styles.openAsBtnText}>Open as Flashcards</Text>
              </TouchableOpacity>
            )}
            {selectedType === 'quiz' && (
              <TouchableOpacity
                style={[styles.openAsBtn, { backgroundColor: Colors.primary }]}
                onPress={() => router.push({
                  pathname: '/quiz',
                  params: {
                    content: encodeURIComponent(output),
                    title: encodeURIComponent(
                      selectedModuleId
                        ? `${modules.find(m => m.id === selectedModuleId)?.module_name ?? 'Quiz'} — Quiz`
                        : 'Quiz'
                    ),
                  },
                })}
              >
                <Ionicons name="help-circle-outline" size={18} color="#fff" />
                <Text style={styles.openAsBtnText}>Start Quiz</Text>
              </TouchableOpacity>
            )}
          </Card>
        ) : loading && (
          <View style={styles.loadingOutput}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Gemini is thinking...
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: Typography.md, fontWeight: Typography.bold },
  subtitle: { fontSize: Typography.xs },

  content: { padding: Spacing.base, gap: Spacing.base },
  integrityNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  integrityText: { flex: 1, fontSize: Typography.xs, lineHeight: 18 },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, marginBottom: Spacing.sm },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  typeCard: { width: '30%', alignItems: 'center', padding: Spacing.sm, borderRadius: BorderRadius.lg, borderWidth: 1.5, gap: 4 },
  typeEmoji: { fontSize: 24 },
  typeLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, textAlign: 'center' },
  proBadge: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingHorizontal: 5, paddingVertical: 1 },
  proBadgeText: { color: '#fff', fontSize: 9, fontWeight: Typography.bold as any },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5, marginRight: Spacing.sm },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.medium },
  textArea: { borderWidth: 1.5, borderRadius: BorderRadius.lg, padding: Spacing.md, fontSize: Typography.base, minHeight: 120, marginBottom: Spacing.base },
  outputCard: { gap: Spacing.md },
  outputHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  outputTitle: { fontSize: Typography.md, fontWeight: Typography.bold },
  outputText: { fontSize: Typography.base, lineHeight: 24 },
  loadingOutput: { alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  loadingText: { fontSize: Typography.sm },
  openAsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.sm },
  openAsBtnText: { color: '#fff', fontWeight: Typography.semibold, fontSize: Typography.sm },
});
