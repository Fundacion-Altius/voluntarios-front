import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { useSession, signIn, signOut } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(signIn).toHaveBeenCalledWith('credentials', { callbackUrl: '/dashboard' });
  });

  it('calls signOut with callback on logout', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {},
      status: 'authenticated',
    });

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.logout();
    });

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });
});
