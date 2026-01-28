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
  initialize: () => void;
}

async function loadProfile(userId: string): Promise<Profile | null> {
  console.log('[auth] Loading profile for user:', userId);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  console.log('[auth] Profile loaded:', data, 'Error:', error);
  return data;
}

export const useAuthStore = create<AuthState>((set) => ({
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

      // Load profile after successful login
      console.log('[auth] Sign in successful, user:', authResult.data.user?.id);
      if (authResult.data.user) {
        const profile = await loadProfile(authResult.data.user.id);
        console.log('[auth] Setting state with profile:', profile);
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

  initialize: () => {
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        set({ user: session.user, profile, loading: false });

        // Seed default event types for new owner
        if (event === 'SIGNED_IN' && profile?.role === 'owner' && profile?.family_id) {
          const alreadyHasEventTypes = await hasEventTypes(profile.family_id);
          if (!alreadyHasEventTypes) {
            await seedDefaultEventTypes(profile.family_id);
          }
        }
      } else {
        set({ user: null, profile: null, loading: false });
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        set({ user: session.user, profile, loading: false });
      } else {
        set({ loading: false });
      }
    }).catch(() => {
      set({ loading: false });
    });
  },
}));

useAuthStore.getState().initialize();
