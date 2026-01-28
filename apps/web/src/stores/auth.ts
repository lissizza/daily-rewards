import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { seedDefaultEventTypes, hasEventTypes } from '@/lib/seed';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (emailOrLogin: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (emailOrLogin: string, password: string) => {
    set({ loading: true });
    const isEmail = emailOrLogin.includes('@');

    try {
      let authResult;

      if (isEmail) {
        authResult = await supabase.auth.signInWithPassword({
          email: emailOrLogin,
          password,
        });
        if (authResult.error) throw authResult.error;
      } else {
        // Use security definer function to get email by login (bypasses RLS)
        const { data: email, error: lookupError } = await supabase
          .rpc('get_email_by_login', { p_login: emailOrLogin });

        if (lookupError || !email) {
          throw new Error('Пользователь не найден');
        }

        authResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authResult.error) throw authResult.error;
      }

      // Manually load profile after successful login
      if (authResult.data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authResult.data.user.id)
          .single();

        set({ user: authResult.data.user, profile, loading: false });
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
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
    set({ user: null, profile: null });
  },

  initialize: async () => {
    // Set up auth state listener first
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({ user: session.user, profile, loading: false });

        // Seed default event types for new owner users only
        // Conditions:
        // 1. Must be a SIGNED_IN event (new login, not token refresh)
        // 2. Must be an owner role (family creator)
        // 3. Must have a family_id
        // 4. Family must not already have event types (prevents duplicate seeding)
        const isNewOwner = event === 'SIGNED_IN'
          && profile?.role === 'owner'
          && profile?.family_id;

        if (isNewOwner) {
          const alreadyHasEventTypes = await hasEventTypes(profile.family_id);
          if (!alreadyHasEventTypes) {
            console.log('[auth] New owner detected, seeding default event types for family...');
            const result = await seedDefaultEventTypes(profile.family_id);
            if (!result.success) {
              console.error('[auth] Failed to seed default event types:', result.error);
            }
          }
        }
      } else {
        set({ user: null, profile: null, loading: false });
      }
    });

    // Then try to get existing session with timeout
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      );

      const sessionPromise = supabase.auth.getSession();

      const { data: { session } } = await Promise.race([
        sessionPromise,
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({ user: session.user, profile, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('[auth] Failed to get session:', error);
      set({ loading: false });
    }
  },
}));

useAuthStore.getState().initialize();
