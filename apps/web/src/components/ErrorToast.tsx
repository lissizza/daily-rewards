import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ErrorToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  'User already registered': 'Пользователь с таким логином уже существует',
  'Invalid login credentials': 'Неверный логин или пароль',
  'Email rate limit exceeded': 'Слишком много попыток. Попробуйте позже',
};

function getLocalizedMessage(message: string): string {
  // Check for exact match first
  if (ERROR_MESSAGES[message]) {
    return ERROR_MESSAGES[message];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return message;
}

export function ErrorToast({ message, onClose, duration = 5000 }: ErrorToastProps) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const localizedMessage = getLocalizedMessage(message);

  return (
    <div className="fixed inset-x-0 top-0 z-50 p-4">
      <div className="mx-auto max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Ошибка</p>
            <p className="mt-1 text-sm text-foreground">{localizedMessage}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Произошла неизвестная ошибка';
}
