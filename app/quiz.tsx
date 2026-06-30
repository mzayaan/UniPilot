import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/lib/theme';
import { useTheme } from '../src/context/ThemeContext';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

/**
 * Parse AI quiz output.
 * Expects format like:
 *   **Question 1**
 *   What is...?
 *   A) Option 1
 *   B) Option 2
 *   C) Option 3
 *   D) Option 4
 *   Answer: B
 *   Explanation: Because...
 */
function parseQuiz(raw: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Split on question boundaries
  const blocks = raw.split(/(?:\*\*Question\s*\d+\*\*|\n(?=\d+\.)|\n\n(?=Q\d))/i).filter(b => b.trim().length > 10);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    // Find question text (first non-option, non-answer line)
    const optionPattern = /^[A-Da-d][).\]]\s+/;
    const answerPattern = /^(?:Answer|Correct)[:\s]+([A-Da-d])/i;
    const explainPattern = /^(?:Explanation|Note)[:\s]+(.+)/i;

    let questionLines: string[] = [];
    let options: string[] = [];
    let correctLetter = '';
    let explanation = '';

    for (const line of lines) {
      if (answerPattern.test(line)) {
        const m = line.match(answerPattern);
        if (m) correctLetter = m[1].toUpperCase();
      } else if (explainPattern.test(line)) {
        const m = line.match(explainPattern);
        if (m) explanation = m[1];
      } else if (optionPattern.test(line)) {
        options.push(line.replace(/^[A-Da-d][).\]]\s+/, '').replace(/\*\*/g, ''));
      } else if (options.length === 0) {
        // Still building question text
        const clean = line.replace(/^\*\*Question\s*\d+\*\*\s*/i, '').replace(/\*\*/g, '').trim();
        if (clean) questionLines.push(clean);
      }
    }

    const questionText = questionLines.join(' ').trim();
    if (!questionText || options.length < 2) continue;

    const correctIndex = correctLetter
      ? 'ABCD'.indexOf(correctLetter.toUpperCase())
      : 0;

    questions.push({
      question: questionText,
      options,
      correctIndex: Math.max(0, Math.min(correctIndex, options.length - 1)),
      explanation: explanation || undefined,
    });
  }

  return questions;
}

