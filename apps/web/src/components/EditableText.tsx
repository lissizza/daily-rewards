import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function EditableText({
  value,
  onSave,
  placeholder = 'Добавить...',
  className,
  inputClassName,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync with external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleClick = useCallback(() => {
    if (isSaving) return;
    setEditValue(value);
    setIsEditing(true);
    setError(false);
  }, [isSaving, value]);

  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim();

    // No change, just close
    if (trimmedValue === value) {
      setIsEditing(false);
      return;
    }

    // Don't allow empty for required values
    if (!trimmedValue && value) {
      setError(true);
      inputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    setError(false);

    try {
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save:', err);
      setError(true);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(value);
    setError(false);
  }, [value]);

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

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            setError(false);
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          placeholder={placeholder}
          className={cn(
            'min-h-[36px] w-full rounded-md border bg-background px-2 py-1',
            error && 'border-destructive',
            isSaving && 'opacity-50',
            inputClassName
          )}
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
        'min-h-[36px] rounded-md px-2 py-1 text-left transition-colors hover:bg-accent',
        !value && 'text-muted-foreground italic',
        className
      )}
    >
      {value || placeholder}
    </button>
  );
}
