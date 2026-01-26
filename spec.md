# Daily Rewards - Project Specification

## Overview

Application for tracking children's bonus points. Parents can add or deduct points for various events (school, sports, purchases, etc.).

## Target Platforms

1. **Web** (MVP) - Progressive Web App
2. **Android** - React Native / Expo
3. **iOS/iPadOS** - React Native / Expo (future)

## User System

### Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Create children, assign login/password, add/edit events, manage event types, full access |
| **Child** | View own balance and event history only (read-only) |

### Authentication Flow

1. Admin registers (email + password) - single admin per "family"
2. Admin creates child accounts (login + password)
3. Children log in with credentials created by admin
4. No self-registration for children

## Data Model

### User / Profile
- `id`: UUID (from Supabase Auth)
- `email`: string (admin only, nullable for children)
- `login`: string (for children, unique)
- `name`: string
- `avatar`: string (optional)
- `role`: 'admin' | 'child'
- `parent_id`: UUID (FK → Profile, null for admin)
- `created_at`: timestamp

### EventType
- `id`: UUID
- `admin_id`: UUID (FK → Profile, owner)
- `name`: string
- `default_points`: number
- `is_deduction`: boolean
- `icon`: string (optional)
- `sort_order`: number
- `created_at`: timestamp

### Event (Transaction)
- `id`: UUID
- `child_id`: UUID (FK → Profile)
- `event_type_id`: UUID | null (FK → EventType)
- `custom_name`: string | null (for custom events)
- `points`: number
- `note`: string
- `date`: date (YYYY-MM-DD)
- `created_by`: UUID (FK → Profile, admin who created)
- `created_at`: timestamp

## Default Event Types

### Rewards (positive points)
| Name | Default Points |
|------|---------------|
| Посещение школы | 10 |
| Хорошая оценка | 15 |
| Запись ДЗ | 5 |
| Длинная прогулка | 10 |
| Занятие спортом | 15 |
| Бонус | 0 (manual input) |

### Deductions (negative points)
| Name | Default Points |
|------|---------------|
| Вычет | 0 (manual input) |
| Покупка | 0 (manual input) |

## User Interface

### Login Screen

```
┌─────────────────────────────────────┐
│                                     │
│         Daily Rewards               │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Login / Email                 │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Password                      │  │
│  └───────────────────────────────┘  │
│                                     │
│         [  Sign In  ]               │
│                                     │
└─────────────────────────────────────┘
```

### Main Screen - Admin View

```
┌─────────────────────────────────────┐
│ [▼ Child Name]          ⭐ 150 pts  │
├─────────────────────────────────────┤
│      < January 26, 2026 >    [📅]   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ School Attendance    +10        │ │
│ │ Note: —                         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Good Grade           +15        │ │
│ │ Note: Math, A                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│              [ + ]                  │
├─────────────────────────────────────┤
│  [Home]  [Calendar]  [Settings]     │
└─────────────────────────────────────┘
```

### Main Screen - Child View (Read-Only)

```
┌─────────────────────────────────────┐
│ Alex                    ⭐ 150 pts  │
├─────────────────────────────────────┤
│      < January 26, 2026 >    [📅]   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ School Attendance    +10        │ │
│ │ Note: —                         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Good Grade           +15        │ │
│ │ Note: Math, A                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│  (No add button for children)       │
├─────────────────────────────────────┤
│       [Home]  [Calendar]            │
└─────────────────────────────────────┘
```

### Date Navigation
- Swipe left/right - switch days
- Calendar button - open calendar view

### Calendar View

**Month (grid):**
```
┌─────────────────────────────────────┐
│     <   January 2026   >            │
├─────────────────────────────────────┤
│ Mon Tue Wed Thu Fri Sat Sun         │
│                 1   2   3   4       │
│                    +25              │
│  5   6   7   8   9  10  11          │
│     -10 +15                         │
│ ...                                 │
└─────────────────────────────────────┘
```

**Week (rows):**
```
┌─────────────────────────────────────┐
│     <   Week 4   >                  │
├─────────────────────────────────────┤
│ Mon 20 │ 🏫 📚      │ +25           │
│ Tue 21 │ 🏫 ⚽      │ +35           │
│ Wed 22 │ 🏫 🛒      │ -15           │
│ ...                                 │
└─────────────────────────────────────┘
```

