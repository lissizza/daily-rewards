import { useEffect, useState, useCallback } from 'react';
import { LogOut, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { ErrorToast, extractErrorMessage } from '@/components/ErrorToast';
import type { Profile } from '@/types/database';

export function FamilyPage() {
  const { profile, signOut } = useAuthStore();
  const [children, setChildren] = useState<Profile[]>([]);
  const [parents, setParents] = useState<Profile[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildLogin, setNewChildLogin] = useState('');
  const [newChildPassword, setNewChildPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deletingChild, setDeletingChild] = useState<Profile | null>(null);
  const [deletingAdult, setDeletingAdult] = useState<Profile | null>(null);

  // Edit child modal
  const [editingChild, setEditingChild] = useState<Profile | null>(null);
  const [editChildName, setEditChildName] = useState('');
  const [editChildLogin, setEditChildLogin] = useState('');

  // Edit adult modal
  const [editingAdult, setEditingAdult] = useState<Profile | null>(null);
  const [editAdultName, setEditAdultName] = useState('');

  // Add co-parent (second admin) state
  const [showAddCoParent, setShowAddCoParent] = useState(false);
  const [coParentEmail, setCoParentEmail] = useState('');
  const [coParentName, setCoParentName] = useState('');
  const [coParentPassword, setCoParentPassword] = useState('');

  const clearError = useCallback(() => setError(null), []);

  const isOwner = profile?.role === 'owner';

  useEffect(() => {
    if (!profile) return;
    loadChildren();
    loadParents();
  }, [profile]);

  const loadChildren = async () => {
    if (!profile || !profile.family_id) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('family_id', profile.family_id)
      .eq('role', 'child')
      .order('name');

    if (data) {
      setChildren(data);
    }
  };

  const loadParents = async () => {
    if (!profile || !profile.family_id) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('family_id', profile.family_id)
      .neq('role', 'child')
      .order('created_at');

    if (error) {
      console.error('Error loading parents:', error);
    }
    if (data) {
      setParents(data);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !profile.family_id) return;
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
          family_id: profile.family_id,
          parent_id: profile.id, // Keep for backwards compatibility
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

  const handleAddCoParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !profile.family_id) return;
    if (profile.role !== 'owner') {
      setError('Только владелец семьи может добавлять второго родителя');
      return;
    }
    setLoading(true);

    try {
      // Create new user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: coParentEmail,
        password: coParentPassword,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update their profile to be an admin in the same family
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: coParentName,
          role: 'admin',
          family_id: profile.family_id,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      setCoParentEmail('');
      setCoParentName('');
      setCoParentPassword('');
      setShowAddCoParent(false);
      loadParents();
    } catch (err) {
      console.error('Error adding co-parent:', err);
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

  // Adult handlers
  const openEditAdult = (adult: Profile) => {
    setEditingAdult(adult);
    setEditAdultName(adult.name);
  };

  const handleUpdateAdult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdult) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: editAdultName })
        .eq('id', editingAdult.id);

      if (error) throw error;

      setEditingAdult(null);
      loadParents();
    } catch (err) {
      console.error('Error updating adult:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdult = async () => {
    if (!deletingAdult) return;
    setLoading(true);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingAdult.id);

      if (profileError) throw profileError;

      setDeletingAdult(null);
      loadParents();
    } catch (err) {
      console.error('Error deleting adult:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-4">
      <ErrorToast message={error} onClose={clearError} />
      <h1 className="mb-6 text-xl font-bold">Семья</h1>

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

      {/* Adults section */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Взрослые</h2>

        <div className="space-y-2">
          {parents.map((parent) => (
            <div
              key={parent.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3"
            >
              <div>
                <p className="font-medium">
                  {parent.name}
                  {parent.id === profile?.id && (
                    <span className="ml-2 text-xs text-muted-foreground">(вы)</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {parent.email || (parent.role === 'owner' ? 'Владелец' : '')}
                </p>
              </div>
              {/* Show edit/delete only for owner, and can't delete yourself */}
              {isOwner && parent.id !== profile?.id && (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditAdult(parent)}
                    className="rounded-md p-2 hover:bg-accent"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingAdult(parent)}
                    className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add adult - only visible to owner */}
        {isOwner && (
          <>
            {showAddCoParent ? (
              <form onSubmit={handleAddCoParent} className="mt-3 space-y-3 rounded-lg border p-3">
                <div>
                  <label className="block text-sm font-medium">Имя</label>
                  <input
                    type="text"
                    value={coParentName}
                    onChange={(e) => setCoParentName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={coParentEmail}
                    onChange={(e) => setCoParentEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Пароль</label>
                  <input
                    type="password"
                    value={coParentPassword}
                    onChange={(e) => setCoParentPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCoParent(false);
                      setCoParentEmail('');
                      setCoParentName('');
                      setCoParentPassword('');
                    }}
                    className="flex-1 rounded-md border px-4 py-2"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                  >
                    {loading ? 'Создание...' : 'Создать'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddCoParent(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                Добавить взрослого
              </button>
            )}
          </>
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

      {/* Edit Adult Modal */}
      {editingAdult && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setEditingAdult(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background">
            <div className="sticky top-0 flex items-center justify-between border-b bg-background p-4">
              <h2 className="text-lg font-semibold">Редактировать взрослого</h2>
              <button
                onClick={() => setEditingAdult(null)}
                className="rounded-md p-2 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateAdult} className="space-y-4 p-4">
              <div>
                <label className="block text-sm font-medium">Имя</label>
                <input
                  type="text"
                  value={editAdultName}
                  onChange={(e) => setEditAdultName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAdult(null)}
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

      {/* Delete Adult Confirmation Modal */}
      {deletingAdult && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setDeletingAdult(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background p-4">
            <h2 className="mb-2 text-lg font-semibold">Удалить взрослого?</h2>
            <p className="mb-4 text-muted-foreground">
              Вы уверены, что хотите удалить &quot;{deletingAdult.name}&quot;? Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingAdult(null)}
                className="flex-1 rounded-md border px-4 py-3 font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDeleteAdult}
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
