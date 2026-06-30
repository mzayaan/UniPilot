import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Badge } from '../../src/components/ui/Badge';
import { useModules } from '../../src/hooks/useModules';
import { useTasks } from '../../src/hooks/useTasks';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { priorityColors, statusColors } from '../../src/lib/theme';
import { supabase } from '../../src/lib/supabase';

interface Note {
  id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  created_at: string;
}

export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { modules, loading: modLoading } = useModules();
  const { tasks, loading: taskLoading } = useTasks(id);

  const module = modules.find(m => m.id === id);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!user || !id) return;
    setNotesLoading(true);
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('module_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotes((data as Note[]) ?? []);
    setNotesLoading(false);
  }, [user, id]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  async function handleUploadFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      setUploading(true);

      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const fileName = `${user!.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('lecture-notes')
        .upload(fileName, byteArray, {
          contentType: file.mimeType ?? 'application/octet-stream',
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('lecture-notes')
        .getPublicUrl(fileName);

      const { error: noteError } = await supabase.from('notes').insert({
        user_id: user!.id,
        module_id: id,
        title: file.name,
        file_url: urlData.publicUrl,
      });
      if (noteError) throw noteError;

      await fetchNotes();
      Alert.alert('Uploaded!', `"${file.name}" has been saved.`);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message ?? 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteNote(note: Note) {
    Alert.alert('Delete Note', `Remove "${note.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          if (note.file_url) {
            const path = note.file_url.split('/lecture-notes/')[1];
            if (path) await supabase.storage.from('lecture-notes').remove([path]);
          }
          await supabase.from('notes').delete().eq('id', note.id);
          fetchNotes();
        },
      },
    ]);
  }

  function fileIcon(name: string): any {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'document-text-outline';
    if (['ppt', 'pptx'].includes(ext)) return 'easel-outline';
    if (['doc', 'docx'].includes(ext)) return 'document-outline';
    if (['xls', 'xlsx'].includes(ext)) return 'grid-outline';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image-outline';
    return 'attach-outline';
  }

  if (modLoading || taskLoading) return <LoadingSpinner fullScreen />;
  if (!module) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState icon="alert-circle-outline" title="Module Not Found" message="This module no longer exists." />
      </SafeAreaView>
    );
  }

  const activeTasks = tasks.filter(t => t.status !== 'Completed');
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const pct = module.current_mark !== null
    ? Math.min(100, (module.current_mark / module.target_mark) * 100)
    : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBand, { backgroundColor: module.color }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{module.module_name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: module.color }]}>
                {module.current_mark !== null ? `${module.current_mark}%` : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{module.target_mark}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Target</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{module.difficulty_level}/5</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Difficulty</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: module.color }]} />
          </View>
          {module.lecturer_name && (
            <Text style={[styles.lecturer, { color: colors.textSecondary }]}>
              👨‍🏫 {module.lecturer_name}
            </Text>
          )}
        </Card>

        {/* Quick actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: module.color + '20', borderColor: module.color + '40' }]}
            onPress={() => router.push(`/grades/${module.id}`)}
          >
            <Ionicons name="bar-chart-outline" size={22} color={module.color} />
            <Text style={[styles.actionLabel, { color: module.color }]}>Grades</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: module.color + '20', borderColor: module.color + '40' }]}
            onPress={() => router.push('/tasks/add')}
          >
            <Ionicons name="add-circle-outline" size={22} color={module.color} />
            <Text style={[styles.actionLabel, { color: module.color }]}>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: module.color + '20', borderColor: module.color + '40' }]}
            onPress={() => router.push('/ai')}
          >
            <Ionicons name="sparkles-outline" size={22} color={module.color} />
            <Text style={[styles.actionLabel, { color: module.color }]}>AI Coach</Text>
          </TouchableOpacity>
        </View>

        {/* Lecture Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Lecture Notes ({notes.length})
            </Text>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: uploading ? colors.border : module.color }]}
              onPress={handleUploadFile}
              disabled={uploading}
            >
              <Ionicons
                name={uploading ? 'hourglass-outline' : 'cloud-upload-outline'}
                size={14}
                color="#fff"
              />
              <Text style={styles.uploadBtnText}>{uploading ? 'Uploading…' : 'Upload File'}</Text>
            </TouchableOpacity>
          </View>

          {notesLoading ? (
            <LoadingSpinner />
          ) : notes.length === 0 ? (
            <TouchableOpacity onPress={handleUploadFile}>
              <Card>
                <View style={styles.emptyNotes}>
                  <Ionicons name="cloud-upload-outline" size={36} color={module.color} />
                  <Text style={[styles.emptyNotesText, { color: colors.textSecondary }]}>
                    Upload lecture notes, PDFs, slides, or any file
                  </Text>
                  <Text style={[styles.emptyNotesCta, { color: module.color }]}>
                    Tap to upload from files
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ) : (
            notes.map(note => (
              <Card key={note.id} style={styles.noteCard}>
                <View style={styles.noteRow}>
                  <View style={[styles.noteIcon, { backgroundColor: module.color + '20' }]}>
                    <Ionicons name={fileIcon(note.title)} size={20} color={module.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
                      {note.title}
                    </Text>
                    <Text style={[styles.noteMeta, { color: colors.textSecondary }]}>
                      {new Date(note.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteNote(note)}>
                    <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Active Tasks */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Tasks ({activeTasks.length})
          </Text>
          {activeTasks.length === 0 ? (
            <Card>
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No active tasks for this module.</Text>
            </Card>
          ) : activeTasks.map(task => (
            <TouchableOpacity key={task.id} onPress={() => router.push(`/tasks/${task.id}`)}>
              <Card style={styles.taskCard}>
                <View style={styles.taskRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>{task.title}</Text>
                    <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : 'No deadline'}
                    </Text>
                  </View>
                  <View style={styles.taskBadges}>
                    <Badge label={task.status} color={statusColors[task.status]} small />
                    <Badge label={task.priority} color={priorityColors[task.priority]} small />
                  </View>
                </View>
                {task.progress > 0 && (
                  <View style={[styles.progressTrack, { backgroundColor: colors.border, marginTop: Spacing.sm }]}>
                    <View style={[styles.progressFill, { width: `${task.progress}%`, backgroundColor: module.color }]} />
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {completedTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Completed ({completedTasks.length})
            </Text>
            {completedTasks.slice(0, 3).map(task => (
              <Card key={task.id} style={styles.taskCard}>
                <Text style={[styles.taskTitle, { color: colors.textSecondary, textDecorationLine: 'line-through' }]}>
                  {task.title}
                </Text>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerBand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base },
  headerTitle: { color: '#fff', fontSize: Typography.md, fontWeight: Typography.bold, flex: 1, textAlign: 'center' },
  content: { padding: Spacing.base, gap: Spacing.base },
  statsCard: { gap: Spacing.md },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Typography.xl, fontWeight: Typography.bold },
  statLabel: { fontSize: Typography.xs, marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  lecturer: { fontSize: Typography.sm },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: 4 },
  actionLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.bold },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: BorderRadius.full },
  uploadBtnText: { color: '#fff', fontSize: Typography.xs, fontWeight: Typography.semibold },
  emptyNotes: { alignItems: 'center', padding: Spacing.lg, gap: Spacing.sm },
  emptyNotesText: { fontSize: Typography.sm, textAlign: 'center', lineHeight: 20 },
  emptyNotesCta: { fontSize: Typography.sm, fontWeight: Typography.bold },
  noteCard: { padding: Spacing.md },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  noteIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  noteTitle: { fontSize: Typography.sm, fontWeight: Typography.medium },
  noteMeta: { fontSize: Typography.xs, marginTop: 2 },
  taskCard: { gap: Spacing.xs },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  taskTitle: { fontSize: Typography.base, fontWeight: Typography.medium },
  taskMeta: { fontSize: Typography.xs, marginTop: 2 },
  taskBadges: { gap: 4 },
});
