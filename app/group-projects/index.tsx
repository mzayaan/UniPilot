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
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { DatePickerModal } from '../../src/components/ui/DatePickerModal';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useModules } from '../../src/hooks/useModules';
import { supabase } from '../../src/lib/supabase';
import { PLAN_LIMITS } from '../../src/types';

type ProjectStatus = 'Planning' | 'In Progress' | 'Review' | 'Completed';

const STATUS_COLORS: Record<ProjectStatus, string> = {
  Planning: '#A8A8A8',
  'In Progress': '#FFB347',
  Review: '#45B7D1',
  Completed: '#43E97B',
};

const PROJECT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD',
  '#FFD93D', '#FF8C94', '#88D8B0', '#6C5CE7', '#FD79A8',
];

interface GroupProject {
  id: string;
  user_id: string;
  module_id: string | null;
  project_name: string;
  description: string | null;
  deadline: string | null;
  status: ProjectStatus;
  members: string[];
  my_role: string | null;
  color: string;
  created_at: string;
  module?: { module_name: string; color: string };
}

export default function GroupProjectsScreen() {
  const { subscription } = useAuth();
  const plan = subscription?.plan_name ?? 'free';
  const canUseProjects = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.groupProjects ?? false;
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { modules } = useModules();

  const [projects, setProjects] = useState<GroupProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<GroupProject | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('group_projects')
      .select('id, user_id, module_id, project_name, description, deadline, status, members, my_role, color, created_at, module:modules(module_name, color)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setProjects((data as GroupProject[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  function openCreate() {
    setEditingProject(null);
    setProjectName('');
    setDescription('');
    setDeadline('');
    setStatus('Planning');
    setModuleId(null);
    setMyRole('');
    setMembersInput('');
    setSelectedColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]);
    setShowModal(true);
  }

  function openEdit(project: GroupProject) {
    setEditingProject(project);
    setProjectName(project.project_name);
    setDescription(project.description ?? '');
    setDeadline(project.deadline ? project.deadline.split('T')[0] : '');
    setStatus(project.status);
    setModuleId(project.module_id);
    setMyRole(project.my_role ?? '');
    setMembersInput(project.members?.join(', ') ?? '');
    setSelectedColor(project.color ?? PROJECT_COLORS[0]);
    setShowModal(true);
  }

  async function handleSave() {
    if (!user || !projectName.trim()) {
      Alert.alert('Error', 'Project name is required.');
      return;
    }
    setSaving(true);

    const members = membersInput
      .split(',')
      .map(m => m.trim())
      .filter(Boolean);

    const payload = {
      project_name: projectName.trim(),
      description: description.trim() || null,
      deadline: deadline ? new Date(deadline + 'T00:00:00').toISOString() : null,
      status,
      module_id: moduleId,
      my_role: myRole.trim() || null,
      members,
      color: selectedColor,
    };

    let error;
    if (editingProject) {
      const res = await supabase.from('group_projects').update(payload).eq('id', editingProject.id);
      error = res.error;
    } else {
      const res = await supabase.from('group_projects').insert({
        ...payload,
        user_id: user.id,
        owner_id: user.id, // keep legacy column populated
      });
      error = res.error;
    }

    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else { setShowModal(false); fetchProjects(); }
  }

  async function handleDelete(project: GroupProject) {
    Alert.alert('Delete Project', `Remove "${project.project_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('group_projects').delete().eq('id', project.id);
          fetchProjects();
        },
      },
    ]);
  }

  async function updateStatus(project: GroupProject, newStatus: ProjectStatus) {
    await supabase.from('group_projects').update({ status: newStatus }).eq('id', project.id);
    fetchProjects();
  }

  function formatDeadline(d: string | null): string {
    if (!d) return 'No deadline';
    const due = new Date(d);
    const diff = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const label = due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    if (diff < 0) return `${label} (Overdue)`;
    if (diff === 0) return `${label} (Today!)`;
    if (diff <= 3) return `${label} (in ${diff}d)`;
    return label;
  }

  const activeProjects = projects.filter(p => p.status !== 'Completed');
  const completedProjects = projects.filter(p => p.status === 'Completed');

  if (!canUseProjects) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 }}>
          <Text style={{ fontSize: 48 }}>👥</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' }}>Group Projects</Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            Collaborate with your group, track shared tasks, and manage deadlines together. Available on Pro+.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: Colors.secondary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
            onPress={() => router.push('/subscription')}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Upgrade to Pro+</Text>
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
        <Text style={[styles.title, { color: colors.text }]}>Group Projects</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.primary }]} onPress={openCreate}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {projects.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Group Projects"
            message="Add your first group project to track team progress, deadlines, and member roles."
            actionLabel="Create Project"
            onAction={openCreate}
          />
        ) : (
          <>
            {activeProjects.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Active ({activeProjects.length})</Text>
                {activeProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    colors={colors}
                    onEdit={() => openEdit(project)}
                    onDelete={() => handleDelete(project)}
                    onStatusChange={(s) => updateStatus(project, s)}
                    formatDeadline={formatDeadline}
                  />
                ))}
              </View>
            )}

            {completedProjects.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Completed ({completedProjects.length})</Text>
                {completedProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    colors={colors}
                    onEdit={() => openEdit(project)}
                    onDelete={() => handleDelete(project)}
                    onStatusChange={(s) => updateStatus(project, s)}
                    formatDeadline={formatDeadline}
                  />
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingProject ? 'Edit Project' : 'New Group Project'}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">

            {/* Color picker */}
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Colour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              {PROJECT_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorSwatch, { backgroundColor: c }, selectedColor === c && { borderWidth: 3, borderColor: '#fff' }]}
                  onPress={() => setSelectedColor(c)}
                >
                  {selectedColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Project Name *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Final Year Project"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
            />

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What is this project about?"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
              textAlignVertical="top"
            />

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Module</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <TouchableOpacity
                style={[styles.chip, { borderColor: !moduleId ? Colors.primary : colors.border }, !moduleId && { backgroundColor: Colors.primary + '20' }]}
                onPress={() => setModuleId(null)}
              >
                <Text style={[styles.chipText, { color: !moduleId ? Colors.primary : colors.textSecondary }]}>None</Text>
              </TouchableOpacity>
              {modules.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.chip, { borderColor: moduleId === m.id ? m.color : colors.border }, moduleId === m.id && { backgroundColor: m.color + '20' }]}
                  onPress={() => setModuleId(m.id)}
                >
                  <Text style={[styles.chipText, { color: moduleId === m.id ? m.color : colors.textSecondary }]}>{m.module_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Status</Text>
            <View style={styles.chipWrap}>
              {(['Planning', 'In Progress', 'Review', 'Completed'] as ProjectStatus[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, { borderColor: status === s ? STATUS_COLORS[s] : colors.border }, status === s && { backgroundColor: STATUS_COLORS[s] + '20' }]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.chipText, { color: status === s ? STATUS_COLORS[s] : colors.textSecondary }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Deadline</Text>
            <TouchableOpacity
              style={[styles.dateBtn, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={deadline ? Colors.primary : colors.placeholder} />
              <Text style={{ color: deadline ? colors.text : colors.placeholder, flex: 1, fontSize: Typography.base }}>
                {deadline
                  ? new Date(deadline + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Tap to set deadline'}
              </Text>
              {deadline && (
                <TouchableOpacity onPress={() => setDeadline('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            <DatePickerModal
              visible={showDatePicker}
              value={deadline}
              onConfirm={(d) => setDeadline(d)}
              onClose={() => setShowDatePicker(false)}
              title="Project Deadline"
            />

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>My Role</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              value={myRole}
              onChangeText={setMyRole}
              placeholder="Team Leader, Developer, Designer..."
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
            />

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Team Members (comma-separated)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.inputBorder }]}
              value={membersInput}
              onChangeText={setMembersInput}
              placeholder="Alice, Bob, Charlie"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
            />

            <Button
              title={editingProject ? 'Save Changes' : 'Create Project'}
              onPress={handleSave}
              loading={saving}
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

// ─── Project Card ────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: GroupProject;
  colors: any;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: ProjectStatus) => void;
  formatDeadline: (d: string | null) => string;
}

function ProjectCard({ project, colors, onEdit, onDelete, onStatusChange, formatDeadline }: ProjectCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const deadlineStr = formatDeadline(project.deadline);
  const isOverdue = project.deadline &&
    new Date(project.deadline) < new Date() &&
    project.status !== 'Completed';

  return (
    <Card style={styles.projectCard}>
      <View style={[styles.colorBar, { backgroundColor: project.color ?? Colors.primary }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
              {project.project_name}
            </Text>
            {project.module && (
              <Text style={[styles.projectModule, { color: colors.textSecondary }]}>
                📚 {project.module.module_name}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity onPress={onEdit}>
              <Ionicons name="pencil-outline" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete}>
              <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {project.description ? (
          <Text style={[styles.projectDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {project.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <TouchableOpacity onPress={() => setShowStatusMenu(s => !s)}>
            <Badge label={project.status} color={STATUS_COLORS[project.status] ?? '#888'} small />
          </TouchableOpacity>
          <Text style={[styles.deadlineText, { color: isOverdue ? Colors.danger : colors.textSecondary }]}>
            {isOverdue ? '⚠️ ' : '📅 '}{deadlineStr}
          </Text>
        </View>

        {showStatusMenu && (
          <View style={[styles.statusMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(['Planning', 'In Progress', 'Review', 'Completed'] as ProjectStatus[]).map(s => (
              <TouchableOpacity
                key={s}
                style={styles.statusOption}
                onPress={() => { onStatusChange(s); setShowStatusMenu(false); }}
              >
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[s] }]} />
                <Text style={[styles.statusOptionText, { color: colors.text }]}>{s}</Text>
                {project.status === s && <Ionicons name="checkmark" size={14} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {(project.members?.length > 0 || project.my_role) && (
          <View style={styles.membersRow}>
            <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.membersText, { color: colors.textSecondary }]} numberOfLines={1}>
              {project.my_role ? `You (${project.my_role})` : 'You'}
              {project.members?.length > 0 ? `, ${project.members.join(', ')}` : ''}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1 },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base, gap: Spacing.base },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.bold },
  projectCard: { padding: 0, overflow: 'hidden' },
  colorBar: { height: 4 },
  cardContent: { padding: Spacing.md, gap: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  projectName: { fontSize: Typography.base, fontWeight: Typography.bold },
  projectModule: { fontSize: Typography.xs, marginTop: 2 },
  projectDesc: { fontSize: Typography.sm, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  deadlineText: { fontSize: Typography.xs, flex: 1 },
  statusMenu: { borderWidth: 1, borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.xs },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusOptionText: { flex: 1, fontSize: Typography.sm },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  membersText: { fontSize: Typography.xs, flex: 1 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1 },
  modalTitle: { fontSize: Typography.md, fontWeight: Typography.semibold },
  modalContent: { padding: Spacing.base, gap: Spacing.xs },
  formLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, marginTop: Spacing.md, marginBottom: Spacing.xs },
  input: { borderWidth: 1.5, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, fontSize: Typography.base },
  textArea: { minHeight: 80 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1.5, marginRight: Spacing.xs, marginBottom: 2 },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.medium },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1.5 },
  colorSwatch: { width: 34, height: 34, borderRadius: 17, marginRight: Spacing.sm, alignItems: 'center', justifyContent: 'center' },
});
