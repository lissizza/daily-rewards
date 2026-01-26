import { useEffect, useState } from 'react';
import { LogOut, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import type { Profile, EventType } from '@/types/database';

export function SettingsPage() {
  const { profile, signOut } = useAuthStore();
  const [children, setChildren] = useState<Profile[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildLogin, setNewChildLogin] = useState('');
  const [newChildPassword, setNewChildPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChildren();
    loadEventTypes();
  }, []);

  const loadChildren = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('parent_id', profile!.id)
      .order('name');

    if (data) {
      setChildren(data);
    }
  };

  const loadEventTypes = async () => {
    const { data } = await supabase
      .from('event_types')
      .select('*')
      .eq('admin_id', profile!.id)
      .order('sort_order');

    if (data) {
      setEventTypes(data);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tempEmail = `${newChildLogin}@child.local`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: newChildPassword,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          login: newChildLogin,
          name: newChildName,
          role: 'child',
          parent_id: profile!.id,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      setNewChildName('');
      setNewChildLogin('');
      setNewChildPassword('');
      setShowAddChild(false);
      loadChildren();
    } catch (error) {
      console.error('Error adding child:', error);
      alert('Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col p-4">
      <h1 className="mb-6 text-xl font-bold">Настройки</h1>

      {/* Children section */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Дети</h2>

        <div className="space-y-2">
          {children.map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3"
            >
              <div>
                <p className="font-medium">{child.name}</p>
                <p className="text-sm text-muted-foreground">
                  Логин: {child.login}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-md p-2 hover:bg-accent">
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="rounded-md p-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAddChild ? (
          <form onSubmit={handleAddChild} className="mt-3 space-y-3 rounded-lg border p-3">
            <div>
              <label className="block text-sm font-medium">Имя</label>
              <input
                type="text"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Логин</label>
              <input
                type="text"
                value={newChildLogin}
                onChange={(e) => setNewChildLogin(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Пароль</label>
              <input
                type="password"
                value={newChildPassword}
                onChange={(e) => setNewChildPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                required
                minLength={6}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddChild(false)}
                className="flex-1 rounded-md border px-4 py-2"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
              >
                {loading ? 'Добавление...' : 'Добавить'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddChild(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Добавить ребёнка
          </button>
        )}
      </section>

      {/* Event types section */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Типы событий</h2>

        <div className="space-y-2">
          {eventTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3"
            >
              <div className="flex items-center gap-2">
                <span>{type.icon}</span>
                <span className="font-medium">{type.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    type.is_deduction ? 'text-destructive' : 'text-green-600'
                  }
                >
                  {type.is_deduction ? '-' : '+'}
                  {Math.abs(type.default_points)}
                </span>
                <button className="rounded-md p-2 hover:bg-accent">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2 rounded-lg border border-destructive p-3 text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        Выйти
      </button>
    </div>
  );
}
