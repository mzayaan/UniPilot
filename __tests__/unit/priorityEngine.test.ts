import { computePriorities, getTopRecommendation } from '../../src/lib/priority-engine';
import { Task, Module } from '../../src/types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    user_id: 'user-1',
    module_id: null,
    title: 'Test Task',
    description: null,
    due_date: null,
    priority: 'Medium',
    estimated_minutes: 60,
    progress: 0,
    status: 'Not Started',
    task_type: 'Assignment',
    weight: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'mod-1',
    user_id: 'user-1',
    module_name: 'Mathematics',
    lecturer_name: null,
    target_mark: 70,
    current_mark: 70,
    difficulty_level: 3,
    color: '#FF5733',
    credits: 20,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

// ─── computePriorities ───────────────────────────────────────────────────────

describe('computePriorities', () => {
  it('returns empty array for empty input', () => {
    expect(computePriorities([], [])).toEqual([]);
  });

  it('excludes completed tasks', () => {
    const completed = makeTask({ status: 'Completed' });
    const result = computePriorities([completed], []);
    expect(result).toHaveLength(0);
  });

  it('includes Not Started, In Progress, and Overdue tasks', () => {
    const tasks = [
      makeTask({ status: 'Not Started' }),
      makeTask({ id: 'task-2', status: 'In Progress' }),
      makeTask({ id: 'task-3', status: 'Overdue' }),
    ];
    const result = computePriorities(tasks, []);
    expect(result).toHaveLength(3);
  });

  it('sorts overdue tasks higher than future tasks', () => {
    const overdue = makeTask({ id: 'overdue', due_date: pastDate(2) });
    const future = makeTask({ id: 'future', due_date: futureDate(7) });
    const result = computePriorities([future, overdue], []);
    expect(result[0].task.id).toBe('overdue');
  });

  it('sorts tasks due today higher than tasks due next week', () => {
    const dueToday = makeTask({ id: 'today', due_date: futureDate(0) });
    const nextWeek = makeTask({ id: 'nextweek', due_date: futureDate(7) });
    const result = computePriorities([nextWeek, dueToday], []);
    expect(result[0].task.id).toBe('today');
  });

  it('returns valid score (non-negative) for each task', () => {
    const tasks = [
      makeTask({ due_date: futureDate(1), progress: 80 }),
      makeTask({ id: 'task-2', due_date: pastDate(1) }),
    ];
    const result = computePriorities(tasks, []);
    result.forEach(r => expect(r.score).toBeGreaterThanOrEqual(0));
  });

  it('penalises highly progressed tasks', () => {
    const lowProgress = makeTask({ id: 'low', due_date: futureDate(3), progress: 0 });
    const highProgress = makeTask({ id: 'high', due_date: futureDate(3), progress: 90 });
    const result = computePriorities([highProgress, lowProgress], []);
    // Low progress task should have higher score
    const lowScore = result.find(r => r.task.id === 'low')!.score;
    const highScore = result.find(r => r.task.id === 'high')!.score;
    expect(lowScore).toBeGreaterThan(highScore);
  });

  it('boosts tasks with high weight', () => {
    const noWeight = makeTask({ id: 'noweight', due_date: futureDate(5), weight: null });
    const highWeight = makeTask({ id: 'highweight', due_date: futureDate(5), weight: 50 });
    const result = computePriorities([noWeight, highWeight], []);
    const hwScore = result.find(r => r.task.id === 'highweight')!.score;
    const nwScore = result.find(r => r.task.id === 'noweight')!.score;
    expect(hwScore).toBeGreaterThan(nwScore);
  });

  it('includes module risk in score when mark is below target', () => {
    const module = makeModule({ current_mark: 40, target_mark: 70 });
    const taskWithModule = makeTask({ id: 'withmod', module_id: 'mod-1', due_date: futureDate(5) });
    const taskNoModule = makeTask({ id: 'nomod', due_date: futureDate(5) });

    const resultWith = computePriorities([taskWithModule], [module]);
    const resultWithout = computePriorities([taskNoModule], []);

    expect(resultWith[0].score).toBeGreaterThan(resultWithout[0].score);
  });

  it('provides a reason string for each task', () => {
    const tasks = [makeTask({ due_date: futureDate(2) })];
    const result = computePriorities(tasks, []);
    expect(result[0].reason).toBeTruthy();
    expect(typeof result[0].reason).toBe('string');
  });

  it('caps suggestedMinutes at 120', () => {
    const bigTask = makeTask({ estimated_minutes: 300, progress: 0 });
    const result = computePriorities([bigTask], []);
    expect(result[0].suggestedMinutes).toBeLessThanOrEqual(120);
  });

  it('reduces suggestedMinutes based on progress', () => {
    const halfDone = makeTask({ estimated_minutes: 60, progress: 50 });
    const notStarted = makeTask({ id: 'notstarted', estimated_minutes: 60, progress: 0 });
    const rHalf = computePriorities([halfDone], [])[0];
    const rNot = computePriorities([notStarted], [])[0];
    expect(rHalf.suggestedMinutes).toBeLessThanOrEqual(rNot.suggestedMinutes);
  });
});

// ─── getTopRecommendation ────────────────────────────────────────────────────

describe('getTopRecommendation', () => {
  it('returns a "caught up" message when no tasks exist', () => {
    const result = getTopRecommendation([], []);
    expect(result.task).toBeNull();
    expect(result.suggestedMinutes).toBe(0);
    expect(result.message).toContain('caught up');
  });

  it('returns a "caught up" message when all tasks are completed', () => {
    const completed = makeTask({ status: 'Completed' });
    const result = getTopRecommendation([completed], []);
    expect(result.task).toBeNull();
  });

  it('returns the highest-priority task', () => {
    const urgent = makeTask({ id: 'urgent', title: 'Urgent Essay', due_date: pastDate(1) });
    const notUrgent = makeTask({ id: 'meh', title: 'Chill Reading', due_date: futureDate(14) });
    const result = getTopRecommendation([notUrgent, urgent], []);
    expect(result.task?.id).toBe('urgent');
  });

  it('includes the task title in the message', () => {
    const task = makeTask({ title: 'Calculus Homework', due_date: futureDate(2) });
    const result = getTopRecommendation([task], []);
    expect(result.message).toContain('Calculus Homework');
  });

  it('includes time in the message', () => {
    const task = makeTask({ due_date: futureDate(2), estimated_minutes: 45 });
    const result = getTopRecommendation([task], []);
    expect(result.message).toMatch(/\d+ minutes|h\s*\d*m?/);
  });

  it('returns positive suggestedMinutes for active tasks', () => {
    const task = makeTask({ due_date: futureDate(3), estimated_minutes: 90 });
    const result = getTopRecommendation([task], []);
    expect(result.suggestedMinutes).toBeGreaterThan(0);
  });
});
