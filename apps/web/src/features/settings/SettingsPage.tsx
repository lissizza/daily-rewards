import { useEffect, useState, useCallback } from 'react';
import { LogOut, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { ErrorToast, extractErrorMessage } from '@/components/ErrorToast';
import { EditablePoints } from '@/components/EditablePoints';
import { EditableText } from '@/components/EditableText';
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

  // Delete state
  const [deletingEventType, setDeletingEventType] = useState<EventType | null>(null);
  const [deletingChild, setDeletingChild] = useState<Profile | null>(null);

  // Edit child modal
  const [editingChild, setEditingChild] = useState<Profile | null>(null);
  const [editChildName, setEditChildName] = useState('');
  const [editChildLogin, setEditChildLogin] = useState('');

  // Add event type state
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventPoints, setNewEventPoints] = useState('');
  const [newEventIcon, setNewEventIcon] = useState('');

  const clearError = useCallback(() => setError(null), []);

  // Split event types by category
  const incomeTypes = eventTypes.filter((t) => !t.is_deduction);
  const expenseTypes = eventTypes.filter((t) => t.is_deduction);

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

  // Inline edit handlers for event types
  const handleUpdateEventTypeName = useCallback(
    async (typeId: string, newName: string) => {
      const { error } = await supabase
        .from('event_types')
        .update({ name: newName })
        .eq('id', typeId);

      if (error) {
        setError(extractErrorMessage(error));
        throw error;
      }

      setEventTypes((prev) =>
        prev.map((t) => (t.id === typeId ? { ...t, name: newName } : t))
      );
    },
    []
  );

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

      setEventTypes((prev) =>
        prev.map((t) => (t.id === typeId ? { ...t, default_points: newPoints } : t))
      );
    },
    []
  );

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

  const handleAddEventType = async (isDeduction: boolean) => {
    if (!profile || !newEventName.trim()) return;
    setLoading(true);

    try {
      const points = parseInt(newEventPoints, 10) || 1;
      const maxSortOrder = Math.max(0, ...eventTypes.map((t) => t.sort_order));

      const { error } = await supabase.from('event_types').insert({
        admin_id: profile.id,
        name: newEventName.trim(),
        default_points: points,
        is_deduction: isDeduction,
        icon: newEventIcon || (isDeduction ? '💸' : '⭐'),
        sort_order: maxSortOrder + 1,
      });

      if (error) throw error;

      setNewEventName('');
      setNewEventPoints('');
      setNewEventIcon('');
      setShowAddIncome(false);
      setShowAddExpense(false);
      loadEventTypes();
    } catch (err) {
      console.error('Error adding event type:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Child handlers
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
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingChild.id);

      if (profileError) throw profileError;

      setDeletingChild(null);
      loadChildren();
    } catch (err) {
      console.error('Error deleting child:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Render event type row
  const renderEventTypeRow = (type: EventType) => (
    <div
      key={type.id}
      className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="shrink-0 text-lg">{type.icon}</span>
        <EditableText
          value={type.name}
          onSave={(newName) => handleUpdateEventTypeName(type.id, newName)}
          className="font-medium"
        />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <EditablePoints
          value={type.default_points}
          isDeduction={type.is_deduction}
          onSave={(newValue) => handleUpdateEventTypePoints(type.id, newValue)}
        />
        <button
          onClick={() => setDeletingEventType(type)}
          className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
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
              <div className="flex gap-1">
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

      {/* Income types section */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-green-600">Доход</h2>
        <div className="space-y-2">
          {incomeTypes.map(renderEventTypeRow)}
        </div>

        {showAddIncome ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddEventType(false);
            }}
            className="mt-3 space-y-3 rounded-lg border p-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newEventIcon}
                onChange={(e) => setNewEventIcon(e.target.value)}
                placeholder="⭐"
                className="w-12 rounded-md border border-input bg-background px-2 py-2 text-center"
                maxLength={2}
              />
              <input
                type="text"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder="Название"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2"
                required
              />
              <input
                type="number"
                value={newEventPoints}
                onChange={(e) => setNewEventPoints(e.target.value)}
                placeholder="1"
                className="w-16 rounded-md border border-input bg-background px-2 py-2 text-center"
                min={1}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddIncome(false);
                  setNewEventName('');
                  setNewEventPoints('');
                  setNewEventIcon('');
                }}
                className="flex-1 rounded-md border px-4 py-2"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || !newEventName.trim()}
                className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {loading ? 'Добавление...' : 'Добавить'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddIncome(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-green-500 p-3 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
          >
            <Plus className="h-4 w-4" />
            Добавить доход
          </button>
        )}
      </section>

      {/* Expense types section */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-destructive">Расход</h2>
        <div className="space-y-2">
          {expenseTypes.map(renderEventTypeRow)}
        </div>

        {showAddExpense ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddEventType(true);
            }}
            className="mt-3 space-y-3 rounded-lg border p-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newEventIcon}
                onChange={(e) => setNewEventIcon(e.target.value)}
                placeholder="💸"
                className="w-12 rounded-md border border-input bg-background px-2 py-2 text-center"
                maxLength={2}
              />
              <input
                type="text"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder="Название"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2"
                required
              />
              <input
                type="number"
                value={newEventPoints}
                onChange={(e) => setNewEventPoints(e.target.value)}
                placeholder="1"
                className="w-16 rounded-md border border-input bg-background px-2 py-2 text-center"
                min={1}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddExpense(false);
                  setNewEventName('');
                  setNewEventPoints('');
                  setNewEventIcon('');
                }}
                className="flex-1 rounded-md border px-4 py-2"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || !newEventName.trim()}
                className="flex-1 rounded-md bg-destructive px-4 py-2 text-destructive-foreground disabled:opacity-50"
              >
                {loading ? 'Добавление...' : 'Добавить'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddExpense(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-destructive p-3 text-destructive hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Plus className="h-4 w-4" />
            Добавить расход
          </button>
        )}
      </section>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2 rounded-lg border border-destructive p-3 text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        Выйти
      </button>

      {/* Delete Event Type Confirmation Modal */}
      {deletingEventType && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setDeletingEventType(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background p-4">
            <h2 className="mb-2 text-lg font-semibold">Удалить категорию?</h2>
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