### Add Event (Admin only)

```
┌─────────────────────────────────────┐
│           Add Event                 │
├─────────────────────────────────────┤
│ Type: [▼ Select event          ]    │
│                                     │
│ ── Rewards ──                       │
│ ○ School Attendance (+10)           │
│ ○ Good Grade (+15)                  │
│ ○ Homework Logged (+5)              │
│ ○ Bonus (enter points)              │
│ ── Deductions ──                    │
│ ○ Deduction (enter points)          │
│ ○ Purchase (enter points)           │
│ ── Custom ──                        │
│ ○ Custom event                      │
│                                     │
│ Points: [_____15_____]              │
│                                     │
│ Note: [__________________]          │
│                                     │
│       [Cancel]    [Add]             │
└─────────────────────────────────────┘
```

### Settings (Admin only)

```
┌─────────────────────────────────────┐
│           Settings                  │
├─────────────────────────────────────┤
│ CHILDREN                            │
│ ┌─────────────────────────────────┐ │
│ │ Alex          login: alex123    │ │
│ │                      [Edit] [×] │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Emma          login: emma456    │ │
│ │                      [Edit] [×] │ │
│ └─────────────────────────────────┘ │
│         [ + Add Child ]             │
│                                     │
│ EVENT TYPES                         │
│ ┌─────────────────────────────────┐ │
│ │ 🏫 School Attendance  +10       │ │
│ │ ⭐ Good Grade         +15       │ │
│ │ ...                    [Edit]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ THEME                               │
│ [Light] [Dark] [System]             │
│                                     │
│ [Sign Out]                          │
└─────────────────────────────────────┘
```

## Technical Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Date handling**: date-fns
- **Routing**: React Router

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Auth**: Supabase Auth
- **Realtime**: Supabase Realtime (for live updates)

### Mobile (Phase 2)
- **Framework**: React Native + Expo
- **Styling**: NativeWind

## Project Structure

```
daily_rewards/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/           # shadcn components
│       │   │   └── ...
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── events/
│       │   │   ├── calendar/
│       │   │   └── settings/
│       │   ├── hooks/
│       │   ├── lib/
│       │   │   ├── supabase.ts
│       │   │   └── utils.ts
│       │   ├── stores/
│       │   └── types/
│       └── ...
├── packages/
│   └── core/
│       ├── src/
│       │   ├── models/
│       │   ├── i18n/
│       │   └── utils/
│       └── ...
└── supabase/
    ├── migrations/
    └── seed.sql
```

## Supabase Schema

```sql
-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  email text,
  login text unique,
  name text not null,
  avatar_url text,
  role text not null check (role in ('admin', 'child')),
  parent_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Event Types
create table event_types (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id) not null,
  name text not null,
  default_points integer not null default 0,
  is_deduction boolean not null default false,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- Events (transactions)
create table events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references profiles(id) not null,
  event_type_id uuid references event_types(id),
  custom_name text,
  points integer not null,
  note text default '',
  date date not null,
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table event_types enable row level security;
alter table events enable row level security;

-- Policies: Admin sees all their children, children see only themselves
-- (detailed policies in migrations)
```

## Security (Row Level Security)

### profiles
- Admin can read/update own profile and children's profiles
- Child can only read own profile

### event_types
- Admin can CRUD own event types
- Children can read event types (for display)

### events
- Admin can CRUD events for their children
- Child can only read own events

## Functional Requirements

### MVP
1. Admin authentication (email/password)
2. Child authentication (login/password)
3. Admin: CRUD children with login/password
4. Admin: CRUD event types
5. Admin: CRUD events
6. Child: View balance and events (read-only)
7. Calendar view (month/week)
8. Date navigation (swipe)
9. Balance calculation
10. PWA support

### Phase 2
1. React Native mobile app
2. Push notifications
3. Statistics and charts
4. Data export

## Success Metrics

- Load time < 2 sec
- Realtime sync between devices
- PWA installable
- Smooth animations (60 fps)
