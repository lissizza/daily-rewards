import { v4 as uuidv4 } from 'uuid';
import type { EventType } from '../models/event-type';

/**
 * Default event types for rewards (positive points)
 */
export const DEFAULT_REWARD_TYPES: Omit<EventType, 'id'>[] = [
  {
    name: 'Посещение школы',
    defaultPoints: 10,
    isDeduction: false,
    isSystem: true,
    icon: '🏫',
    order: 1,
  },
  {
    name: 'Хорошая оценка',
    defaultPoints: 15,
    isDeduction: false,
    isSystem: true,
    icon: '⭐',
    order: 2,
  },
  {
    name: 'Запись ДЗ',
    defaultPoints: 5,
    isDeduction: false,
    isSystem: true,
    icon: '📝',
    order: 3,
  },
  {
    name: 'Длинная прогулка',
    defaultPoints: 10,
    isDeduction: false,
    isSystem: true,
    icon: '🚶',
    order: 4,
  },
  {
    name: 'Занятие спортом',
    defaultPoints: 15,
    isDeduction: false,
    isSystem: true,
    icon: '⚽',
    order: 5,
  },
  {
    name: 'Бонус',
    defaultPoints: 0,
    isDeduction: false,
    isSystem: true,
    icon: '🎁',
    order: 6,
  },
];

/**
 * Default event types for deductions (negative points)
 */
export const DEFAULT_DEDUCTION_TYPES: Omit<EventType, 'id'>[] = [
  {
    name: 'Вычет',
    defaultPoints: 0,
    isDeduction: true,
    isSystem: true,
    icon: '➖',
    order: 100,
  },
  {
    name: 'Покупка',
    defaultPoints: 0,
    isDeduction: true,
    isSystem: true,
    icon: '🛒',
    order: 101,
  },
];

/**
 * Get all default event types with generated UUIDs
 */
export function getDefaultEventTypes(): EventType[] {
  return [...DEFAULT_REWARD_TYPES, ...DEFAULT_DEDUCTION_TYPES].map((type) => ({
    ...type,
    id: uuidv4(),
  }));
}
