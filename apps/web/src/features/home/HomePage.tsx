import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Minus, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import { supabase } from '@/lib/supabase';
import { formatDate, cn } from '@/lib/utils';
import { EditablePoints } from '@/components/EditablePoints';
import { EditableText } from '@/components/EditableText';
import type { Profile, Event, EventType } from '@/types/database';

export function HomePage() {
  const { profile } = useAuthStore();
  const { selectedDate, selectedChildId, setSelectedChildId, goToNextDay, goToPrevDay } = useAppStore();
  const navigate = useNavigate();

  const [children, setChildren] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Quick add dropdown state
  const [showIncomeDropdown, setShowIncomeDropdown] = useState(false);
  const [showExpenseDropdown, setShowExpenseDropdown] = useState(false);

  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';
  const currentChildId = isAdmin ? selectedChildId : profile?.id;

  // Split event types
  const incomeTypes = eventTypes.filter((t) => !t.is_deduction);
  const expenseTypes = eventTypes.filter((t) => t.is_deduction);

  useEffect(() => {
    if (!profile) return;

    if (isAdmin) {
      loadChildren();
    } else {
      loadBalance(profile.id);
    }
    loadEventTypes();
  }, [profile]);

  useEffect(() => {
    if (currentChildId) {
      loadEvents(currentChildId, selectedDate);
      loadBalance(currentChildId);
    }
  }, [currentChildId, selectedDate]);

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
      // Only set first child if no child is selected OR selected child doesn't exist
      if (data.length > 0) {
        const savedChildExists = selectedChildId && data.some((c) => c.id === selectedChildId);
        if (!savedChildExists) {
          setSelectedChildId(data[0].id);
        }
      }
    }
    setLoading(false);
  };

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

  const loadEvents = async (childId: string, date: string) => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('child_id', childId)
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (data) {
      setEvents(data);
    }
  };

  const loadBalance = async (childId: string) => {
    const { data } = await supabase.rpc('get_child_balance', {
      p_child_id: childId,
    });

    if (data !== null) {
      setBalance(data);
    }
  };

  const getEventTypeName = (event: Event): string => {
    if (event.custom_name) return event.custom_name;
    const type = eventTypes.find((t) => t.id === event.event_type_id);
    return type?.name ?? 'Unknown';
  };

  const getEventTypeIcon = (event: Event): string => {
    const type = eventTypes.find((t) => t.id === event.event_type_id);
    return type?.icon ?? '';
  };

  const refreshData = useCallback(() => {
    if (currentChildId) {
      loadEvents(currentChildId, selectedDate);
      loadBalance(currentChildId);
    }
  }, [currentChildId, selectedDate]);

  // Quick add event
  const handleQuickAdd = useCallback(
    async (eventType: EventType) => {
      if (!profile || !currentChildId) return;

      const points = eventType.is_deduction
        ? -Math.abs(eventType.default_points)
        : Math.abs(eventType.default_points);

      const { error } = await supabase.from('events').insert({
        child_id: currentChildId,
        event_type_id: eventType.id,
        points,
        note: '',
        date: selectedDate,
        created_by: profile.id,
      });

      if (!error) {
        refreshData();
      }

      setShowIncomeDropdown(false);
      setShowExpenseDropdown(false);
    },
    [profile, currentChildId, selectedDate, refreshData]
  );

  // Update event points
  const handleUpdateEventPoints = useCallback(
    async (eventId: string, newPoints: number) => {
      const { error } = await supabase
        .from('events')
        .update({ points: newPoints })
        .eq('id', eventId);

      if (error) throw error;

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, points: newPoints } : e))
      );

      if (currentChildId) {
        loadBalance(currentChildId);
      }
    },
    [currentChildId]
  );

  // Update event note
  const handleUpdateEventNote = useCallback(
    async (eventId: string, newNote: string) => {
      const { error } = await supabase
        .from('events')
        .update({ note: newNote })
        .eq('id', eventId);

      if (error) throw error;

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, note: newNote } : e))
      );
    },
    []
  );

  // Delete event
  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (!error) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        if (currentChildId) {
          loadBalance(currentChildId);
        }
      }
    },
    [currentChildId]
  );

  const currentChild = children.find((c) => c.id === selectedChildId);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAdmin && children.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-muted-foreground">Добавьте ребёнка в настройках</p>
        <button
          onClick={() => navigate('/settings')}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Перейти в настройки
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAdmin && children.length > 1 ? (
              <select
                value={selectedChildId ?? ''}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1 font-medium"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-medium">
                {isAdmin ? currentChild?.name : profile?.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-lg font-semibold">
            <span>⭐</span>
            <span className={cn(balance < 0 && 'text-destructive')}>
              {balance}
            </span>
          </div>
        </div>
      </header>

      {/* Date navigation */}
      <div className="flex items-center justify-between border-b p-2">
        <button
          onClick={goToPrevDay}
          className="rounded-md p-2 hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="font-medium">{formatDate(selectedDate)}</span>

        <div className="flex gap-1">
          <button
            onClick={() => navigate('/calendar')}
            className="rounded-md p-2 hover:bg-accent"
          >
            <Calendar className="h-5 w-5" />
          </button>
          <button
            onClick={goToNextDay}
            className="rounded-md p-2 hover:bg-accent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 p-4">
        {events.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">
            Нет событий
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="shrink-0">{getEventTypeIcon(event)}</span>
                    <span className="font-medium truncate">{getEventTypeName(event)}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isAdmin ? (
                      <>
                        <EditablePoints
                          value={event.points}
                          isDeduction={event.points < 0}
                          onSave={(newValue) =>
                            handleUpdateEventPoints(event.id, newValue)
                          }
                        />
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span
                        className={cn(
                          'font-semibold',
                          event.points >= 0 ? 'text-green-600' : 'text-destructive'
                        )}
                      >
                        {event.points >= 0 ? '+' : ''}
                        {event.points}
                      </span>
                    )}
                  </div>
                </div>
                {/* Note - editable for admin, readonly for child */}
                {isAdmin ? (
                  <EditableText
                    value={event.note}
                    onSave={(newNote) => handleUpdateEventNote(event.id, newNote)}
                    placeholder="Добавить заметку..."
                    className="mt-1 w-full text-sm text-muted-foreground"
                  />
                ) : (
                  event.note && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.note}
                    </p>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick add buttons (admin only) */}
        {isAdmin && currentChildId && (
          <div className="mt-4 flex gap-2">
            {/* Income button */}
            <div className="relative flex-1">
              <button
                onClick={() => {
                  setShowIncomeDropdown(!showIncomeDropdown);
                  setShowExpenseDropdown(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-green-500 p-3 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Доход</span>
              </button>

              {/* Income dropdown */}
              {showIncomeDropdown && incomeTypes.length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowIncomeDropdown(false)}
                  />
                  <div className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-64 overflow-y-auto rounded-lg border bg-background shadow-lg">
                    {incomeTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleQuickAdd(type)}
                        className="flex w-full items-center justify-between p-3 hover:bg-accent"
                      >
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.name}</span>
                        </div>
                        <span className="text-green-600">+{Math.abs(type.default_points)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Expense button */}
            <div className="relative flex-1">
              <button
                onClick={() => {
                  setShowExpenseDropdown(!showExpenseDropdown);
                  setShowIncomeDropdown(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-destructive p-3 text-destructive hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Minus className="h-5 w-5" />
                <span className="font-medium">Расход</span>
              </button>

              {/* Expense dropdown */}
              {showExpenseDropdown && expenseTypes.length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExpenseDropdown(false)}
                  />
                  <div className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-64 overflow-y-auto rounded-lg border bg-background shadow-lg">
                    {expenseTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleQuickAdd(type)}
                        className="flex w-full items-center justify-between p-3 hover:bg-accent"
                      >
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.name}</span>
                        </div>
                        <span className="text-destructive">-{Math.abs(type.default_points)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