export default function QuizScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ content?: string; title?: string }>();

  const rawContent = params.content ? decodeURIComponent(params.content) : '';
  const title = params.title ? decodeURIComponent(params.title) : 'Quiz';
  const questions = useMemo(() => parseQuiz(rawContent), [rawContent]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const current = questions[currentIdx];

  function handleSelect(idx: number) {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
    const correct = idx === current.correctIndex;
    if (correct) setScore(s => s + 1);
    setAnswers(prev => [...prev, correct]);
  }

  function handleNext() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setDone(true);
    }
  }

  function restart() {
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswered(false);
    setScore(0);
    setDone(false);
    setAnswers([]);
  }

  function optionColor(idx: number): string {
    if (!answered) return colors.card;
    if (idx === current.correctIndex) return Colors.success + '20';
    if (idx === selectedOption) return Colors.danger + '20';
    return colors.card;
  }

  function optionBorderColor(idx: number): string {
    if (!answered) return colors.border;
    if (idx === current.correctIndex) return Colors.success;
    if (idx === selectedOption) return Colors.danger;
    return colors.border;
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48 }}>❓</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No quiz questions found. Go back and generate a quiz with the AI Coach.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: Colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Results</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.doneContainer}>
          <Text style={{ fontSize: 64 }}>{pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'}</Text>
          <Text style={[styles.doneTitle, { color: colors.text }]}>
            {pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Not bad!' : 'Keep revising!'}
          </Text>
          <View style={[styles.scoreBig, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}>
            <Text style={[styles.scorePct, { color: Colors.primary }]}>{pct}%</Text>
            <Text style={[styles.scoreDetail, { color: colors.textSecondary }]}>
              {score} out of {questions.length} correct
            </Text>
          </View>

          {/* Per-question summary */}
          {questions.map((q, i) => (
            <View
              key={i}
              style={[
                styles.summaryRow,
                { borderColor: answers[i] ? Colors.success + '40' : Colors.danger + '40' },
                { backgroundColor: answers[i] ? Colors.success + '10' : Colors.danger + '10' },
              ]}
            >
              <Ionicons
                name={answers[i] ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={answers[i] ? Colors.success : Colors.danger}
              />
              <Text style={[styles.summaryText, { color: colors.text }]} numberOfLines={2}>
                Q{i + 1}: {q.question}
              </Text>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: Colors.primary, width: '100%' }]}
            onPress={restart}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Retry Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.border, width: '100%' }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.outlineBtnText, { color: colors.textSecondary }]}>Done</Text>
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.counter, { color: colors.textSecondary }]}>
          {currentIdx + 1}/{questions.length}
        </Text>
      </View>

      {/* Progress */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, {
          width: `${(currentIdx / questions.length) * 100}%`,
          backgroundColor: Colors.primary,
        }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Score indicator */}
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreLabel, { color: Colors.success }]}>✓ {score}</Text>
          <Text style={[styles.scoreLabel, { color: Colors.danger }]}>✗ {answers.filter(a => !a).length}</Text>
        </View>

        {/* Question */}
        <View style={[styles.questionCard, { backgroundColor: Colors.primary, }]}>
          <Text style={styles.questionNum}>Question {currentIdx + 1}</Text>
          <Text style={styles.questionText}>{current.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {current.options.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionBtn,
                { backgroundColor: optionColor(idx), borderColor: optionBorderColor(idx) },
              ]}
              onPress={() => handleSelect(idx)}
              disabled={answered}
            >
              <View style={[
                styles.optionLetter,
                {
                  backgroundColor: answered
                    ? (idx === current.correctIndex ? Colors.success : idx === selectedOption ? Colors.danger : colors.border + '80')
                    : Colors.primary + '20',
                },
              ]}>
                <Text style={[
                  styles.optionLetterText,
                  {
                    color: answered
                      ? (idx === current.correctIndex || idx === selectedOption ? '#fff' : colors.textSecondary)
                      : Colors.primary,
                  },
                ]}>
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
              {answered && idx === current.correctIndex && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              )}
              {answered && idx === selectedOption && idx !== current.correctIndex && (
                <Ionicons name="close-circle" size={20} color={Colors.danger} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Explanation */}
        {answered && current.explanation && (
          <View style={[styles.explanationBox, { backgroundColor: Colors.info + '15', borderColor: Colors.info + '40' }]}>
            <Ionicons name="bulb-outline" size={18} color={Colors.info} />
            <Text style={[styles.explanationText, { color: colors.text }]}>{current.explanation}</Text>
          </View>
        )}

        {/* Next button */}
        {answered && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: Colors.primary, width: '100%', marginTop: Spacing.sm }]}
            onPress={handleNext}
          >
            <Text style={styles.primaryBtnText}>
              {currentIdx === questions.length - 1 ? 'See Results' : 'Next Question →'}
            </Text>
          </TouchableOpacity>
        )}

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
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, flex: 1, textAlign: 'center', marginHorizontal: Spacing.sm },
  counter: { fontSize: Typography.sm, fontWeight: Typography.medium },
  progressTrack: { height: 3, overflow: 'hidden' },
  progressFill: { height: '100%' },
  content: { padding: Spacing.base, gap: Spacing.md },
  scoreRow: { flexDirection: 'row', gap: Spacing.xl, justifyContent: 'center' },
  scoreLabel: { fontSize: Typography.base, fontWeight: Typography.bold },
  questionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  questionNum: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 0.5 },
  questionText: { color: '#fff', fontSize: Typography.md, fontWeight: Typography.semibold, lineHeight: 26 },
  optionsContainer: { gap: Spacing.sm },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: { fontSize: Typography.sm, fontWeight: Typography.bold },
  optionText: { flex: 1, fontSize: Typography.base, lineHeight: 22 },
  explanationBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  explanationText: { flex: 1, fontSize: Typography.sm, lineHeight: 20 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  primaryBtnText: { color: '#fff', fontWeight: Typography.semibold, fontSize: Typography.base },
  outlineBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  outlineBtnText: { fontSize: Typography.base },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  emptyText: { textAlign: 'center', fontSize: Typography.base, lineHeight: 24 },
  doneContainer: { padding: Spacing.base, alignItems: 'center', gap: Spacing.base },
  doneTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold },
  scoreBig: {
    width: '100%',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  scorePct: { fontSize: 56, fontWeight: Typography.bold },
  scoreDetail: { fontSize: Typography.base },
  summaryRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  summaryText: { flex: 1, fontSize: Typography.sm, lineHeight: 20 },
});
