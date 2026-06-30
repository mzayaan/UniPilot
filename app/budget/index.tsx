import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { PLAN_LIMITS } from '../../src/types';

type Category = 'Food' | 'Transport' | 'Books' | 'Entertainment' | 'Rent' | 'Utilities' | 'Clothing' | 'Health' | 'Other';

const CATEGORIES: Category[] = [
  'Food', 'Transport', 'Books', 'Entertainment',
  'Rent', 'Utilities', 'Clothing', 'Health', 'Other',
];

const CATEGORY_ICONS: Record<Category, string> = {
  Food: '🍔', Transport: '🚌', Books: '📚', Entertainment: '🎮',
  Rent: '🏠', Utilities: '💡', Clothing: '👕', Health: '💊', Other: '💰',
};

const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#FF6B6B', Transport: '#4ECDC4', Books: '#45B7D1', Entertainment: '#96CEB4',
  Rent: '#DDA0DD', Utilities: '#FFD93D', Clothing: '#FF8C94', Health: '#88D8B0', Other: '#A8A8A8',
};

interface BudgetRecord {
  id: string;
  month_year: string;
  monthly_limit: number;
  monthly_income: number;
}

interface ExpenseRecord {
  id: string;
  budget_id: string;
  amount: number;
  category: Category;
  description: string | null;
  expense_date: string;
}

