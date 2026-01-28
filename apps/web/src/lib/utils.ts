import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, language: 'ru' | 'en' = 'ru'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function formatPoints(points: number): string {
  return points >= 0 ? `+${points}` : `${points}`;
}
