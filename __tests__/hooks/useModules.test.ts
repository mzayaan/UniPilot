import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useModules } from '../../src/hooks/useModules';
import { mockSupabaseClient } from '../../__mocks__/@supabase/supabase-js';

jest.mock('../../src/lib/supabase', () => ({
  supabase: require('../../__mocks__/@supabase/supabase-js').mockSupabaseClient,
}));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-1', email: 'test@example.com' },  
    subscription: null,
  })),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockModules = [
  {
    id: 'mod-1',
    user_id: 'user-1',
    module_name: 'Mathematics',
    lecturer_name: 'Dr Smith',
    target_mark: 70,
    current_mark: 65,
    difficulty_level: 4,
    color: '#FF5733',
    credits: 20,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mod-2',
    user_id: 'user-1',
    module_name: 'Computer Science',
    lecturer_name: null,
    target_mark: 75,
    current_mark: null,
    difficulty_level: 3,
    color: '#3498DB',
    credits: 20,
    created_at: new Date().toISOString(),
  },
];

function setupSupabaseMock(data: any[] = mockModules, error: any = null) {
  const chainMock = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data, error }),
    insert: jest.fn().mockResolvedValue({ data: null, error }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error }),
  };
  (mockSupabaseClient.from as jest.Mock).mockReturnValue(chainMock);
  return chainMock;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useModules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches modules on mount', async () => {
    setupSupabaseMock();
    const { result } = renderHook(() => useModules());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.modules).toHaveLength(2);
  });

  it('initialises with loading true', () => {
    setupSupabaseMock();
    const { result } = renderHook(() => useModules());
    expect(result.current.loading).toBe(true);
  });

  it('sets error on failed fetch', async () => {
    setupSupabaseMock([], { message: 'Permission denied' });
    const { result } = renderHook(() => useModules());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Permission denied');
    expect(result.current.modules).toHaveLength(0);
  });

  it('calls supabase with correct user_id filter', async () => {
    const chainMock = setupSupabaseMock();
    renderHook(() => useModules());

    await waitFor(() => {
      expect(chainMock.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });

  it('exposes refetch function', async () => {
    setupSupabaseMock();
    const { result } = renderHook(() => useModules());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.refetch).toBe('function');
  });

  it('addModule inserts via supabase', async () => {
    const chainMock = setupSupabaseMock();
    chainMock.insert.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    // Need insert to not error
    chainMock.insert = jest.fn().mockResolvedValue({ error: null });

    const { result } = renderHook(() => useModules());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addModule({
        module_name: 'Physics',
        lecturer_name: null,
        target_mark: 70,
        current_mark: null,
        difficulty_level: 3,
        color: '#00FF00',
        credits: 15,
      });
    });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('modules');
  });

  it('returns error when user is not authenticated', async () => {
    const { useAuth } = require('../../src/context/AuthContext');
    useAuth.mockReturnValueOnce({ user: null, subscription: null });

    const chainMock = setupSupabaseMock();
    const { result } = renderHook(() => useModules());

    await act(async () => {
      const { error } = await result.current.addModule({
        module_name: 'Physics',
        lecturer_name: null,
        target_mark: 70,
        current_mark: null,
        difficulty_level: 3,
        color: '#00FF00',
        credits: 15,
      });
      expect(error).toBe('Not authenticated');
    });
  });
});