function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthYear(my: string): string {
  const [y, m] = my.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

export default function BudgetScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, subscription } = useAuth();
  const plan = subscription?.plan_name ?? 'free';
  const canUseBudget = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.budgetTracker ?? false;

  const [budget, setBudget] = useState<BudgetRecord | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthYear, setMonthYear] = useState(getCurrentMonthYear());

  // Budget setup modal
  const [showSetup, setShowSetup] = useState(false);
  const [limitInput, setLimitInput] = useState('');
  const [incomeInput, setIncomeInput] = useState('');
  const [setupSaving, setSetupSaving] = useState(false);

  // Add expense modal
  const [showAdd, setShowAdd] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<Category>('Food');
  const [expDesc, setExpDesc] = useState('');
  const [expSaving, setExpSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: budgetData } = await supabase
      .from('budgets')
      .select('id, month_year, monthly_limit, monthly_income')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .maybeSingle();

    const b = budgetData as BudgetRecord | null;
    setBudget(b);

    if (b) {
      const { data: expData } = await supabase
        .from('expenses')
        .select('id, budget_id, amount, category, description, expense_date')
        .eq('budget_id', b.id)
        .order('expense_date', { ascending: false });
      setExpenses((expData as ExpenseRecord[]) ?? []);
    } else {
      setExpenses([]);
    }

    setLoading(false);
  }, [user, monthYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSetupBudget() {
    if (!user) return;
    const limit = parseFloat(limitInput);
    const income = parseFloat(incomeInput) || 0;
    if (!limit || limit <= 0) { Alert.alert('Error', 'Enter a valid monthly spending limit.'); return; }

    setSetupSaving(true);
    if (budget) {
      await supabase.from('budgets').update({ monthly_limit: limit, monthly_income: income }).eq('id', budget.id);
    } else {
      await supabase.from('budgets').insert({
        user_id: user.id,
        month_year: monthYear,
        monthly_limit: limit,
        monthly_income: income,
      });
    }
    setSetupSaving(false);
    setShowSetup(false);
    fetchData();
  }

  async function handleAddExpense() {
    if (!budget) return;
    const amount = parseFloat(expAmount);
    if (!amount || amount <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }

    setExpSaving(true);
    const { error } = await supabase.from('expenses').insert({
      budget_id: budget.id,
      user_id: user!.id,
      amount,
      category: expCategory,
      description: expDesc.trim() || null,
      expense_date: new Date().toISOString().split('T')[0],
    });
    setExpSaving(false);
    if (error) Alert.alert('Error', error.message);
    else {
      setShowAdd(false);
      setExpAmount('');
      setExpDesc('');
      fetchData();
    }
  }

  async function handleDeleteExpense(id: string) {
    Alert.alert('Delete', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('expenses').delete().eq('id', id);
          fetchData();
        },
      },
    ]);
  }

  function prevMonth() {
    const [y, m] = monthYear.split('-').map(Number);
    if (m === 1) setMonthYear(`${y - 1}-12`);
    else setMonthYear(`${y}-${String(m - 1).padStart(2, '0')}`);
  }

  function nextMonth() {
    const [y, m] = monthYear.split('-').map(Number);
    if (m === 12) setMonthYear(`${y + 1}-01`);
    else setMonthYear(`${y}-${String(m + 1).padStart(2, '0')}`);
  }

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = budget ? budget.monthly_limit - totalSpent : 0;
  const pct = budget && budget.monthly_limit > 0 ? Math.min(100, (totalSpent / budget.monthly_limit) * 100) : 0;
  const isOverBudget = budget ? totalSpent > budget.monthly_limit : false;

  // Group by category
  const byCategory: Record<string, number> = {};
  for (const exp of expenses) {
    byCategory[exp.category] = (byCategory[exp.category] ?? 0) + exp.amount;
  }
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  if (!canUseBudget) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 }}>
          <Text style={{ fontSize: 48 }}>💰</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' }}>Budget Tracker</Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            Track your student budget, expenses, and spending limits. Available on Pro and above.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
            onPress={() => router.push('/subscription')}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Upgrade to Pro</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {formatMonthYear(monthYear)}
          </Text>
          <TouchableOpacity onPress={nextMonth}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => {
          setLimitInput(budget?.monthly_limit?.toString() ?? '');
          setIncomeInput(budget?.monthly_income?.toString() ?? '');
          setShowSetup(true);
        }}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!budget ? (
          <View style={styles.setupPrompt}>
            <Text style={{ fontSize: 56, textAlign: 'center' }}>💰</Text>
            <Text style={[styles.setupTitle, { color: colors.text }]}>Set Your Budget</Text>
            <Text style={[styles.setupSubtitle, { color: colors.textSecondary }]}>
              Track spending for {formatMonthYear(monthYear)} and stay on top of your finances.
            </Text>
            <Button
              title="Set Monthly Budget"
              onPress={() => { setLimitInput(''); setIncomeInput(''); setShowSetup(true); }}
              fullWidth
              size="lg"
            />
          </View>
        ) : (
          <>
            {/* Summary card */}
            <View style={[styles.summaryCard, {
              backgroundColor: isOverBudget ? Colors.danger + '15' : Colors.primary + '12',
              borderColor: isOverBudget ? Colors.danger + '30' : Colors.primary + '25',
              borderWidth: 1,
              borderRadius: BorderRadius.xl,
              padding: Spacing.lg,
              gap: Spacing.md,
            }]}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Spent</Text>
                  <Text style={[styles.summaryAmount, { color: isOverBudget ? Colors.danger : colors.text }]}>
                    £{totalSpent.toFixed(2)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Budget</Text>
                  <Text style={[styles.summaryAmount, { color: colors.text }]}>
                    £{budget.monthly_limit.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, {
                  width: `${pct}%`,
                  backgroundColor: isOverBudget ? Colors.danger : pct > 75 ? Colors.warning : Colors.success,
                }]} />
              </View>

              <View style={styles.summaryFooter}>
                <Text style={[styles.summaryPct, { color: colors.textSecondary }]}>
                  {pct.toFixed(0)}% used
                </Text>
                <Text style={[styles.summaryRemaining, { color: isOverBudget ? Colors.danger : Colors.success }]}>
                  {isOverBudget
                    ? `£${(totalSpent - budget.monthly_limit).toFixed(2)} over budget`
                    : `£${remaining.toFixed(2)} remaining`}
                </Text>
              </View>

              {budget.monthly_income > 0 && (
                <Text style={[styles.incomeNote, { color: colors.textSecondary }]}>
                  Income: £{budget.monthly_income.toFixed(2)} · Savings: £{(budget.monthly_income - totalSpent).toFixed(2)}
                </Text>
              )}
            </View>

            {/* Category breakdown */}
            {categoryEntries.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Breakdown</Text>
                <Card>
                  {categoryEntries.map(([cat, amount], idx) => {
                    const catPct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                    return (
                      <View
                        key={cat}
                        style={[styles.catRow, idx < categoryEntries.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border + '40' }]}
                      >
                        <Text style={styles.catIcon}>{CATEGORY_ICONS[cat as Category] ?? '💰'}</Text>
                        <View style={{ flex: 1 }}>
                          <View style={styles.catLabelRow}>
                            <Text style={[styles.catName, { color: colors.text }]}>{cat}</Text>
                            <Text style={[styles.catAmount, { color: colors.text }]}>£{amount.toFixed(2)}</Text>
                          </View>
                          <View style={[styles.catTrack, { backgroundColor: colors.border }]}>
                            <View style={[styles.catFill, {
                              width: `${catPct}%`,
                              backgroundColor: CATEGORY_COLORS[cat as Category] ?? Colors.primary,
                            }]} />
                          </View>
                        </View>
                        <Text style={[styles.catPct, { color: colors.textTertiary }]}>{catPct.toFixed(0)}%</Text>
                      </View>
                    );
                  })}
                </Card>
              </View>
            )}

            {/* Expense list */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Expenses ({expenses.length})
                </Text>
                <TouchableOpacity
                  style={[styles.addExpBtn, { backgroundColor: Colors.primary }]}
                  onPress={() => { setExpAmount(''); setExpDesc(''); setShowAdd(true); }}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addExpText}>Add</Text>
                </TouchableOpacity>
              </View>

              {expenses.length === 0 ? (
                <TouchableOpacity onPress={() => setShowAdd(true)}>
                  <Card>
                    <View style={styles.emptyExpenses}>
                      <Ionicons name="receipt-outline" size={32} color={Colors.primary} />
                      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        No expenses yet. Tap to add your first one.
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ) : (
                expenses.map(exp => (
                  <Card key={exp.id} style={styles.expCard}>
                    <View style={styles.expRow}>
                      <View style={[styles.expIcon, { backgroundColor: (CATEGORY_COLORS[exp.category] ?? Colors.primary) + '20' }]}>
                        <Text style={{ fontSize: 18 }}>{CATEGORY_ICONS[exp.category] ?? '💰'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.expDesc, { color: colors.text }]}>
                          {exp.description ?? exp.category}
                        </Text>
                        <Text style={[styles.expMeta, { color: colors.textSecondary }]}>
                          {exp.category} · {new Date(exp.expense_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                      <Text style={[styles.expAmount, { color: colors.text }]}>
                        £{exp.amount.toFixed(2)}
                      </Text>
                      <TouchableOpacity onPress={() => handleDeleteExpense(exp.id)}>
                        <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))
              )}
            </View>
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      {budget && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: Colors.primary }]}
          onPress={() => { setExpAmount(''); setExpDesc(''); setShowAdd(true); }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Budget Setup Modal */}
      <Modal visible={showSetup} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowSetup(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {budget ? 'Edit Budget' : 'Set Up Budget'} — {formatMonthYear(monthYear)}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Monthly Income (optional)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              value={incomeInput}
              onChangeText={setIncomeInput}
              placeholder="e.g. 1500"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Monthly Spending Limit *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              value={limitInput}
              onChangeText={setLimitInput}
              placeholder="e.g. 500"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Button
              title="Save Budget"
              onPress={handleSetupBudget}
              loading={setupSaving}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.lg }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Expense Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Expense</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Amount *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              value={expAmount}
              onChangeText={setExpAmount}
              placeholder="e.g. 12.50"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Category</Text>
            <View style={styles.catChips}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    { borderColor: expCategory === cat ? CATEGORY_COLORS[cat] : colors.border },
                    expCategory === cat && { backgroundColor: CATEGORY_COLORS[cat] + '25' },
                  ]}
                  onPress={() => setExpCategory(cat)}
                >
                  <Text>{CATEGORY_ICONS[cat]}</Text>
                  <Text style={[styles.catChipText, { color: expCategory === cat ? CATEGORY_COLORS[cat] : colors.textSecondary }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description (optional)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              value={expDesc}
              onChangeText={setExpDesc}
              placeholder="e.g. Tesco weekly shop"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="sentences"
            />
            <Button
              title="Add Expense"
              onPress={handleAddExpense}
              loading={expSaving}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.lg }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  monthTitle: { fontSize: Typography.md, fontWeight: Typography.bold, minWidth: 120, textAlign: 'center' },
  content: { padding: Spacing.base, gap: Spacing.base },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { fontSize: Typography.xs },
  summaryAmount: { fontSize: Typography.xl, fontWeight: Typography.bold },
  progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryPct: { fontSize: Typography.sm },
  summaryRemaining: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  incomeNote: { fontSize: Typography.xs },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.bold },
  addExpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full },
  addExpText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.semibold },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  catIcon: { fontSize: 20, width: 28 },
  catLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { fontSize: Typography.sm, fontWeight: Typography.medium },
  catAmount: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  catTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 3 },
  catPct: { fontSize: Typography.xs, width: 32, textAlign: 'right' },
  emptyExpenses: { alignItems: 'center', padding: Spacing.lg, gap: Spacing.sm },
  emptyText: { textAlign: 'center', fontSize: Typography.sm, lineHeight: 20 },
  expCard: { padding: Spacing.md },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  expIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  expDesc: { fontSize: Typography.sm, fontWeight: Typography.medium },
  expMeta: { fontSize: Typography.xs, marginTop: 2 },
  expAmount: { fontSize: Typography.base, fontWeight: Typography.bold },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  setupPrompt: { alignItems: 'center', paddingTop: 60, gap: Spacing.lg },
  setupTitle: { fontSize: Typography.xl, fontWeight: Typography.bold },
  setupSubtitle: { fontSize: Typography.base, textAlign: 'center', lineHeight: 22 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1 },
  modalTitle: { fontSize: Typography.md, fontWeight: Typography.semibold },
  modalContent: { padding: Spacing.base, gap: Spacing.xs },
  formLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, marginTop: Spacing.md, marginBottom: Spacing.xs },
  input: { borderWidth: 1.5, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, fontSize: Typography.base },
  catChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.sm, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  catChipText: { fontSize: Typography.xs, fontWeight: Typography.medium },
  summaryCard: {},
});
