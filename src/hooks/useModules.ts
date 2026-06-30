import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Module } from '../types';
import { useAuth } from '../context/AuthContext';

export function useModules() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setModules((data as Module[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addModule(module: Omit<Module, 'id' | 'user_id' | 'created_at'>) {
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase
      .from('modules')
      .insert({ ...module, user_id: user.id });
    if (!error) await fetch();
    return { error: error?.message ?? null };
  }

  async function updateModule(id: string, updates: Partial<Module>) {
    const { error } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', id);
    if (!error) await fetch();
    return { error: error?.message ?? null };
  }

  async function deleteModule(id: string) {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);
    if (!error) await fetch();
    return { error: error?.message ?? null };
  }

  return { modules, loading, error, refetch: fetch, addModule, updateModule, deleteModule };
}
