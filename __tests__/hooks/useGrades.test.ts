/// <reference types="jest" />
import { renderHook, act, waitFor } from '../helpers/renderHook';
import { useGrades } from '../../src/hooks/useGrades';
import { mockSupabaseClient } from '../../__mocks__/@supabase/supabase-js';

jest.mock('../../src/lib/supabase', () => ({
  supabase: require('../../__mocks__/@supabase/supabase-js').mockSupabaseClient,
}));

jest.mock('../../src/context/AuthContext', () => {
  const authValue = { user: { id: 'user-1', email: 'test@example.com' }, subscription: null };
  return { useAuth: jest.fn().mockImplementation(() => authValue) };
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockGrades = [
  {
    id: 'grade-1',
    user_id: 'user-1',
    module_id: 'mod-1',
    assessment_name: 'Midterm',
    assessment_type: 'Exam',
    weight: 40,
    mark_obtained: 60,
    max_mark: 100,
    created_at: new Date().toISOString(),
  },
  {
    id: 'grade-2',
    user_id: 'user-1',
    module_id: 'mod-1',
    assessment_name: 'Coursework',
    assessment_type: 'Assignment',
    weight: 60,
    mark_obtained: 80,
    max_mark: 100,
    created_at: new Date().toISOString(),
  },
];

function setupSupabaseMock(data: any[] = mockGrades, error: any = null) {
  const chainMock = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data, error }),
    insert: jest.fn().mockResolvedValue({ data: null, error }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: data[0] ?? null, error }),
  };
  (mockSupabaseClient.from as jest.Mock).mockReturnValue(chainMock);
  return chainMock;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useGrades', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches grades on mount', async () => {
    setupSupabaseMock();
    const { result } = renderHook(() => useGrades('mod-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.grades).toHaveLength(2);
  });

  it('initialises with loading true', () => {
    setupSupabaseMock();
    const { result } = renderHook(() => useGrades('mod-1'));
    expect(result.current.loading).toBe(true);
  });

  it('filters by module_id', async () => {
    const chainMock = setupSupabaseMock();
    renderHook(() => useGrades('mod-1'));

    await waitFor(() => {
      expect(chainMock.eq).toHaveBeenCalledWith('module_id', 'mod-1');
    });
  });

  it('filters by user_id', async () => {
    const chainMock = setupSupabaseMock();
    renderHook(() => useGrades('mod-1'));

    await waitFor(() => {
      expect(chainMock.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });

  it('returns empty array when no grades exist', async () => {
    setupSupabaseMock([]);
    const { result } = renderHook(() => useGrades('mod-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.grades).toHaveLength(0);
  });

  it('exposes refetch function', async () => {
    setupSupabaseMock();
    const { result } = renderHook(() => useGrades('mod-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.refetch).toBe('function');
  });

  describe('calculateCurrentMark', () => {
    it('returns null when no grades are graded', async () => {
      const ungraded = mockGrades.map(g => ({ ...g, mark_obtained: null }));
      setupSupabaseMock(ungraded);

      const { result } = renderHook(() => useGrades('mod-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.calculateCurrentMark()).toBeNull();
    });

    it('computes correct weighted average', async () => {
      setupSupabaseMock();

      const { result } = renderHook(() => useGrades('mod-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Midterm: 60% mark * weight 40; Coursework: 80% mark * weight 60
      // weighted avg = (60*40 + 80*60) / 100 = 72
      expect(result.current.calculateCurrentMark()).toBe(72);
    });

    it('only uses graded assessments in calculation', async () => {
      const mixed = [
        { ...mockGrades[0], mark_obtained: 70, weight: 50 },
        { ...mockGrades[1], mark_obtained: null, weight: 50 },
      ];
      setupSupabaseMock(mixed);

      const { result } = renderHook(() => useGrades('mod-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Only grade-1 is graded: 70/100 * 100 = 70%, totalWeight = 50, result = 70
      expect(result.current.calculateCurrentMark()).toBe(70);
    });

    it('returns null when grades array is empty', async () => {
      setupSupabaseMock([]);

      const { result } = renderHook(() => useGrades('mod-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.calculateCurrentMark()).toBeNull();
    });
  });

  describe('projectFinalMark', () => {
    it('projects final mark using target for unknown grades', async () => {
      const mixed = [
        { ...mockGrades[0], mark_obtained: 80, weight: 40 },
        { ...mockGrades[1], mark_obtained: null, weight: 60 },
      ];
      setupSupabaseMock(mixed);

      const { result } = renderHook(() => useGrades('mod-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Grade 1: 80% * 40/100 = 32; Grade 2 (unknown, target 70): 70% * 60/100 = 42
      // Total = 74
      expect(result.current.projectFinalMark(70)).toBe(74);
    });

    it('returns exact average when all grades are submitted', async () => {
      setupSupabaseMock();

      const { result } = renderHook(() => useGrades('mod-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // 60 * (40/100) + 80 * (60/100) = 24 + 48 = 72
      expect(result.current.projectFinalMark(70)).toBe(72);
    });
  });

  it('addGrade returns error when user is not authenticated', async () => {
    const { useAuth } = require('../../src/context/AuthContext');
    useAuth.mockReturnValueOnce({ user: null, subscription: null });

    setupSupabaseMock();
    const { result } = renderHook(() => useGrades('mod-1'));

    await act(async () => {
      const { error } = await result.current.addGrade({
        module_id: 'mod-1',
        assessment_name: 'Test',
        assessment_type: 'Exam',
        weight: 50,
        mark_obtained: null,
        max_mark: 100,
      });
      expect(error).toBe('Not authenticated');
    });
  });
});
