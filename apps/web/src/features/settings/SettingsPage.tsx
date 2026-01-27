import { useEffect, useState, useCallback } from 'react';
import { LogOut, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { ErrorToast, extractErrorMessage } from '@/components/ErrorToast';
import { EditablePoints } from '@/components/EditablePoints';
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
  const [error, setError] = useState<string | null>(null);

  // Edit/Delete state for event types
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [deletingEventType, setDeletingEventType] = useState<EventType | null>(null);

  // Edit/Delete state for children
  const [editingChild, setEditingChild] = useState<Profile | null>(null);
  const [deletingChild, setDeletingChild] = useState<Profile | null>(null);

  // Form state for editing event type
  const [editEventTypeName, setEditEventTypeName] = useState('');
  const [editEventTypeIcon, setEditEventTypeIcon] = useState('');
  const [editEventTypePoints, setEditEventTypePoints] = useState(0);
  const [editEventTypeIsDeduction, setEditEventTypeIsDeduction] = useState(false);

  // Form state for editing child
  const [editChildName, setEditChildName] = useState('');
  const [editChildLogin, setEditChildLogin] = useState('');

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (!profile) return;
    loadChildren();
    loadEventTypes();
  }, [profile]);

  const loadChildren = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('parent_id', profile.id)
      .order('name');

    if (data) {
      setChildren(data);
    }
  };

  const loadEventTypes = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('event_types')
      .select('*')
      .eq('admin_id', profile.id)
      .order('sort_order');

    if (data) {
      setEventTypes(data);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
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
          parent_id: profile.id,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      setNewChildName('');
      setNewChildLogin('');
      setNewChildPassword('');
      setShowAddChild(false);
      loadChildren();
    } catch (err) {
      console.error('Error adding child:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Event Type Edit/Delete handlers
  const openEditEventType = (eventType: EventType) => {
    setEditingEventType(eventType);
    setEditEventTypeName(eventType.name);
    setEditEventTypeIcon(eventType.icon || '');
    setEditEventTypePoints(Math.abs(eventType.default_points));
    setEditEventTypeIsDeduction(eventType.is_deduction);
  };

  const handleUpdateEventType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventType) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('event_types')
        .update({
          name: editEventTypeName,
          icon: editEventTypeIcon || null,
          default_points: editEventTypeIsDeduction ? -Math.abs(editEventTypePoints) : Math.abs(editEventTypePoints),
          is_deduction: editEventTypeIsDeduction,
        })
        .eq('id', editingEventType.id);

      if (error) throw error;

      setEditingEventType(null);
      loadEventTypes();
    } catch (err) {
      console.error('Error updating event type:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEventType = async () => {
    if (!deletingEventType) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('event_types')
        .delete()
        .eq('id', deletingEventType.id);

      if (error) throw error;

      setDeletingEventType(null);
      loadEventTypes();
    } catch (err) {
      console.error('Error deleting event type:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Child Edit/Delete handlers
  const openEditChild = (child: Profile) => {
    setEditingChild(child);
    setEditChildName(child.name);
    setEditChildLogin(child.login || '');
  };

  const handleUpdateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editChildName,
          login: editChildLogin,
        })
        .eq('id', editingChild.id);

      if (error) throw error;

      setEditingChild(null);
      loadChildren();
    } catch (err) {
      console.error('Error updating child:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChild = async () => {
    if (!deletingChild) return;
    setLoading(true);

    try {
      // First delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingChild.id);

      if (profileError) throw profileError;

      // Note: Deleting auth user requires admin API, which is not available client-side
      // The profile deletion should cascade properly based on database constraints

      setDeletingChild(null);
      loadChildren();
    } catch (err) {
      console.error('Error deleting child:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Inline edit handler for event type points
  const handleUpdateEventTypePoints = useCallback(
    async (typeId: string, newPoints: number) => {
      const { error } = await supabase
        .from('event_types')
        .update({ default_points: newPoints })
        .eq('id', typeId);

      if (error) {
        setError(extractErrorMessage(error));
        throw error;
      }

      // Update local state immediately
      setEventTypes((prev) =>
        prev.map((t) =>
          t.id === typeId ? { ...t, default_points: newPoints } : t
        )
      );
    },
    []
  );

  return (
    <div className="flex flex-col p-4">
      <ErrorToast message={error} onClose={clearError} />
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
                <button
                  onClick={() => openEditChild(child)}
                  className="rounded-md p-2 hover:bg-accent"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeletingChild(child)}
                  className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                >
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
                <EditablePoints
                  value={type.default_points}
                  isDeduction={type.is_deduction}
                  onSave={(newValue) =>
                    handleUpdateEventTypePoints(type.id, newValue)
                  }
                />
                <button
                  onClick={() => openEditEventType(type)}
                  className="rounded-md p-2 hover:bg-accent"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeletingEventType(type)}
                  className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
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

      {/* Edit Event Type Modal */}
      {editingEventType && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setEditingEventType(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background">
            <div className="sticky top-0 flex items-center justify-between border-b bg-background p-4">
              <h2 className="text-lg font-semibold">Редактировать тип события</h2>
              <button
                onClick={() => setEditingEventType(null)}
                className="rounded-md p-2 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateEventType} className="space-y-4 p-4">
              <div>
                <label className="block text-sm font-medium">Название</label>
                <input
                  type="text"
                  value={editEventTypeName}
                  onChange={(e) => setEditEventTypeName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Иконка (эмодзи)</label>
                <input
                  type="text"
                  value={editEventTypeIcon}
                  onChange={(e) => setEditEventTypeIcon(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Например: ⭐"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Баллы по умолчанию</label>
                <input
                  type="number"
                  value={editEventTypePoints}
                  onChange={(e) => setEditEventTypePoints(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  min={0}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDeduction"
                  checked={editEventTypeIsDeduction}
                  onChange={(e) => setEditEventTypeIsDeduction(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <label htmlFor="isDeduction" className="text-sm font-medium">
                  Это штраф (вычитает баллы)
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEventType(null)}
                  className="flex-1 rounded-md border px-4 py-3 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Delete Event Type Confirmation Modal */}
      {deletingEventType && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setDeletingEventType(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background p-4">
            <h2 className="mb-2 text-lg font-semibold">Удалить тип события?</h2>
            <p className="mb-4 text-muted-foreground">
              Вы уверены, что хотите удалить &quot;{deletingEventType.name}&quot;? Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingEventType(null)}
                className="flex-1 rounded-md border px-4 py-3 font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDeleteEventType}
                disabled={loading}
                className="flex-1 rounded-md bg-destructive px-4 py-3 font-medium text-destructive-foreground disabled:opacity-50"
              >
                {loading ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Child Modal */}
      {editingChild && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setEditingChild(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background">
            <div className="sticky top-0 flex items-center justify-between border-b bg-background p-4">
              <h2 className="text-lg font-semibold">Редактировать ребёнка</h2>
              <button
                onClick={() => setEditingChild(null)}
                className="rounded-md p-2 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateChild} className="space-y-4 p-4">
              <div>
                <label className="block text-sm font-medium">Имя</label>
                <input
                  type="text"
                  value={editChildName}
                  onChange={(e) => setEditChildName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Логин</label>
                <input
                  type="text"
                  value={editChildLogin}
                  onChange={(e) => setEditChildLogin(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                  minLength={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingChild(null)}
                  className="flex-1 rounded-md border px-4 py-3 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Delete Child Confirmation Modal */}
      {deletingChild && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setDeletingChild(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background p-4">
            <h2 className="mb-2 text-lg font-semibold">Удалить ребёнка?</h2>
            <p className="mb-4 text-muted-foreground">
              Вы уверены, что хотите удалить &quot;{deletingChild.name}&quot;? Это действие нельзя отменить. Все события связанные с этим ребёнком также будут удалены.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingChild(null)}
                className="flex-1 rounded-md border px-4 py-3 font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDeleteChild}
                disabled={loading}
                className="flex-1 rounded-md bg-destructive px-4 py-3 font-medium text-destructive-foreground disabled:opacity-50"
              >
                {loading ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
