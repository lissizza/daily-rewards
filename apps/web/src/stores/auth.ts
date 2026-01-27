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
      if (isEmail) {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailOrLogin,
          password,
        });
        if (error) throw error;
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('login', emailOrLogin)
          .single();

        if (!profile?.email) {
          throw new Error('User not found');
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password,
        });
        if (error) throw error;
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
    const { data: { session } } = await supabase.auth.getSession();

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

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({ user: session.user, profile, loading: false });

        // Seed default event types for new admin users
        if (event === 'SIGNED_IN' && profile?.role === 'admin') {
          // Check if this admin already has event types (prevents duplicate seeding)
          const alreadyHasEventTypes = await hasEventTypes(session.user.id);
          if (!alreadyHasEventTypes) {
            console.log('[auth] New admin detected, seeding default event types...');
            const result = await seedDefaultEventTypes(session.user.id);
            if (!result.success) {
              console.error('[auth] Failed to seed default event types:', result.error);
            }
          }
        }
      } else {
        set({ user: null, profile: null, loading: false });
      }
    });
  },
}));

useAuthStore.getState().initialize();
