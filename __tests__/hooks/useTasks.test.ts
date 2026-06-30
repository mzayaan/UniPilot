/// <reference types="jest" />
import { renderHook, act, waitFor } from '../helpers/renderHook';
import { useTasks } from '../../src/hooks/useTasks';
import { mockSupabaseClient } from '../../__mocks__/@supabase/supabase-js';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('../../src/lib/supabase', () => ({
  supabase: require('../../__mocks__/@supabase/supabase-js').mockSupabaseClient,
}));

jest.mock('../../src/context/AuthContext', () => {
  const authValue = { user: { id: 'user-1', email: 'test@example.com' }, subscription: null };
  return { useAuth: jest.fn().mockImplementation(() => authValue) };
});

jest.mock('../../src/lib/notifications', () => ({
  scheduleTaskReminders: jest.fn().mockResolvedValue(undefined),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockTasks = [
  {
    id: 'task-1',
    user_id: 'user-1',
    module_id: null,
    title: 'Write essay',
    description: null,
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    priority: 'High',
    estimated_minutes: 120,
    progress: 0,
    status: 'Not Started',
    task_type: 'Assignment',
    weight: 40,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-2',
    user_id: 'user-1',
    module_id: null,
    title: 'Past due task',
    description: null,
    due_date: new Date(Date.now() - 86400000).toISOString(),
    priority: 'Low',
    estimated_minutes: 30,
    progress: 0,
    status: 'Not Started',
    task_type: 'Reading',
    weight: null,
    created_at: new Date().toISOString(),
  },
];

function setupSupabaseMock(data: any[] = mockTasks, error: any = null) {
  const chainMock = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data, error }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    in: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: data[0] ?? null, error }),
  };
  (mockSupabaseClient.from as jest.Mock).mockReturnValue(chainMock);
  return chainMock;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches tasks on mount', async () => {
    setupSupabaseMock();
    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tasks).toHaveLength(2);
  });

  it('sets loading to false after fetch', async () => {
    setupSupabaseMock();
    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('marks overdue tasks automatically', async () => {
    setupSupabaseMock();
    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const overdueTask = result.current.tasks.find(t => t.id === 'task-2');
    expect(overdueTask?.status).toBe('Overdue');
  });

  it('keeps future tasks as Not Started', async () => {
    setupSupabaseMock();
    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const futureTask = result.current.tasks.find(t => t.id === 'task-1');
    expect(futureTask?.status).toBe('Not Started');
  });

  it('handles fetch error gracefully', async () => {
    setupSupabaseMock([], { message: 'Network error' });
    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.tasks).toHaveLength(0);
  });

  it('does nothing when user is not authenticated', () => {
    const { useAuth } = require('../../src/context/AuthContext');
    useAuth.mockReturnValue({ user: null, subscription: null });

    setupSupabaseMock();
    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toHaveLength(0);

    useAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      subscription: null,
    });
  });

  it('exposes refetch function', async () => {
    setupSupabaseMock();
    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.refetch).toBe('function');
  });

  describe('updateProgress', () => {
    function setupUpdateMock() {
      const chainMock = setupSupabaseMock();
      // Return an object with both eq (for updateTask) and in (for overdue marking on refetch)
      const updateReturn = {
        eq: jest.fn().mockResolvedValue({ error: null }),
        in: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      chainMock.update.mockReturnValue(updateReturn);
      return { chainMock, updateReturn };
    }

    it('sets status to Completed when progress is 100', async () => {
      const { chainMock } = setupUpdateMock();

      const { result } = renderHook(() => useTasks());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateProgress('task-1', 100);
      });

      expect(chainMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 100, status: 'Completed' })
      );
    });

    it('sets status to In Progress when progress is between 1 and 99', async () => {
      const { chainMock } = setupUpdateMock();

      const { result } = renderHook(() => useTasks());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateProgress('task-1', 50);
      });

      expect(chainMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 50, status: 'In Progress' })
      );
    });

    it('sets status to Not Started when progress is 0', async () => {
      const { chainMock } = setupUpdateMock();

      const { result } = renderHook(() => useTasks());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateProgress('task-1', 0);
      });

      expect(chainMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 0, status: 'Not Started' })
      );
    });
  });
});
