import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { supabase } from '@/lib/supabase';

// Mock the seed module
vi.mock('@/lib/seed', () => ({
  seedDefaultEventTypes: vi.fn().mockResolvedValue({ success: true }),
  hasEventTypes: vi.fn().mockResolvedValue(false),
}));

// We need to import the store after mocking
// to ensure the mock is in place during store initialization
const getAuthStore = async () => {
  // Clear the module cache to get a fresh store with our mocks
  vi.resetModules();
  const module = await import('../auth');
  return module.useAuthStore;
};

describe('Auth Store', () => {
  let mockSignInWithPassword: Mock;
  let mockSignUp: Mock;
  let mockSignOut: Mock;
  let mockGetSession: Mock;
  let mockOnAuthStateChange: Mock;
  let mockFrom: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup auth mocks
    mockSignInWithPassword = supabase.auth.signInWithPassword as Mock;
    mockSignUp = supabase.auth.signUp as Mock;
    mockSignOut = supabase.auth.signOut as Mock;
    mockGetSession = supabase.auth.getSession as Mock;
    mockOnAuthStateChange = supabase.auth.onAuthStateChange as Mock;
    mockFrom = supabase.from as Mock;

    // Default mock implementations
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  });

  describe('initial state', () => {
    it('should have null user and profile initially', async () => {
      const useAuthStore = await getAuthStore();
      const state = useAuthStore.getState();

      // After initialization completes, user and profile should be null
      // since we mocked getSession to return no session
      await vi.waitFor(() => {
        const currentState = useAuthStore.getState();
        expect(currentState.loading).toBe(false);
      });

      const finalState = useAuthStore.getState();
      expect(finalState.user).toBeNull();
      expect(finalState.profile).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should call signInWithPassword with email when email is provided', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });

      const useAuthStore = await getAuthStore();
      await vi.waitFor(() => {
        expect(useAuthStore.getState().loading).toBe(false);
      });

      await useAuthStore.getState().signIn('test@example.com', 'password123');

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should lookup email by login when non-email is provided', async () => {
      const mockSelectFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { email: 'found@example.com' },
          }),
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelectFn });
      mockSignInWithPassword.mockResolvedValue({ error: null });

      const useAuthStore = await getAuthStore();
      await vi.waitFor(() => {
        expect(useAuthStore.getState().loading).toBe(false);
      });

      await useAuthStore.getState().signIn('mylogin', 'password123');

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'found@example.com',
        password: 'password123',
      });
    });

    it('should throw error when login lookup fails', async () => {
      const mockSelectFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
          }),
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelectFn });

      const useAuthStore = await getAuthStore();
      await vi.waitFor(() => {
        expect(useAuthStore.getState().loading).toBe(false);
      });

      await expect(
        useAuthStore.getState().signIn('nonexistent', 'password123')
      ).rejects.toThrow('User not found');
    });

    it('should throw error when signInWithPassword fails', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      });

      const useAuthStore = await getAuthStore();
      await vi.waitFor(() => {
        expect(useAuthStore.getState().loading).toBe(false);
      });

      await expect(
        useAuthStore.getState().signIn('test@example.com', 'wrongpassword')
      ).rejects.toEqual({ message: 'Invalid credentials' });
    });

    it('should set loading to true during sign in', async () => {
      let resolveSignIn: (value: unknown) => void;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignInWithPassword.mockReturnValue(signInPromise);

      const useAuthStore = await getAuthStore();
      await vi.waitFor(() => {
        expect(useAuthStore.getState().loading).toBe(false);
      });

      const signInCall = useAuthStore.getState().signIn('test@example.com', 'password123');

      // Should be loading after calling signIn
      expect(useAuthStore.getState().loading).toBe(true);

      resolveSignIn!({ error: null });
      await signInCall;
    });
  });

  describe('signUp', () => {
    it('should call supabase signUp with email, password, and name', async () => {
      mockSignUp.mockResolvedValue({ error: null });

      const useAuthStore = await getAuthStore();
      await vi.waitFor(() => {
        expect(useAuthStore.getState().loading).toBe(false);
      });

      await useAuthStore.getState().signUp('new@example.com', 'password123', 'Test User');

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: { name: 'Test User' },
        },
      });
    });

    it('should throw error when signUp fails', async () => {
      mockSignUp.mockResolvedValue({
        error: { message: 'Email already exists' },
      });

      const useAuthStore = await getAuthStore();
      await vi.waitFor(() => {
        expect(useAuthStore.getState().loading).toBe(false);
      });

      await expect(
        useAuthStore.getState().signUp('existing@example.com', 'password123', 'Test User')
      ).rejects.toEqual({ message: 'Email already exists' });
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut and clear user/profile', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const useAuthStore = await getAuthStore();
      await vi.waitFor(() => {
        expect(useAuthStore.getState().loading).toBe(false);
      });

      await useAuthStore.getState().signOut();

      expect(mockSignOut).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().profile).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should set user and profile when session exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockProfile = { id: 'user-123', name: 'Test User', role: 'admin' };

      mockGetSession.mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      const mockSelectFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile }),
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelectFn });

      const useAuthStore = await getAuthStore();

      await vi.waitFor(() => {
        expect(useAuthStore.getState().loading).toBe(false);
      });

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().profile).toEqual(mockProfile);
    });

    it('should set loading to false when no session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      const useAuthStore = await getAuthStore();

      await vi.waitFor(() => {
        expect(useAuthStore.getState().loading).toBe(false);
      });

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().profile).toBeNull();
    });
  });
});
