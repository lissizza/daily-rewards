import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useLanguageStore } from '@/stores/language';
import { supabase } from '@/lib/supabase';
import { cn, formatPoints } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import type { Event, EventType } from '@/types/database';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  getWeek,
} from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

type ViewMode = 'month' | 'week';

interface DayData {
  date: Date;
  events: Event[];
  totalPoints: number;
}

export function CalendarPage() {
  const { selectedDate, setSelectedDate, selectedChildId } = useAppStore();
  const { profile } = useAuthStore();
  const { language } = useLanguageStore();
  const navigate = useNavigate();
  const t = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(selectedDate), { weekStartsOn: 1 })
  );
  const [weekEvents, setWeekEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';
  const currentChildId = isAdmin ? selectedChildId : profile?.id;
  const dateLocale = language === 'ru' ? ru : enUS;

  // Load event types
  useEffect(() => {
    if (!profile || !profile.family_id) return;

    const loadEventTypes = async () => {
      const { data } = await supabase
        .from('event_types')
        .select('*')
        .eq('family_id', profile.family_id)
        .order('sort_order');

      if (data) {
        setEventTypes(data);
      }
    };

    loadEventTypes();
  }, [profile]);

  // Load week events when in week view
  useEffect(() => {
    if (viewMode !== 'week' || !currentChildId) return;

    const loadWeekEvents = async () => {
      setLoading(true);
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('child_id', currentChildId)
        .gte('date', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('created_at');

      if (data) {
        setWeekEvents(data);
      }
      setLoading(false);
    };

    loadWeekEvents();
  }, [viewMode, currentWeekStart, currentChildId]);

  // Month view calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = t.calendar.weekDays;
  const weekDaysFull = t.calendar.weekDays;

  // Week view calculations
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekViewDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  const weekNumber = getWeek(currentWeekStart, { weekStartsOn: 1 });

  // Get events for a specific day
  const getEventsForDay = (date: Date): Event[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return weekEvents.filter((event) => event.date === dateStr);
  };

  // Calculate total points for a day
  const getTotalPointsForDay = (events: Event[]): number => {
    return events.reduce((sum, event) => sum + event.points, 0);
  };

  // Get event type icon
  const getEventIcon = (event: Event): string => {
    const type = eventTypes.find((t) => t.id === event.event_type_id);
    return type?.icon ?? '';
  };

  // Get unique icons for day events
  const getUniqueIconsForDay = (events: Event[]): string[] => {
    const icons = events
      .map((event) => getEventIcon(event))
      .filter((icon) => icon !== '');
    return [...new Set(icons)];
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    navigate('/');
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handlePrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  return (
    <div className="flex flex-col p-4">
      {/* View toggle */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-lg border bg-muted p-1">
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              viewMode === 'month'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.calendar.month}
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              viewMode === 'week'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.calendar.week}
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        // Month view
        <>
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="rounded-md p-2 hover:bg-accent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold capitalize">
              {format(currentMonth, 'LLLL yyyy', { locale: dateLocale })}
            </h2>

            <button
              onClick={handleNextMonth}
              className="rounded-md p-2 hover:bg-accent"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Week days header */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, new Date(selectedDate));
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'aspect-square rounded-md p-1 text-sm hover:bg-accent',
                    !isCurrentMonth && 'text-muted-foreground opacity-50',
                    isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                    isToday && !isSelected && 'border border-primary'
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        // Week view
        <>
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handlePrevWeek}
              className="rounded-md p-2 hover:bg-accent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold">
              {t.calendar.weekNumber} {weekNumber}, {format(currentWeekStart, 'LLLL yyyy', { locale: dateLocale })}
            </h2>

            <button
              onClick={handleNextWeek}
              className="rounded-md p-2 hover:bg-accent"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Week days list */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-2">
              {weekViewDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const totalPoints = getTotalPointsForDay(dayEvents);
                const icons = getUniqueIconsForDay(dayEvents);
                const isSelected = isSameDay(day, new Date(selectedDate));
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      'flex w-full items-center rounded-lg border p-3 transition-colors hover:bg-accent',
                      isSelected && 'border-primary bg-primary/5',
                      isToday && !isSelected && 'border-primary/50'
                    )}
                  >
                    {/* Day info */}
                    <div className="flex w-16 flex-col items-start">
                      <span className="text-sm text-muted-foreground">
                        {weekDaysFull[index]}
                      </span>
                      <span className={cn(
                        'text-lg font-semibold',
                        isToday && 'text-primary'
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Separator */}
                    <div className="mx-3 h-10 w-px bg-border" />

                    {/* Events icons */}
                    <div className="flex flex-1 flex-wrap gap-1">
                      {icons.length > 0 ? (
                        icons.map((icon, i) => (
                          <span key={i} className="text-lg">
                            {icon}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          —
                        </span>
                      )}
                    </div>

                    {/* Total points */}
                    <div className="ml-auto text-right">
                      {totalPoints !== 0 ? (
                        <span
                          className={cn(
                            'font-semibold',
                            totalPoints > 0 ? 'text-green-600' : 'text-destructive'
                          )}
                        >
                          {formatPoints(totalPoints)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
