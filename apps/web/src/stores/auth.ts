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
  initialize: () => () => void;
}

async function loadProfile(userId: string): Promise<Profile | null> {
  console.log('[auth] Loading profile for user:', userId);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[auth] Profile load error:', error.message);
    return null;
  }

  console.log('[auth] Profile loaded:', data?.role, data?.name);
  return data;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (emailOrLogin: string, password: string) => {
    const isEmail = emailOrLogin.includes('@');

    let email = emailOrLogin;
    if (!isEmail) {
      const { data, error } = await supabase.rpc('get_email_by_login', { p_login: emailOrLogin });
      if (error || !data) throw new Error('Пользователь не найден');
      email = data;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      const profile = await loadProfile(authData.user.id);
      set({ user: authData.user, profile, loading: false });

      // Seed default event types for new owner
      if (profile?.role === 'owner' && profile?.family_id) {
        const alreadyHasEventTypes = await hasEventTypes(profile.family_id);
        if (!alreadyHasEventTypes) {
          await seedDefaultEventTypes(profile.family_id);
        }
      }
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, loading: false });
  },

  initialize: () => {
    console.log('[auth] Initializing...');

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[auth] getSession:', session?.user?.id ?? 'no session');

      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        set({ user: session.user, profile, loading: false });
      } else {
        set({ loading: false });
      }
    });

    // Listen for auth changes (sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth] onAuthStateChange:', event);

      if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, loading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  },
}));
