import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ErrorToast, extractErrorMessage } from '@/components/ErrorToast';
import { EditablePoints } from '@/components/EditablePoints';
import { EditableText } from '@/components/EditableText';
import { useTranslation } from '@/i18n/useTranslation';
import type { EventType } from '@/types/database';

export function ActivitiesPage() {
  const { profile } = useAuthStore();
  const t = useTranslation();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deletingEventType, setDeletingEventType] = useState<EventType | null>(null);

  // Add event type state
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventPoints, setNewEventPoints] = useState('');
  const [newEventIcon, setNewEventIcon] = useState('');

  // Drag and drop state
  const [draggedType, setDraggedType] = useState<EventType | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Icon picker state
  const [editingIconTypeId, setEditingIconTypeId] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Split event types by category
  const incomeTypes = eventTypes.filter((t) => !t.is_deduction);
  const expenseTypes = eventTypes.filter((t) => t.is_deduction);

  useEffect(() => {
    if (!profile) return;
    loadEventTypes();
  }, [profile]);

  const loadEventTypes = async () => {
    if (!profile || !profile.family_id) return;
    const { data } = await supabase
      .from('event_types')
      .select('*')
      .eq('family_id', profile.family_id)
      .order('sort_order');

    if (data) {
      setEventTypes(data);
    }
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

  // Available icons for activities
  const availableIcons = [
    // Income / Rewards
    '⭐', '🌟', '✨', '💫', '🏆', '🥇', '🎖️', '🏅',
    '✅', '👍', '💪', '🎯', '🚀', '📚', '📖', '✏️',
    '🎨', '🎵', '🎹', '⚽', '🏀', '🎾', '🏊', '🚴',
    '🧹', '🍽️', '🛏️', '🐕', '🌱', '💡', '🎁', '❤️',
    // Expenses / Deductions
    '💸', '💰', '🛒', '🛍️', '🎮', '📱', '💻', '🍬',
    '🍭', '🍫', '🍿', '🎬', '📺', '🎪', '🎢', '🧸',
    '⚠️', '❌', '🚫', '😤', '😢', '🤕', '💔', '⏰',
  ];

  const handleUpdateEventTypeIcon = useCallback(
    async (typeId: string, newIcon: string) => {
      const { error } = await supabase
        .from('event_types')
        .update({ icon: newIcon })
        .eq('id', typeId);

      if (error) {
        setError(extractErrorMessage(error));
        return;
      }

      setEventTypes((prev) =>
        prev.map((t) => (t.id === typeId ? { ...t, icon: newIcon } : t))
      );
      setEditingIconTypeId(null);
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
    if (!profile || !profile.family_id || !newEventName.trim()) return;
    setLoading(true);

    try {
      const points = parseInt(newEventPoints, 10) || 1;
      const maxSortOrder = Math.max(0, ...eventTypes.map((t) => t.sort_order));

      const { error } = await supabase.from('event_types').insert({
        family_id: profile.family_id,
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, type: EventType) => {
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, type: EventType) => {
    e.preventDefault();
    if (draggedType && draggedType.id !== type.id && draggedType.is_deduction === type.is_deduction) {
      setDragOverId(type.id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetType: EventType) => {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedType || draggedType.id === targetType.id) {
      setDraggedType(null);
      return;
    }

    // Only allow reordering within the same category
    if (draggedType.is_deduction !== targetType.is_deduction) {
      setDraggedType(null);
      return;
    }

    const categoryTypes = draggedType.is_deduction ? expenseTypes : incomeTypes;
    const draggedIndex = categoryTypes.findIndex((t) => t.id === draggedType.id);
    const targetIndex = categoryTypes.findIndex((t) => t.id === targetType.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedType(null);
      return;
    }

    // Reorder locally first for immediate feedback
    const reordered = [...categoryTypes];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update sort_order values
    const updates = reordered.map((type, index) => ({
      id: type.id,
      sort_order: index,
    }));

    // Update local state immediately
    setEventTypes((prev) => {
      const otherTypes = prev.filter((t) => t.is_deduction !== draggedType.is_deduction);
      const updatedTypes = reordered.map((type, index) => ({
        ...type,
        sort_order: index,
      }));
      return [...otherTypes, ...updatedTypes].sort((a, b) => a.sort_order - b.sort_order);
    });

    setDraggedType(null);

    // Persist to database
    try {
      for (const update of updates) {
        await supabase
          .from('event_types')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    } catch (err) {
      console.error('Error updating sort order:', err);
      setError(extractErrorMessage(err));
      loadEventTypes(); // Reload on error
    }
  };

  const handleDragEnd = () => {
    setDraggedType(null);
    setDragOverId(null);
  };

  // Render event type row
  const renderEventTypeRow = (type: EventType) => (
    <div
      key={type.id}
      draggable={editingIconTypeId !== type.id}
      onDragStart={(e) => handleDragStart(e, type)}
      onDragOver={(e) => handleDragOver(e, type)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, type)}
      onDragEnd={handleDragEnd}
      className={cn(
        'relative flex items-center justify-between gap-2 rounded-lg border bg-card p-3',
        editingIconTypeId !== type.id && 'cursor-grab active:cursor-grabbing',
        draggedType?.id === type.id && 'opacity-50',
        dragOverId === type.id && 'border-primary border-2'
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
        <button
          onClick={() => setEditingIconTypeId(editingIconTypeId === type.id ? null : type.id)}
          className="shrink-0 text-lg hover:scale-125 transition-transform rounded p-1 hover:bg-accent"
          title={t.activities.changeIcon}
        >
          {type.icon}
        </button>
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

      {/* Icon picker dropdown */}
      {editingIconTypeId === type.id && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setEditingIconTypeId(null)}
          />
          <div className="absolute left-8 top-full z-20 mt-1 w-64 rounded-lg border bg-background p-2 shadow-lg">
            <div className="grid grid-cols-8 gap-1">
              {availableIcons.map((icon) => (
                <button
                  key={icon}
                  onClick={() => handleUpdateEventTypeIcon(type.id, icon)}
                  className={cn(
                    'rounded p-1.5 text-lg hover:bg-accent transition-colors',
                    type.icon === icon && 'bg-primary/20 ring-2 ring-primary'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col p-4">
      <ErrorToast message={error} onClose={clearError} />
      <h1 className="mb-6 text-xl font-bold">{t.activities.title}</h1>

      {/* Income types section */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-green-600">{t.activities.income}</h2>
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
                placeholder={t.activities.name}
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
                {t.activities.cancel}
              </button>
              <button
                type="submit"
                disabled={loading || !newEventName.trim()}
                className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {loading ? t.activities.adding : t.activities.add}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddIncome(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-green-500 p-3 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
          >
            <Plus className="h-4 w-4" />
            {t.activities.addIncome}
          </button>
        )}
      </section>

      {/* Expense types section */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-destructive">{t.activities.expense}</h2>
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
                placeholder={t.activities.name}
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
                {t.activities.cancel}
              </button>
              <button
                type="submit"
                disabled={loading || !newEventName.trim()}
                className="flex-1 rounded-md bg-destructive px-4 py-2 text-destructive-foreground disabled:opacity-50"
              >
                {loading ? t.activities.adding : t.activities.add}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddExpense(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-destructive p-3 text-destructive hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Plus className="h-4 w-4" />
            {t.activities.addExpense}
          </button>
        )}
      </section>

      {/* Delete Event Type Confirmation Modal */}
      {deletingEventType && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setDeletingEventType(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background p-4">
            <h2 className="mb-2 text-lg font-semibold">{t.activities.deleteCategory}</h2>
            <p className="mb-4 text-muted-foreground">
              {t.activities.deleteConfirm} &quot;{deletingEventType.name}&quot;? {t.activities.cannotUndo}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingEventType(null)}
                className="flex-1 rounded-md border px-4 py-3 font-medium"
              >
                {t.activities.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteEventType}
                disabled={loading}
                className="flex-1 rounded-md bg-destructive px-4 py-3 font-medium text-destructive-foreground disabled:opacity-50"
              >
                {loading ? t.activities.deleting : t.activities.delete}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
