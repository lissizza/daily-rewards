import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { seedDefaultEventTypes, hasEventTypes } from '@/lib/seed';
import type { User, Subscription } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  signIn: (emailOrLogin: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => () => void; // Returns cleanup function
}

// Store subscription reference for cleanup
let authSubscription: Subscription | null = null;

async function loadProfile(userId: string): Promise<Profile | null> {
  console.log('[auth] Loading profile for user:', userId);
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[auth] Profile load error:', error.message, error.code);
      return null;
    }

    console.log('[auth] Profile loaded:', data?.role, data?.name);
    return data;
  } catch (e) {
    console.error('[auth] Profile load exception:', e);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  signIn: async (emailOrLogin: string, password: string) => {
    const isEmail = emailOrLogin.includes('@');

    // Perform auth - onAuthStateChange will handle the state update
    if (isEmail) {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailOrLogin,
        password,
      });
      if (error) throw error;
    } else {
      const { data: email, error: lookupError } = await supabase
        .rpc('get_email_by_login', { p_login: emailOrLogin });

      if (lookupError || !email) {
        throw new Error('Пользователь не найден');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    }
    // State will be updated by onAuthStateChange listener
  },

  signUp: async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    // State will be updated by onAuthStateChange listener
  },

  initialize: () => {
    const state = get();

    // Prevent multiple initializations
    if (state.initialized) {
      console.log('[auth] Already initialized, skipping');
      return () => {};
    }

    set({ initialized: true });
    console.log('[auth] Initializing auth store');

    // Single source of truth: onAuthStateChange handles ALL auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[auth] onAuthStateChange:', event, session?.user?.id);

      if (event === 'SIGNED_OUT' || !session) {
        set({ user: null, profile: null, loading: false });
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        // Just update user token, keep profile
        set({ user: session.user });
        return;
      }

      // For INITIAL_SESSION, SIGNED_IN, or USER_UPDATED
      if (session?.user) {
        set({ loading: true });
        const profile = await loadProfile(session.user.id);
        set({ user: session.user, profile, loading: false });

        // Seed default event types for new owner on first sign in
        if (event === 'SIGNED_IN' && profile?.role === 'owner' && profile?.family_id) {
          const alreadyHasEventTypes = await hasEventTypes(profile.family_id);
          if (!alreadyHasEventTypes) {
            await seedDefaultEventTypes(profile.family_id);
          }
        }
      }
    });

    authSubscription = subscription;

    // Timeout for PWA standalone mode where session check may hang
    const sessionTimeout = setTimeout(() => {
      const currentState = get();
      if (currentState.loading && !currentState.user) {
        console.log('[auth] Session check timed out, showing login');
        set({ loading: false });
      }
    }, 3000);

    // Cleanup function
    return () => {
      console.log('[auth] Cleaning up auth subscription');
      clearTimeout(sessionTimeout);
      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }
      set({ initialized: false });
    };
  },
}));
