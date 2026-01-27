# Daily Rewards - Tasks & Progress

> **Important**: Update this file after completing each task!

## Current Status: MVP Complete ✅

The web application is deployed and functional at https://dailyrewards.vercel.app

---

## ✅ Completed

### Infrastructure
- [x] Monorepo setup (pnpm workspaces)
- [x] Web app (Vite + React + TypeScript)
- [x] Tailwind CSS
- [x] GitHub repository (lissizza/daily-rewards)
- [x] Vercel deployment (auto-deploy on push)
- [x] GitHub Actions for migrations
- [x] PWA manifest and icons

### Backend (Supabase)
- [x] Database schema design
- [x] SQL migrations with RLS policies
- [x] TypeScript types for database
- [x] Supabase project connected
- [x] Default event types seeding
- [x] Family structure (owner/admin/child roles)
- [x] Security fixes (authorization in SQL functions)
- [x] Child profile isolation (can't see siblings)

### Authentication
- [x] Supabase Auth client setup
- [x] Auth store (Zustand with persistence)
- [x] Login page (email for admin, login for child)
- [x] Signup page (owner registration)
- [x] Protected routes (ProtectedRoute component)
- [x] Admin-only routes (AdminRoute component)
- [x] Password validation (8+ chars, letter + number)

### Main Screen (HomePage)
- [x] Layout with bottom navigation
- [x] Header (child selector + balance)
- [x] Date navigation (prev/next day)
- [x] Events list for selected day
- [x] Event cards with color coding (green/pink)
- [x] Quick-add buttons (Income/Expense dropdowns)
- [x] Editable points (click to edit)
- [x] Editable notes
- [x] Delete event button
- [x] Child view (read-only mode)

### Calendar
- [x] Month view (grid)
- [x] Month navigation
- [x] Day selection → navigate to home
- [x] Event indicators on days

### Activities Page (Admin)
- [x] Event types list
- [x] Add event type form
- [x] Edit event type
- [x] Delete event type
- [x] Income/Expense grouping
- [x] Icon picker (emoji)

### Family Page (Admin)
- [x] Children list with edit/delete
- [x] Add child form (name, login, password)
- [x] Edit child (name, login)
- [x] Delete child with confirmation
- [x] Co-parent management (owner only)
- [x] Sign out button
- [x] Language switcher (EN/RU)

### Localization
- [x] Translation system (useTranslation hook)
- [x] Language store with persistence
- [x] Russian translations
- [x] English translations
- [x] Applied to: Layout, HomePage, FamilyPage

### PWA
- [x] Manifest configuration
- [x] App icons (192x192, 512x512)
- [x] Apple touch icon
- [x] Favicon
- [x] Service worker (workbox)

---

## 🔄 In Progress

Nothing currently in progress.

---

## 📋 Backlog

### High Priority
- [ ] Apply translations to ActivitiesPage
- [ ] Apply translations to CalendarPage
- [ ] Week view in calendar
- [ ] Swipe gestures for day navigation
- [ ] Password reset flow

### Medium Priority
- [ ] Loading skeletons
- [ ] Pull-to-refresh
- [ ] Toast notifications (success/error)
- [ ] Empty states illustrations
- [ ] Theme toggle (light/dark/system)
- [ ] Edit child password

### Low Priority
- [ ] Statistics page (weekly/monthly summary)
- [ ] Balance history chart
- [ ] Data export (CSV/PDF)
- [ ] Custom event types icons
- [ ] Drag-and-drop reorder event types

### Phase 2: Mobile
- [ ] React Native + Expo project setup
- [ ] Reuse shared logic
- [ ] Adapt UI for native
- [ ] Android APK build
- [ ] Google Play publication

---

## 🐛 Known Issues

1. ~~Child login shows blank page~~ ✅ Fixed
2. ~~Children can see siblings via RLS~~ ✅ Fixed
3. ~~Routes /activities and /family accessible to children~~ ✅ Fixed

---

## 📝 Notes

### Database Migrations
Migrations are in `supabase/migrations/`. To apply:
```bash
supabase db push
```

### Development
```bash
pnpm install    # Install dependencies
pnpm dev        # Run dev server
pnpm build      # Production build
```

### Deployment
- Push to `main` branch triggers:
  1. GitHub Actions → applies migrations
  2. Vercel → builds and deploys

---

## 📚 Reference

- [spec.md](./spec.md) - Full specification
- [README.md](./README.md) - Project overview
- [CLAUDE.md](./CLAUDE.md) - Instructions for Claude
