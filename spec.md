# Daily Rewards - Спецификация проекта

## Обзор

Приложение для учёта бонусных баллов детей. Родители могут начислять или списывать баллы за различные события (учёба, спорт, покупки и т.д.).

## Целевые платформы

1. **Web** (MVP) - Progressive Web App
2. **Android** - через React Native / Expo
3. **iOS/iPadOS** - через React Native / Expo (будущее)

## Основные сущности

### Child (Ребёнок)
- `id`: UUID
- `name`: string
- `avatar`: string (optional)
- `balance`: number (вычисляемое поле)
- `createdAt`: timestamp

### EventType (Тип события)
- `id`: UUID
- `name`: string (название)
- `defaultPoints`: number (может быть 0, положительным или отрицательным)
- `isDeduction`: boolean (вычет или начисление)
- `isSystem`: boolean (системное/пользовательское)
- `icon`: string (optional)
- `order`: number (порядок сортировки)

### Event (Событие/Транзакция)
- `id`: UUID
- `childId`: UUID (FK → Child)
- `eventTypeId`: UUID | null (FK → EventType, null для кастомных)
- `customName`: string | null (для кастомных событий)
- `points`: number (фактические баллы)
- `note`: string (примечание)
- `date`: date (дата события)
- `createdAt`: timestamp

## Дефолтные типы событий

### Начисления (положительные баллы)
| Название | Баллы по умолчанию |
|----------|-------------------|
| Посещение школы | 10 |
| Хорошая оценка | 15 |
| Запись ДЗ | 5 |
| Длинная прогулка | 10 |
| Занятие спортом | 15 |
| Бонус | 0 (вводится вручную) |

### Списания (отрицательные баллы)
| Название | Баллы по умолчанию |
|----------|-------------------|
| Вычет | 0 (вводится вручную) |
| Покупка | 0 (вводится вручную) |

## Пользовательский интерфейс

### Главный экран (День)

```
┌─────────────────────────────────────┐
│ [▼ Имя ребёнка]        ⭐ 150 баллов│
├─────────────────────────────────────┤
│      < 26 января 2026 >    [📅]     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Посещение школы    +10         │ │
│ │ Примечание: —                  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Хорошая оценка     +15         │ │
│ │ Примечание: Математика, 5      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Покупка            -50         │ │
│ │ Примечание: Новая игрушка      │ │
│ └─────────────────────────────────┘ │
│                                     │
│              [ + ]                  │
└─────────────────────────────────────┘
```

### Навигация по датам
- Свайп влево/вправо - переключение дней
- Кнопка календаря - открытие календарного вида

### Календарный вид

**Месяц (сетка):**
```
┌─────────────────────────────────────┐
│     <   Январь 2026   >             │
├─────────────────────────────────────┤
│ Пн  Вт  Ср  Чт  Пт  Сб  Вс         │
│                 1   2   3   4       │
│                    +25              │
│  5   6   7   8   9  10  11         │
│     -10 +15                         │
│ ...                                 │
└─────────────────────────────────────┘
```

**Неделя (строки):**
```
┌─────────────────────────────────────┐
│     <   Неделя 4   >                │
├─────────────────────────────────────┤
│ Пн 20  │ 🏫 📚      │ +25          │
│ Вт 21  │ 🏫 ⚽      │ +35          │
│ Ср 22  │ 🏫 🛒      │ -15          │
│ ...                                 │
└─────────────────────────────────────┘
```

### Добавление события (модальное окно / bottom sheet)

```
┌─────────────────────────────────────┐
│        Добавить событие             │
├─────────────────────────────────────┤
│ Тип: [▼ Выберите событие       ]    │
│                                     │
│ ── Начисления ──                    │
│ ○ Посещение школы (+10)             │
│ ○ Хорошая оценка (+15)              │
│ ○ Запись ДЗ (+5)                    │
│ ○ Бонус (ввести баллы)              │
│ ── Списания ──                      │
│ ○ Вычет (ввести баллы)              │
│ ○ Покупка (ввести баллы)            │
│ ── Своё ──                          │
│ ○ Кастомное событие                 │
│                                     │
│ Баллы: [_____15_____]               │
│                                     │
│ Примечание: [__________________]    │
│                                     │
│       [Отмена]    [Добавить]        │
└─────────────────────────────────────┘
```

### Настройки

- Управление детьми (добавить/редактировать/удалить)
- Управление типами событий
- Экспорт данных
- Тема (светлая/тёмная)

## Функциональные требования

### MVP (Web)
1. CRUD для детей
2. CRUD для типов событий
3. CRUD для событий (транзакций)
4. Просмотр дня со списком событий
5. Навигация по датам (свайп + календарь)
6. Календарный вид (месяц/неделя)
7. Подсчёт баланса
8. Локальное хранение данных (IndexedDB)

### Фаза 2
1. Синхронизация через облако (Supabase/Firebase)
2. Мобильное приложение (React Native)
3. Push-уведомления
4. Статистика и графики

### Фаза 3
1. Несколько пользователей (родителей)
2. Цели и достижения
3. Награды за баллы
4. iOS приложение

## Нефункциональные требования

- Offline-first архитектура
- Респонсивный дизайн (mobile-first)
- Поддержка PWA (установка на домашний экран)
- Поддержка тёмной темы
- Локализация: русский (основной), английский

## Технический стек

### Frontend (Web + Mobile)
- **Framework**: React 18+ с TypeScript
- **Mobile**: React Native + Expo (для Android/iOS)
- **State Management**: Zustand (простой, работает везде)
- **Styling**: Tailwind CSS (web) + NativeWind (mobile)
- **UI Components**: shadcn/ui (web) / React Native Paper (mobile)
- **Forms**: React Hook Form + Zod
- **Date handling**: date-fns
- **Gestures**: react-swipeable (web) / react-native-gesture-handler (mobile)

### Data Layer
- **Local Storage**: IndexedDB через Dexie.js
- **Backend (Фаза 2)**: Supabase (PostgreSQL + Auth + Realtime)
- **Sync**: Custom sync logic или Supabase Realtime

### Build & Deploy
- **Build**: Vite
- **Deploy (Web)**: Vercel / Netlify
- **Deploy (Mobile)**: Expo EAS

## Структура проекта

```
daily_rewards/
├── apps/
│   ├── web/                 # React web app (Vite)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── stores/
│   │   │   └── types/
│   │   └── ...
│   └── mobile/              # React Native app (Expo)
│       └── ...
├── packages/
│   ├── core/                # Shared business logic
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   └── ui/                  # Shared UI primitives (future)
├── spec.md
├── tasks.md
└── package.json
```

## API / Data Schema

### IndexedDB Schema (Dexie.js)

```typescript
// stores/db.ts
import Dexie, { Table } from 'dexie';

interface Child {
  id: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

interface EventType {
  id: string;
  name: string;
  defaultPoints: number;
  isDeduction: boolean;
  isSystem: boolean;
  icon?: string;
  order: number;
}

interface Event {
  id: string;
  childId: string;
  eventTypeId?: string;
  customName?: string;
  points: number;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: Date;
}

class DailyRewardsDB extends Dexie {
  children!: Table<Child>;
  eventTypes!: Table<EventType>;
  events!: Table<Event>;

  constructor() {
    super('DailyRewardsDB');
    this.version(1).stores({
      children: 'id, name',
      eventTypes: 'id, isSystem, order',
      events: 'id, childId, date, [childId+date]'
    });
  }
}
```

## Метрики успеха

- Время загрузки < 2 сек
- Работа offline
- Установка как PWA
- Плавные анимации (60 fps)
