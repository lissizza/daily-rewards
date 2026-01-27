/**
 * Default event types for new admins.
 * Uses camelCase interface that gets mapped to snake_case for database.
 */
export interface DefaultEventType {
  name: string;
  defaultPoints: number;
  isDeduction: boolean;
  icon: string;
  order: number;
}

export const DEFAULT_REWARD_TYPES: DefaultEventType[] = [
  {
    name: 'Посещение школы',
    defaultPoints: 10,
    isDeduction: false,
    icon: '🏫',
    order: 1,
  },
  {
    name: 'Хорошая оценка',
    defaultPoints: 15,
    isDeduction: false,
    icon: '⭐',
    order: 2,
  },
  {
    name: 'Запись ДЗ',
    defaultPoints: 5,
    isDeduction: false,
    icon: '📝',
    order: 3,
  },
  {
    name: 'Длинная прогулка',
    defaultPoints: 10,
    isDeduction: false,
    icon: '🚶',
    order: 4,
  },
  {
    name: 'Занятие спортом',
    defaultPoints: 15,
    isDeduction: false,
    icon: '⚽',
    order: 5,
  },
  {
    name: 'Бонус',
    defaultPoints: 0,
    isDeduction: false,
    icon: '🎁',
    order: 6,
  },
];

export const DEFAULT_DEDUCTION_TYPES: DefaultEventType[] = [
  {
    name: 'Вычет',
    defaultPoints: 0,
    isDeduction: true,
    icon: '➖',
    order: 100,
  },
  {
    name: 'Покупка',
    defaultPoints: 0,
    isDeduction: true,
    icon: '🛒',
    order: 101,
  },
];

export function getDefaultEventTypes(): DefaultEventType[] {
  return [...DEFAULT_REWARD_TYPES, ...DEFAULT_DEDUCTION_TYPES];
}
