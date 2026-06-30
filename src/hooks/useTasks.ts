import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { scheduleTaskReminders } from '../lib/notifications';

export function useTasks(moduleId?: string) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from('tasks')
      .select('*, module:modules(*)')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    if (moduleId) query = query.eq('module_id', moduleId);

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      const now = new Date();
      const toMark: string[] = [];

      const updated = (data as Task[]).map(t => {
        if (
          t.due_date &&
          new Date(t.due_date) < now &&
          t.status !== 'Completed' &&
          t.status !== 'Overdue'
        ) {
          toMark.push(t.id);
          return { ...t, status: 'Overdue' as TaskStatus };
        }
        return t;
      });

      setTasks(updated);

      if (toMark.length > 0) {
        await supabase
          .from('tasks')
          .update({ status: 'Overdue' })
          .in('id', toMark);
      }
    }
    setLoading(false);
  }, [user, moduleId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addTask(task: Omit<Task, 'id' | 'user_id' | 'created_at'>) {
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: user.id })
      .select()
      .single();

    if (!error && data && data.due_date) {
      scheduleTaskReminders(data.id, data.title, data.due_date).catch(() => {});
    }

    if (!error) await fetch();
    return { error: error?.message ?? null };
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (!error) {
      if (updates.due_date) {
        const task = tasks.find(t => t.id === id);
        if (task) {
          scheduleTaskReminders(id, updates.title ?? task.title, updates.due_date).catch(() => {});
        }
      }
      await fetch();
    }
    return { error: error?.message ?? null };
  }

  async function deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (!error) await fetch();
    return { error: error?.message ?? null };
  }

  async function updateProgress(id: string, progress: number) {
    const status: TaskStatus = progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started';
    return updateTask(id, { progress, status });
  }

  return { tasks, loading, error, refetch: fetch, addTask, updateTask, deleteTask, updateProgress };
}
