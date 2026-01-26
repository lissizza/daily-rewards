import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import { supabase } from '@/lib/supabase';
import { formatDate, formatPoints, cn } from '@/lib/utils';
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

  const isAdmin = profile?.role === 'admin';
  const currentChildId = isAdmin ? selectedChildId : profile?.id;

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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('parent_id', profile!.id)
      .order('name');

    if (data) {
      setChildren(data);
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadEventTypes = async () => {
    const adminId = isAdmin ? profile!.id : profile!.parent_id;
    if (!adminId) return;

    const { data } = await supabase
      .from('event_types')
      .select('*')
      .eq('admin_id', adminId)
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
          <p className="py-8 text-center text-muted-foreground">
            Нет событий
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{getEventTypeIcon(event)}</span>
                    <span className="font-medium">{getEventTypeName(event)}</span>
                  </div>
                  <span
                    className={cn(
                      'font-semibold',
                      event.points >= 0 ? 'text-green-600' : 'text-destructive'
                    )}
                  >
                    {formatPoints(event.points)}
                  </span>
                </div>
                {event.note && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add button (admin only) */}
      {isAdmin && currentChildId && (
        <button
          onClick={() => {/* TODO: open add modal */}}
          className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
