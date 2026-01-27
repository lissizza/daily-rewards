import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { ErrorToast, extractErrorMessage } from '@/components/ErrorToast';
import type { EventType } from '@/types/database';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
  date: string;
  eventTypes: EventType[];
  onEventAdded: () => void;
}

export function AddEventModal({
  isOpen,
  onClose,
  childId,
  date,
  eventTypes,
  onEventAdded,
}: AddEventModalProps) {
  const { profile } = useAuthStore();
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const rewards = eventTypes.filter((t) => !t.is_deduction);
  const deductions = eventTypes.filter((t) => t.is_deduction);

  const selectedType = eventTypes.find((t) => t.id === selectedTypeId);

  useEffect(() => {
    if (selectedType) {
      const absolutePoints = Math.abs(selectedType.default_points);
      setPoints(selectedType.is_deduction ? -absolutePoints : absolutePoints);
    }
  }, [selectedTypeId, selectedType]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTypeId(null);
      setPoints(0);
      setNote('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !profile) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('events').insert({
        child_id: childId,
        event_type_id: selectedTypeId,
        points,
        note,
        date,
        created_by: profile.id,
      });

      if (error) throw error;

      onEventAdded();
      onClose();
    } catch (err) {
      console.error('Error adding event:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ErrorToast message={error} onClose={clearError} />
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-background p-4">
          <h2 className="text-lg font-semibold">Добавить событие</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Rewards section */}
          {rewards.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Награды
              </h3>
              <div className="space-y-2">
                {rewards.map((type) => (
                  <label
                    key={type.id}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors',
                      selectedTypeId === type.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="eventType"
                        value={type.id}
                        checked={selectedTypeId === type.id}
                        onChange={() => setSelectedTypeId(type.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span>{type.icon}</span>
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <span className="text-green-600">
                      +{Math.abs(type.default_points)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Deductions section */}
          {deductions.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Штрафы
              </h3>
              <div className="space-y-2">
                {deductions.map((type) => (
                  <label
                    key={type.id}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors',
                      selectedTypeId === type.id
                        ? 'border-destructive bg-destructive/5'
                        : 'hover:bg-accent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="eventType"
                        value={type.id}
                        checked={selectedTypeId === type.id}
                        onChange={() => setSelectedTypeId(type.id)}
                        className="h-4 w-4 accent-destructive"
                      />
                      <span>{type.icon}</span>
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <span className="text-destructive">
                      -{Math.abs(type.default_points)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Points input */}
          {selectedTypeId && (
            <div className="mb-4">
              <label className="block text-sm font-medium">Баллы</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
          )}

          {/* Note textarea */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Заметка</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Необязательно"
              rows={2}
              className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-3 font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!selectedTypeId || loading}
              className="flex-1 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
