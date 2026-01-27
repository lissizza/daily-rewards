import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditablePointsProps {
  value: number;
  isDeduction?: boolean;
  onSave: (newValue: number) => Promise<void>;
  className?: string;
}

export function EditablePoints({
  value,
  isDeduction = false,
  onSave,
  className,
}: EditablePointsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(Math.abs(value)));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = Math.abs(value);
  const prefix = isDeduction ? '-' : '+';
  const colorClass = isDeduction ? 'text-destructive' : 'text-green-600';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = useCallback(() => {
    if (isSaving) return;
    setEditValue(String(displayValue));
    setIsEditing(true);
    setError(false);
  }, [isSaving, displayValue]);

  const handleSave = useCallback(async () => {
    const numValue = parseInt(editValue, 10);

    if (isNaN(numValue) || numValue < 0) {
      setError(true);
      inputRef.current?.focus();
      return;
    }

    // Apply sign based on whether it's a deduction
    const finalValue = isDeduction ? -Math.abs(numValue) : Math.abs(numValue);

    // No change, just close
    if (finalValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(false);

    try {
      await onSave(finalValue);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save points:', err);
      setError(true);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, isDeduction, value, onSave]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(String(displayValue));
    setError(false);
  }, [displayValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits
    const val = e.target.value.replace(/[^0-9]/g, '');
    setEditValue(val);
    setError(false);
  }, []);

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <span className={colorClass}>{prefix}</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={editValue}
          onChange={handleChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className={cn(
            'w-16 min-h-[44px] rounded-md border bg-background px-2 py-1 text-center font-semibold',
            colorClass,
            error && 'border-destructive',
            isSaving && 'opacity-50'
          )}
          aria-label="Edit points value"
        />
        {isSaving && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'min-h-[44px] min-w-[44px] rounded-md px-2 py-1 font-semibold transition-colors hover:bg-accent',
        colorClass,
        className
      )}
      aria-label={`Edit points: ${prefix}${displayValue}. Click to edit.`}
    >
      {prefix}
      {displayValue}
    </button>
  );
}
