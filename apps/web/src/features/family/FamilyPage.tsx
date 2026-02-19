import { useEffect, useState, useCallback } from 'react';
import { LogOut, Plus, Pencil, Trash2, X, Globe, Bell, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { ErrorToast, extractErrorMessage } from '@/components/ErrorToast';
import { useLanguageStore, type Language } from '@/stores/language';
import { useTranslation } from '@/i18n/useTranslation';
import { validatePassword, validatePasswordRu, PASSWORD_MIN_LENGTH } from '@/lib/validation';
import type { Profile } from '@/types/database';

export function FamilyPage() {
  const { profile, signOut } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const t = useTranslation();
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

    // Validate password
    const validation = language === 'ru'
      ? validatePasswordRu(newChildPassword)
      : validatePassword(newChildPassword);
    if (!validation.valid) {
      setError(validation.error || 'Invalid password');
      return;
    }

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
      setError(language === 'ru' ? 'Только владелец семьи может добавлять второго родителя' : 'Only the family owner can add a co-parent');
      return;
    }

    // Validate password
    const validation = language === 'ru'
      ? validatePasswordRu(coParentPassword)
      : validatePassword(coParentPassword);
    if (!validation.valid) {
      setError(validation.error || 'Invalid password');
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
      <h1 className="mb-6 text-xl font-bold">{t.family.title}</h1>

      {/* Children section */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">{t.family.children}</h2>

        <div className="space-y-2">
          {children.map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3"
            >
              <div>
                <p className="font-medium">{child.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t.family.login}: {child.login}
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
              <label className="block text-sm font-medium">{t.family.name}</label>
              <input
                type="text"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t.family.login}</label>
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
              <label className="block text-sm font-medium">{t.family.password}</label>
              <input
                type="password"
                value={newChildPassword}
                onChange={(e) => setNewChildPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                required
                minLength={PASSWORD_MIN_LENGTH}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddChild(false)}
                className="flex-1 rounded-md border px-4 py-2"
              >
                {t.family.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
              >
                {loading ? t.family.adding : t.family.add}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddChild(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            {t.family.addChild}
          </button>
        )}
      </section>

      {/* Adults section */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">{t.family.adults}</h2>

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
                    <span className="ml-2 text-xs text-muted-foreground">({t.family.you})</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {parent.email || (parent.role === 'owner' ? t.family.owner : '')}
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
                  <label className="block text-sm font-medium">{t.family.name}</label>
                  <input
                    type="text"
                    value={coParentName}
                    onChange={(e) => setCoParentName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.family.email}</label>
                  <input
                    type="email"
                    value={coParentEmail}
                    onChange={(e) => setCoParentEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.family.password}</label>
                  <input
                    type="password"
                    value={coParentPassword}
                    onChange={(e) => setCoParentPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
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
                    {t.family.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                  >
                    {loading ? t.family.adding : t.family.add}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddCoParent(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                {t.family.addAdult}
              </button>
            )}
          </>
        )}
      </section>

      {/* Notification settings */}
      <section className="mb-6">
        <NavLink
          to="/notifications"
          className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-accent"
        >
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>{t.notifications.settingsTitle}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </NavLink>
      </section>

      {/* Language switcher */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">{t.family.language}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('ru')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 ${
              language === 'ru'
                ? 'border-primary bg-primary/10 text-primary'
                : 'hover:bg-accent'
            }`}
          >
            <Globe className="h-4 w-4" />
            Русский
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 ${
              language === 'en'
                ? 'border-primary bg-primary/10 text-primary'
                : 'hover:bg-accent'
            }`}
          >
            <Globe className="h-4 w-4" />
            English
          </button>
        </div>
      </section>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2 rounded-lg border border-destructive p-3 text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        {t.family.signOut}
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
              <h2 className="text-lg font-semibold">{t.family.editChild}</h2>
              <button
                onClick={() => setEditingChild(null)}
                className="rounded-md p-2 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateChild} className="space-y-4 p-4">
              <div>
                <label className="block text-sm font-medium">{t.family.name}</label>
                <input
                  type="text"
                  value={editChildName}
                  onChange={(e) => setEditChildName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">{t.family.login}</label>
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
                  {t.family.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
                >
                  {loading ? t.family.saving : t.family.save}
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
            <h2 className="mb-2 text-lg font-semibold">{t.family.deleteChild}</h2>
            <p className="mb-4 text-muted-foreground">
              {t.family.deleteConfirm} &quot;{deletingChild.name}&quot;? {t.family.cannotUndo}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingChild(null)}
                className="flex-1 rounded-md border px-4 py-3 font-medium"
              >
                {t.family.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteChild}
                disabled={loading}
                className="flex-1 rounded-md bg-destructive px-4 py-3 font-medium text-destructive-foreground disabled:opacity-50"
              >
                {loading ? t.family.deleting : t.family.delete}
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
              <h2 className="text-lg font-semibold">{t.family.editAdult}</h2>
              <button
                onClick={() => setEditingAdult(null)}
                className="rounded-md p-2 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateAdult} className="space-y-4 p-4">
              <div>
                <label className="block text-sm font-medium">{t.family.name}</label>
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
                  {t.family.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
                >
                  {loading ? t.family.saving : t.family.save}
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
            <h2 className="mb-2 text-lg font-semibold">{t.family.deleteAdult}</h2>
            <p className="mb-4 text-muted-foreground">
              {t.family.deleteConfirm} &quot;{deletingAdult.name}&quot;? {t.family.cannotUndo}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingAdult(null)}
                className="flex-1 rounded-md border px-4 py-3 font-medium"
              >
                {t.family.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteAdult}
                disabled={loading}
                className="flex-1 rounded-md bg-destructive px-4 py-3 font-medium text-destructive-foreground disabled:opacity-50"
              >
                {loading ? t.family.deleting : t.family.delete}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
