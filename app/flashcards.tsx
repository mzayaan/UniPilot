import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/lib/theme';
import { useTheme } from '../src/context/ThemeContext';

interface Flashcard {
  question: string;
  answer: string;
}

/**
 * Parse AI flashcard output.
 * Expects format like:
 *   **Card 1**
 *   Q: What is...
 *   A: The answer
 *
 *   **Card 2**
 *   ...
 *
 * Falls back to splitting on Q:/A: pairs if no card headers found.
 */
function parseFlashcards(raw: string): Flashcard[] {
  const cards: Flashcard[] = [];

  // Try splitting by card headers or numbered blocks
  const blocks = raw.split(/(?:\*\*Card\s*\d+\*\*|##\s*Card\s*\d+|\n\n(?=\d+\.))/i).filter(b => b.trim());

  for (const block of blocks) {
    const qMatch = block.match(/Q[:\.]?\s*(.+?)(?=\nA[:\.]?|$)/is);
    const aMatch = block.match(/A[:\.]?\s*(.+)/is);
    if (qMatch && aMatch) {
      cards.push({
        question: qMatch[1].trim().replace(/\*\*/g, ''),
        answer: aMatch[1].trim().replace(/\*\*/g, ''),
      });
    }
  }

  // If no structured format found, try line-by-line Q/A pairs
  if (cards.length === 0) {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    let currentQ = '';
    for (const line of lines) {
      if (/^Q[:\.]?\s+/i.test(line)) {
        currentQ = line.replace(/^Q[:\.]?\s*/i, '');
      } else if (/^A[:\.]?\s+/i.test(line) && currentQ) {
        cards.push({
          question: currentQ.replace(/\*\*/g, ''),
          answer: line.replace(/^A[:\.]?\s*/i, '').replace(/\*\*/g, ''),
        });
        currentQ = '';
      }
    }
  }

  return cards;
}

export default function FlashcardsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ content?: string; title?: string }>();

  const rawContent = params.content ? decodeURIComponent(params.content) : '';
  const title = params.title ? decodeURIComponent(params.title) : 'Flashcards';
  const cards = parseFlashcards(rawContent);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const current = cards[currentIdx];

  function flip() {
    if (isAnimating.current) return;
    isAnimating.current = true;
    const toValue = flipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }).start(() => {
      isAnimating.current = false;
    });
    setFlipped(!flipped);
  }

  function markKnown() {
    setKnown(prev => new Set([...prev, currentIdx]));
    setUnknown(prev => { const s = new Set(prev); s.delete(currentIdx); return s; });
    advance();
  }

  function markUnknown() {
    setUnknown(prev => new Set([...prev, currentIdx]));
    setKnown(prev => { const s = new Set(prev); s.delete(currentIdx); return s; });
    advance();
  }

  function advance() {
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(i => i + 1);
      resetFlip();
    } else {
      setDone(true);
    }
  }

  function resetFlip() {
    flipAnim.setValue(0);
    setFlipped(false);
  }

  function restart() {
    setCurrentIdx(0);
    resetFlip();
    setKnown(new Set());
    setUnknown(new Set());
    setDone(false);
  }

  // Animated styles
  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0.4, 0.5], outputRange: [1, 0] });
  const backOpacity  = flipAnim.interpolate({ inputRange: [0.4, 0.5], outputRange: [0, 1] });

  if (cards.length === 0) {
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
          <Text style={{ fontSize: 48 }}>🃏</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No flashcards found. Go back to the AI Coach and generate flashcards first.
          </Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: Colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    const knownCount = known.size;
    const unknownCount = unknown.size;
    const pct = Math.round((knownCount / cards.length) * 100);

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Session Complete</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.doneContainer}>
          <Text style={{ fontSize: 64 }}>{pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'}</Text>
          <Text style={[styles.doneTitle, { color: colors.text }]}>
            {pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good progress!' : 'Keep studying!'}
          </Text>
          <Text style={[styles.doneSubtitle, { color: colors.textSecondary }]}>
            You scored {pct}% on this deck
          </Text>

          <View style={styles.scoreRow}>
            <View style={[styles.scoreBox, { backgroundColor: Colors.success + '20' }]}>
              <Text style={[styles.scoreNum, { color: Colors.success }]}>{knownCount}</Text>
              <Text style={[styles.scoreLabel, { color: Colors.success }]}>Knew it ✓</Text>
            </View>
            <View style={[styles.scoreBox, { backgroundColor: Colors.danger + '20' }]}>
              <Text style={[styles.scoreNum, { color: Colors.danger }]}>{unknownCount}</Text>
              <Text style={[styles.scoreLabel, { color: Colors.danger }]}>Review ✗</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.restartBtn, { backgroundColor: Colors.primary }]}
            onPress={restart}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.restartText}>Study Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.doneBtn, { borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.doneBtnText, { color: colors.textSecondary }]}>Done</Text>
          </TouchableOpacity>
        </View>
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
          {currentIdx + 1}/{cards.length}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, {
          width: `${((currentIdx) / cards.length) * 100}%`,
          backgroundColor: Colors.primary,
        }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card */}
        <View style={styles.cardContainer}>
          {/* Front */}
          <Animated.View style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            { transform: [{ rotateY: frontRotate }], opacity: frontOpacity },
          ]}>
            <Text style={[styles.cardSide, { color: colors.textTertiary }]}>QUESTION</Text>
            <Text style={[styles.cardText, { color: colors.text }]}>{current.question}</Text>
            <Text style={[styles.tapHint, { color: colors.textTertiary }]}>Tap to reveal answer</Text>
          </Animated.View>

          {/* Back */}
          <Animated.View style={[
            styles.card, styles.cardBack,
            { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' },
            { transform: [{ rotateY: backRotate }], opacity: backOpacity },
          ]}>
            <Text style={[styles.cardSide, { color: Colors.primary }]}>ANSWER</Text>
            <Text style={[styles.cardText, { color: colors.text }]}>{current.answer}</Text>
          </Animated.View>
        </View>

        <TouchableOpacity style={[styles.flipBtn, { borderColor: Colors.primary }]} onPress={flip}>
          <Ionicons name="sync-outline" size={18} color={Colors.primary} />
          <Text style={[styles.flipBtnText, { color: Colors.primary }]}>
            {flipped ? 'Show Question' : 'Reveal Answer'}
          </Text>
        </TouchableOpacity>

        {/* Action buttons — only show when flipped */}
        {flipped && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.danger + '15', borderColor: Colors.danger + '40' }]}
              onPress={markUnknown}
            >
              <Ionicons name="close" size={22} color={Colors.danger} />
              <Text style={[styles.actionLabel, { color: Colors.danger }]}>Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.success + '15', borderColor: Colors.success + '40' }]}
              onPress={markKnown}
            >
              <Ionicons name="checkmark" size={22} color={Colors.success} />
              <Text style={[styles.actionLabel, { color: Colors.success }]}>Got it!</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Skip button */}
        {!flipped && (
          <TouchableOpacity style={styles.skipBtn} onPress={advance}>
            <Text style={[styles.skipText, { color: colors.textTertiary }]}>Skip →</Text>
          </TouchableOpacity>
        )}

        {/* Mini tracker */}
        <View style={styles.trackerRow}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[
                styles.trackerDot,
                i === currentIdx && { backgroundColor: Colors.primary },
                known.has(i) && { backgroundColor: Colors.success },
                unknown.has(i) && { backgroundColor: Colors.danger },
                !known.has(i) && !unknown.has(i) && i !== currentIdx && { backgroundColor: colors.border },
              ]}
            />
          ))}
        </View>
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
  content: { padding: Spacing.base, gap: Spacing.base, alignItems: 'center', flexGrow: 1 },
  cardContainer: { width: '100%', height: 280, position: 'relative', perspective: 1000 },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backfaceVisibility: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cardBack: { position: 'absolute', top: 0, left: 0 },
  cardSide: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1 },
  cardText: { fontSize: Typography.md, fontWeight: Typography.medium, textAlign: 'center', lineHeight: 26 },
  tapHint: { fontSize: Typography.xs, marginTop: Spacing.sm },
  flipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  flipBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  actionRow: { flexDirection: 'row', gap: Spacing.base, width: '100%' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  actionLabel: { fontSize: Typography.base, fontWeight: Typography.semibold },
  skipBtn: { alignSelf: 'center', padding: Spacing.sm },
  skipText: { fontSize: Typography.sm },
  trackerRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', paddingVertical: Spacing.sm },
  trackerDot: { width: 8, height: 8, borderRadius: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  emptyText: { textAlign: 'center', fontSize: Typography.base, lineHeight: 24 },
  backBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full },
  backBtnText: { color: '#fff', fontWeight: Typography.semibold, fontSize: Typography.base },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  doneTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, textAlign: 'center' },
  doneSubtitle: { fontSize: Typography.base, textAlign: 'center' },
  scoreRow: { flexDirection: 'row', gap: Spacing.lg, width: '100%' },
  scoreBox: { flex: 1, alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.xl, gap: Spacing.xs },
  scoreNum: { fontSize: 48, fontWeight: Typography.bold },
  scoreLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  restartBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full, width: '100%', justifyContent: 'center' },
  restartText: { color: '#fff', fontWeight: Typography.semibold, fontSize: Typography.base },
  doneBtn: { width: '100%', alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  doneBtnText: { fontSize: Typography.base },
});
