import { Outlet, NavLink } from 'react-router-dom';
import { Home, Calendar, Sparkles, Users, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/utils';

export function Layout() {
  const { profile, signOut } = useAuthStore();
  const t = useTranslation();
  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 overflow-auto pb-16">
        <div className="mx-auto max-w-md">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="mx-auto flex max-w-md justify-around py-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Home className="h-5 w-5" />
            <span>{t.nav.home}</span>
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
