import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import type { EventType } from '@/types/database';

interface EventRequestModalProps {
  eventType: EventType;
  onSubmit: (points: number, note: string) => void;
  onClose: () => void;
  submitting?: boolean;
}

export function EventRequestModal({ eventType, onSubmit, onClose, submitting }: EventRequestModalProps) {
  const t = useTranslation();
  const isDeduction = eventType.is_deduction;
  const defaultPoints = Math.abs(eventType.default_points);
  const [points, setPoints] = useState(defaultPoints.toString());
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    const numPoints = parseInt(points, 10);
    if (!numPoints || numPoints <= 0) return;
    const finalPoints = isDeduction ? -numPoints : numPoints;
    onSubmit(finalPoints, note.trim());
  };

  const isValid = parseInt(points, 10) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border bg-background p-5 shadow-xl animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {eventType.icon && <span className="text-xl">{eventType.icon}</span>}
            <h3 className="text-lg font-semibold">{eventType.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Points */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
            {t.activities.points}
          </label>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-lg font-semibold',
              isDeduction ? 'text-destructive' : 'text-green-600'
            )}>
              {isDeduction ? '−' : '+'}
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-lg font-semibold"
              min={1}
              autoFocus
            />
          </div>
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
            {t.home.addNote}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none"
            rows={2}
            placeholder={t.home.requestNotePlaceholder}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className={cn(
            'w-full rounded-lg py-3 font-semibold text-white transition-colors',
            isDeduction
              ? 'bg-destructive hover:bg-destructive/90 disabled:bg-destructive/50'
              : 'bg-green-600 hover:bg-green-700 disabled:bg-green-600/50',
          )}
        >
          {submitting ? t.common.loading : t.home.sendRequest}
        </button>
      </div>
    </div>
  );
}
