import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Calendar, Sparkles, Users, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useTranslation } from '@/i18n/useTranslation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function Layout() {
  const { profile, signOut } = useAuthStore();
  const t = useTranslation();
  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';

  const [pendingCount, setPendingCount] = useState(0);

  const loadPendingCount = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase.rpc('get_pending_count');
    if (data !== null) setPendingCount(data);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !profile) return;

    loadPendingCount();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel('pending-events')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'events' },
          () => { loadPendingCount(); }
        )
        .subscribe();
    } catch (e) {
      console.error('[Layout] Realtime subscription failed:', e);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [isAdmin, profile, loadPendingCount]);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col overflow-auto pb-16">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="mx-auto flex max-w-md justify-around py-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 px-3 py-2 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Home className="h-5 w-5" />
            <span>{t.nav.home}</span>
            {isAdmin && pendingCount > 0 && (
              <span className="absolute -right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Calendar className="h-5 w-5" />
            <span>{t.nav.calendar}</span>
          </NavLink>

          {isAdmin ? (
            <>
              <NavLink
                to="/activities"
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 px-3 py-2 text-xs',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )
                }
              >
                <Sparkles className="h-5 w-5" />
                <span>{t.nav.activities}</span>
              </NavLink>

              <NavLink
                to="/family"
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 px-3 py-2 text-xs',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )
                }
              >
                <Users className="h-5 w-5" />
                <span>{t.nav.family}</span>
              </NavLink>
            </>
          ) : (
            <button
              onClick={() => signOut()}
              className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-muted-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span>{t.nav.signOut}</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
