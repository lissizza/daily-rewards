# Daily Rewards - Project Specification

## Overview

Family application for tracking children's bonus points. Parents (owner/admin) can add or deduct points for various events (school, sports, purchases, etc.). Children can view their balance and history.

## Live Demo

- **Production**: https://dailyrewards.vercel.app
- **Repository**: https://github.com/lissizza/daily-rewards

## Target Platforms

1. **Web** (MVP) - Progressive Web App ✅
2. **Android** - React Native / Expo (future)
3. **iOS/iPadOS** - React Native / Expo (future)

## User System

### Roles

| Role | Capabilities |
|------|-------------|
| **Owner** | Full access: create family, invite co-parent (admin), create children, manage events/types, delete family members |
| **Admin** | Almost full access: create children, manage events/types. Cannot add other admins or delete owner |
| **Child** | View own balance and event history only (read-only). Cannot see siblings |

### Family Structure

- Each family has one **owner** (the person who registered)
- Owner can invite one **admin** (co-parent) to the same family
- Both owner and admin can create/manage **children**
- Children belong to a family and can only see their own data

### Authentication Flow

1. Owner registers (email + password) → creates new family automatically
2. Owner can add admin (co-parent) with email + password → joins same family
3. Owner/Admin creates child accounts (login + password)
4. Children log in with credentials created by parent
5. No self-registration for children or admins

## Data Model

### Family
- `id`: UUID
- `name`: string (optional, defaults to "Семья {owner_name}")
- `created_at`: timestamp

### Profile (User)
- `id`: UUID (from Supabase Auth)
- `email`: string (admin/owner only, nullable for children)
- `login`: string (for children, unique)
- `name`: string
- `avatar`: string (optional)
- `role`: 'owner' | 'admin' | 'child'
- `family_id`: UUID (FK → Family)
- `parent_id`: UUID (FK → Profile, deprecated, kept for compatibility)
- `created_at`: timestamp

### EventType
- `id`: UUID
- `family_id`: UUID (FK → Family)
- `name`: string
- `default_points`: number
- `is_deduction`: boolean
- `icon`: string (emoji)
- `sort_order`: number
- `created_at`: timestamp

### Event (Transaction)
- `id`: UUID
- `child_id`: UUID (FK → Profile)
- `event_type_id`: UUID | null (FK → EventType)
- `custom_name`: string | null (for custom events)
- `points`: number (positive for income, negative for expense)
- `note`: string
- `date`: date (YYYY-MM-DD)
- `created_by`: UUID (FK → Profile, admin who created)
- `created_at`: timestamp

## Default Event Types

### Rewards (positive points)
| Icon | Name | Default Points |
|------|------|---------------|
| 🏫 | Посещение школы | 10 |
| ⭐ | Хорошая оценка | 15 |
| 📝 | Запись ДЗ | 5 |
| 🚶 | Длинная прогулка | 10 |
| ⚽ | Занятие спортом | 15 |
| 🎁 | Бонус | 0 (manual input) |

### Deductions (negative points)
| Icon | Name | Default Points |
|------|------|---------------|
| ➖ | Вычет | 0 (manual input) |
| 🛒 | Покупка | 0 (manual input) |

## User Interface

### Navigation (Bottom Tabs)
- **Home** (🏠) - Daily events view
- **Calendar** (📅) - Month calendar
- **Activities** (📋) - Event types management (admin only)
- **Family** (👨‍👩‍👧‍👦) - Family management + settings (admin only)

### Main Screen Features
- Child selector (dropdown if multiple children)
- Balance display (⭐ points)
- Date navigation (< date > with calendar button)
- Events list for selected day
- Color-coded cards: green for income, pink for expenses
- Quick-add buttons: + Income / − Expense (admin only)
- Editable points and notes (admin only)

### Calendar Features
- Month view with navigation
- Click day to go to that day's events

### Family Page (Admin only)
- Language switcher (EN/RU)
- Children list with edit/delete
- Add child form (name, login, password)
- Co-parent management (owner only)
- Sign out button

### Activities Page (Admin only)
- Event types list grouped by income/expense
- Add/edit/delete event types

## Technical Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand (with persist middleware)
- **Date handling**: date-fns
- **Routing**: React Router v6
- **i18n**: Custom hooks with language store

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Auth**: Supabase Auth
- **Security**: Row Level Security (RLS)

### Infrastructure
- **Hosting**: Vercel (auto-deploy on push to main)
- **CI/CD**: GitHub Actions (migrations)
- **Repository**: GitHub

## Project Structure

```
daily_rewards/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-apply migrations
├── apps/
│   └── web/
│       ├── public/
│       │   ├── pwa-512x512.png
│       │   ├── pwa-192x192.png
│       │   ├── apple-touch-icon.png
│       │   └── favicon.ico
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/         # Reusable UI components
│       │   │   ├── Layout.tsx
│       │   │   └── ...
│       │   ├── features/
│       │   │   ├── auth/       # Login, signup
│       │   │   ├── home/       # Main events view
│       │   │   ├── calendar/   # Calendar page
│       │   │   ├── activities/ # Event types management
│       │   │   └── family/     # Family & settings
│       │   ├── i18n/
│       │   │   ├── translations.ts
│       │   │   └── useTranslation.ts
│       │   ├── lib/
│       │   │   ├── supabase.ts
│       │   │   ├── utils.ts
│       │   │   └── validation.ts
│       │   ├── stores/
│       │   │   ├── auth.ts
│       │   │   ├── app.ts
│       │   │   └── language.ts
│       │   ├── types/
│       │   │   └── database.ts
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       └── vite.config.ts
├── supabase/
│   └── migrations/
│       ├── 00001_initial_schema.sql
│       ├── 00002_seed_default_event_types.sql
│       ├── 00003_fix_event_type_seeding.sql
│       ├── 00004_family_structure.sql
│       ├── 00005_security_fixes.sql
│       └── 00006_restrict_child_profile_view.sql
├── spec.md                     # This file
├── tasks.md                    # Task tracking
├── CLAUDE.md                   # Instructions for Claude
└── README.md                   # Project documentation
```

## Security

### Row Level Security Policies

#### profiles
- Users can view own profile
- Owner/Admin can view all family members
- Children can NOT view siblings (only own profile)
- Owner/Admin can update own profile and children
- Owner can add admin to family

#### event_types
- Owner/Admin can CRUD family event types
- Children can read event types (for display)

#### events
- Owner/Admin can CRUD events for family children
- Children can only read own events

### Route Protection (Frontend)
- `/activities` and `/family` routes protected by `AdminRoute` component
- Children redirected to home if they try to access admin routes

### Password Policy
- Minimum 8 characters
- Must contain at least one letter and one number

### SQL Functions with Authorization
- `get_child_balance(child_id)` - verifies family membership
- `get_email_by_login(login)` - verifies family membership

## Localization

Supported languages:
- **Russian** (ru) - default
- **English** (en)

Language preference persisted in localStorage.

## Success Metrics

- Load time < 2 sec ✅
- PWA installable ✅
- Works offline (cached assets)
- Responsive design (mobile-first)
