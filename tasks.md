# Daily Rewards - Task Plan

## Architecture Decisions

### Tech Stack Rationale

| Technology | Reason |
|------------|--------|
| **React + TypeScript** | Single codebase for web and mobile (via React Native) |
| **Vite** | Fast builds, excellent TypeScript and PWA support |
| **Zustand** | Simple state management, works in React and React Native |
| **Supabase** | PostgreSQL + Auth + Realtime, generous free tier |
| **Tailwind + shadcn/ui** | Rapid UI development, good customization |
| **date-fns** | Lightweight date library |
| **Monorepo (pnpm workspaces)** | Code reuse between web and mobile |

### Architecture Patterns

1. **Feature-based structure** - code organized by features, not file types
2. **Role-based access** - admin (full access) vs child (read-only)
3. **Realtime sync** - Supabase Realtime for instant updates across devices

---

## Phase 1: MVP Web

### Milestone 1: Infrastructure
- [x] Monorepo setup (pnpm workspaces)
- [x] Web app creation (Vite + React + TypeScript)
- [x] Tailwind CSS setup
- [ ] shadcn/ui components installation
- [ ] ESLint + Prettier setup

### Milestone 2: Backend (Supabase)
- [x] Database schema design
- [x] SQL migrations with RLS policies
- [x] TypeScript types for database
- [ ] Create Supabase project
- [ ] Apply migrations
- [ ] Seed default event types function

### Milestone 3: Core Package
- [x] Profile model (admin/child roles)
- [x] EventType model
- [x] Event model
- [x] Default event types
- [x] i18n (ru/en)

### Milestone 4: Authentication
- [x] Supabase client setup
- [x] Auth store (Zustand)
- [x] Login page (email for admin, login for child)
- [x] Protected routes
- [ ] Password reset flow

### Milestone 5: Main Screen
- [x] Layout with bottom navigation
- [x] Header (child selector + balance)
- [x] Date navigation component
- [x] Events list for selected day
- [x] Event card component
- [x] FAB "+" button (admin only)
- [ ] Add event modal/bottom sheet
- [ ] Swipe navigation between days

### Milestone 6: Calendar
- [x] Month view (grid)
- [ ] Week view (rows)
- [ ] Event indicators on days
- [x] Month navigation
- [x] Day selection → navigate to home

### Milestone 7: Settings (Admin)
- [x] Settings page layout
- [x] Children list
- [x] Add child form
- [ ] Edit child
- [ ] Delete child (with confirmation)
- [ ] Event types management
- [ ] Theme toggle (light/dark)

### Milestone 8: PWA
- [x] PWA manifest config
- [ ] App icons (192x192, 512x512)
- [ ] Apple touch icon
- [ ] Service worker for offline
- [ ] Install prompt

---

## Phase 2: Polish & Features

### Milestone 9: Event Management
- [ ] Add event modal with type selector
- [ ] Custom event (manual name + points)
- [ ] Edit event
- [ ] Delete event
- [ ] Event type quick-add buttons

### Milestone 10: UX Improvements
- [ ] Swipe gestures for day navigation
- [ ] Pull-to-refresh
- [ ] Loading skeletons
- [ ] Toast notifications
- [ ] Empty states

### Milestone 11: Statistics
- [ ] Weekly/monthly summary
- [ ] Balance history chart
- [ ] Top activities

---

## Phase 3: Mobile

### Milestone 12: React Native
- [ ] Expo project setup
- [ ] Reuse core package
- [ ] Adapt UI for mobile
- [ ] Android APK build
- [ ] Google Play publication

---

## Current Sprint

### Completed
- [x] Git repository initialized
- [x] spec.md created
- [x] tasks.md created
- [x] Monorepo configured (pnpm workspaces)
- [x] Web app structure created
- [x] Supabase schema and migrations
- [x] Core models (Profile, EventType, Event)
- [x] Auth store and login page
- [x] Main screen (HomePage)
- [x] Calendar page (month view)
- [x] Settings page (children management)

### Next Up
- [ ] Create Supabase project and apply migrations
- [ ] Add event modal implementation
- [ ] Seed default event types on admin signup
- [ ] shadcn/ui button, input, dialog components

---

## Commands

```bash
# Install dependencies
pnpm install

# Run web app
pnpm dev

# Build
pnpm build

# Lint
pnpm lint
```

---

## Documentation Links

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [Supabase](https://supabase.com/docs)
- [date-fns](https://date-fns.org)
- [React Native](https://reactnative.dev)
- [Expo](https://expo.dev)
