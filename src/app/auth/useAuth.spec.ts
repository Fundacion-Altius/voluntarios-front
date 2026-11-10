import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { useSession, signIn } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

const mockRouterPush = jest.fn();
jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const clearHadSession = jest.fn();
jest.mock('./AuthProvider', () => ({
  clearHadSession: () => clearHadSession(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('returns unauthenticated state when no session', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('returns loading state during session check', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('returns authenticated state with user session', () => {
    const mockUser = { name: 'Test User', email: 'test@example.com' };
    (useSession as jest.Mock).mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
  });

  it('calls signIn with credentials on login', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.login();
    });

    expect(signIn).toHaveBeenCalledWith('credentials', { callbackUrl: '/admin/dashboard' });
  });

  it('clears session and routes to login on logout', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {},
      status: 'authenticated',
    });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => ({ csrfToken: 'csrf' }) })
      .mockResolvedValueOnce({ type: 'opaqueredirect', status: 302 });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(clearHadSession).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith('/login');
  });

  it('exposes next-auth status', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.status).toBe('unauthenticated');
  });
});
