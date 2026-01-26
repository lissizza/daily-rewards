import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app';
import { cn } from '@/lib/utils';
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
} from 'date-fns';
import { ru } from 'date-fns/locale';

export function CalendarPage() {
  const { selectedDate, setSelectedDate } = useAppStore();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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

  return (
    <div className="flex flex-col p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="rounded-md p-2 hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
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
        {days.map((day) => {
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
    </div>
  );
}
