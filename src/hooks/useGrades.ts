import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Grade } from '../types';
import { useAuth } from '../context/AuthContext';

export function useGrades(moduleId: string) {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('grades')
      .select('*')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .order('created_at', { ascending: false });
    setGrades((data as Grade[]) ?? []);
    setLoading(false);
  }, [user, moduleId]);

  useEffect(() => { fetch(); }, [fetch]);

  // Calculate weighted average
  function calculateCurrentMark(): number | null {
    const graded = grades.filter(g => g.mark_obtained !== null);
    if (graded.length === 0) return null;
    const totalWeight = graded.reduce((sum, g) => sum + g.weight, 0);
    if (totalWeight === 0) return null;
    const weighted = graded.reduce((sum, g) => {
      const pct = ((g.mark_obtained ?? 0) / g.max_mark) * 100;
      return sum + pct * (g.weight / totalWeight);
    }, 0);
    return Math.round(weighted * 10) / 10;
  }

  // Projected final mark (fills unknowns with target percentage)
  function projectFinalMark(targetPercent: number): number {
    const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
    const earnedWeight = grades.reduce((sum, g) => {
      const pct = g.mark_obtained !== null
        ? ((g.mark_obtained) / g.max_mark) * 100
        : targetPercent;
      return sum + pct * (g.weight / 100);
    }, 0);
    return Math.round(earnedWeight * 10) / 10;
  }

  async function addGrade(grade: Omit<Grade, 'id' | 'user_id' | 'created_at'>) {
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase
      .from('grades')
      .insert({ ...grade, user_id: user.id });
    if (!error) await fetch();
    return { error: error?.message ?? null };
  }

  async function updateGrade(id: string, updates: Partial<Grade>) {
    const { error } = await supabase
      .from('grades')
      .update(updates)
      .eq('id', id);
    if (!error) await fetch();
    return { error: error?.message ?? null };
  }

  async function deleteGrade(id: string) {
    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('id', id);
    if (!error) await fetch();
    return { error: error?.message ?? null };
  }

  return {
    grades, loading, refetch: fetch,
    calculateCurrentMark, projectFinalMark,
    addGrade, updateGrade, deleteGrade,
  };
}
