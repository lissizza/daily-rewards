import { Outlet, NavLink } from 'react-router-dom';
import { Home, Calendar, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

export function Layout() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 overflow-auto pb-16">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="mx-auto flex max-w-md justify-around py-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Home className="h-5 w-5" />
            <span>Главная</span>
          </NavLink>

          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Calendar className="h-5 w-5" />
            <span>Календарь</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-4 py-2 text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <Settings className="h-5 w-5" />
              <span>Настройки</span>
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  );
}
