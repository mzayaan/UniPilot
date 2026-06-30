// ─── Database Types ───────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  full_name: string | null;
  university: string | null;
  degree: string | null;
  year_of_study: number | null;
  semester_start: string | null;
  semester_end: string | null;
  target_grade: number | null;
  preferred_study_time: string | null;
  onboarding_complete: boolean;
  created_at: string;
}

export interface Module {
  id: string;
  user_id: string;
  module_name: string;
  lecturer_name: string | null;
  target_mark: number;
  current_mark: number | null;
  difficulty_level: number;
  color: string;
  credits: number | null;
  created_at: string;
}

export interface TimetableEntry {
  id: string;
  user_id: string;
  module_id: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string | null;
  entry_type: string;
  created_at: string;
  module?: Module;
}

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskType = 'Assignment' | 'Revision' | 'Reading' | 'Presentation' | 'Group' | 'Personal';

export interface Task {
  id: string;
  user_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  estimated_minutes: number;
  progress: number;
  status: TaskStatus;
  task_type: TaskType;
  weight: number | null;
  created_at: string;
  module?: Module;
}

export interface Grade {
  id: string;
  user_id: string;
  module_id: string;
  assessment_name: string;
  assessment_type: string;
  weight: number;
  mark_obtained: number | null;
  max_mark: number;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  module_id: string | null;
  title: string | null;
  content: string | null;
  file_url: string | null;
  created_at: string;
}

export type AIGenerationType = 'summary' | 'flashcards' | 'quiz' | 'study_plan' | 'explanation';

export interface AIGeneration {
  id: string;
  user_id: string;
  module_id: string | null;
  generation_type: AIGenerationType;
  input_text: string | null;
  output_text: string | null;
  tokens_used: number | null;
  created_at: string;
}

export type PlanName = 'free' | 'pro' | 'pro_plus';

export interface Subscription {
  id: string;
  user_id: string;
  revenuecat_customer_id: string | null;
  plan_name: PlanName;
  entitlement: string;
  status: string;
  renewal_type: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  monthly_income: number;
  monthly_limit: number;
  currency: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  expense_date: string;
  note: string | null;
  created_at: string;
}

export interface GroupProject {
  id: string;
  owner_id: string;
  module_id: string | null;
  project_name: string;
  description: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
}

// ─── Priority Engine Types ────────────────────────────────────────────────────

export interface PrioritizedTask {
  task: Task;
  score: number;
  reason: string;
  suggestedMinutes: number;
}

// ─── Plan limits ─────────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free: {
    maxModules: 3,
    maxTasks: 10,
    aiGenerationsPerMonth: 3,
    budgetTracker: false,
    aiQuizzes: false,
    fileUpload: false,
    groupProjects: false,
    cvBuilder: false,
    advancedPriority: false,
  },
  pro: {
    maxModules: Infinity,
    maxTasks: Infinity,
    aiGenerationsPerMonth: 100,
    budgetTracker: true,
    aiQuizzes: true,
    fileUpload: true,
    groupProjects: false,
    cvBuilder: false,
    advancedPriority: true,
  },
  pro_plus: {
    maxModules: Infinity,
    maxTasks: Infinity,
    aiGenerationsPerMonth: 300,
    budgetTracker: true,
    aiQuizzes: true,
    fileUpload: true,
    groupProjects: true,
    cvBuilder: true,
    advancedPriority: true,
  },
} as const;
