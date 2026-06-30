/**
 * UniPilot "What Should I Do Now?" Priority Engine
 *
 * Scores every task and returns an ordered list with a human-readable reason
 * and a recommended study/work duration for the top task.
 */

import { Task, Module, PrioritizedTask } from '../types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysUntilDue(dueDateStr: string | null): number {
  if (!dueDateStr) return 99; // no deadline = low urgency
  const now = new Date();
  const due = new Date(dueDateStr);
  return (due.getTime() - now.getTime()) / MS_PER_DAY;
}

function deadlineUrgencyScore(daysLeft: number): number {
  if (daysLeft < 0) return 100;       // Overdue — maximum
  if (daysLeft < 1) return 90;        // Due today
  if (daysLeft <= 2) return 75;       // Due in 1-2 days
  if (daysLeft <= 4) return 55;       // Due in 3-4 days
  if (daysLeft <= 7) return 35;       // Due within a week
  if (daysLeft <= 14) return 15;      // Two weeks away
  return 5;                            // Far away
}

function moduleRiskScore(module: Module | undefined): number {
  if (!module) return 0;
  const current = module.current_mark ?? module.target_mark;
  const gap = module.target_mark - current;
  const difficultyBonus = (module.difficulty_level - 3) * 5; // -10 to +10
  if (gap > 20) return 30 + difficultyBonus;
  if (gap > 10) return 20 + difficultyBonus;
  if (gap > 0) return 10 + difficultyBonus;
  return 0;
}

function weightScore(weight: number | null | undefined): number {
  if (!weight) return 0;
  if (weight >= 50) return 30;
  if (weight >= 30) return 20;
  if (weight >= 15) return 10;
  return 5;
}

function progressPenalty(progress: number): number {
  // The more complete, the less urgent
  return (progress / 100) * 30;
}

function taskTypeBonus(taskType: string): number {
  switch (taskType) {
    case 'Assignment': return 10;
    case 'Exam':
    case 'Revision': return 8;
    case 'Presentation': return 6;
    case 'Reading': return 3;
    case 'Group': return 7;
    default: return 0;
  }
}

function suggestedMinutes(task: Task, score: number): number {
  const base = task.estimated_minutes ?? 60;
  const remaining = base * (1 - task.progress / 100);
  // Cap a single session at 2 hours
  return Math.min(Math.round(remaining), 120);
}

function buildReason(
  task: Task,
  module: Module | undefined,
  daysLeft: number,
  score: number
): string {
  const parts: string[] = [];

  if (daysLeft < 0) {
    parts.push(`⚠️ This task is overdue`);
  } else if (daysLeft < 1) {
    parts.push(`🔴 Due today`);
  } else if (daysLeft <= 2) {
    parts.push(`🟠 Due in ${Math.ceil(daysLeft)} day${Math.ceil(daysLeft) > 1 ? 's' : ''}`);
  } else if (daysLeft <= 7) {
    parts.push(`🟡 Due in ${Math.ceil(daysLeft)} days`);
  }

  if (module) {
    const current = module.current_mark ?? module.target_mark;
    const gap = module.target_mark - current;
    if (gap > 0) {
      parts.push(`your ${module.module_name} mark is ${gap.toFixed(0)}% below target`);
    }
    if (module.difficulty_level >= 4) {
      parts.push(`this is a challenging module`);
    }
  }

  if (task.weight && task.weight >= 30) {
    parts.push(`worth ${task.weight}% of your grade`);
  }

  if (task.progress > 0) {
    parts.push(`you're ${task.progress}% through — keep going`);
  }

  if (parts.length === 0) {
    parts.push(`this task needs attention`);
  }

  return parts.join(', ') + '.';
}

/**
 * Main engine function.
 * Pass all active tasks (not Completed) and their associated modules.
 * Returns tasks sorted by priority score, highest first.
 */
export function computePriorities(
  tasks: Task[],
  modules: Module[]
): PrioritizedTask[] {
  const moduleMap = new Map<string, Module>();
  modules.forEach(m => moduleMap.set(m.id, m));

  const activeTasks = tasks.filter(t => t.status !== 'Completed');

  const scored = activeTasks.map(task => {
    const module = task.module_id ? moduleMap.get(task.module_id) : undefined;
    const daysLeft = daysUntilDue(task.due_date);

    const score =
      deadlineUrgencyScore(daysLeft) +
      moduleRiskScore(module) +
      weightScore(task.weight) +
      taskTypeBonus(task.task_type) -
      progressPenalty(task.progress);

    const clampedScore = Math.max(0, Math.round(score));

    return {
      task,
      score: clampedScore,
      reason: buildReason(task, module, daysLeft, clampedScore),
      suggestedMinutes: suggestedMinutes(task, clampedScore),
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Returns the single top recommendation with a full natural-language message.
 */
export function getTopRecommendation(
  tasks: Task[],
  modules: Module[]
): { message: string; task: Task | null; suggestedMinutes: number } {
  const prioritized = computePriorities(tasks, modules);

  if (prioritized.length === 0) {
    return {
      message: "🎉 You're all caught up! No urgent tasks right now. Take a break or get ahead on upcoming work.",
      task: null,
      suggestedMinutes: 0,
    };
  }

  const top = prioritized[0];
  const mins = top.suggestedMinutes;
  const taskName = top.task.title;
  const minsText = mins >= 60
    ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim()
    : `${mins} minutes`;

  const message = `Focus on **${taskName}** for ${minsText}. ${top.reason}`;

  return {
    message,
    task: top.task,
    suggestedMinutes: top.suggestedMinutes,
  };
}
