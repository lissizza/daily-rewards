# Daily Rewards

A family points tracker app for kids. Parents can award points for good behavior and deduct points for misbehavior. Kids can see their balance and history.

## Features

- **Multi-child support** - Track points for multiple children
- **Custom activities** - Create your own reward and deduction types with icons
- **Quick add** - Fast event logging with searchable dropdown
- **Calendar view** - Browse events by date
- **Family management** - Add parents, grandparents, or other adults as admins
- **Role-based access** - Owners, admins, and children see different views
- **PWA** - Installable on mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Deployment**: Vercel

## Project Structure

```
apps/
  web/           # React frontend
packages/
  core/          # Shared types and constants
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Supabase account

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your Supabase credentials

# Start development server
pnpm dev
```

### Environment Variables

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema

### Tables

- `families` - Family groups
- `profiles` - Users (owners, admins, children)
- `event_types` - Activity definitions (rewards/deductions)
- `events` - Point transactions

### Key Functions

- `get_child_balance(child_id)` - Calculate child's total points
- `get_email_by_login(login)` - Lookup email for child login

## Deployment

The app auto-deploys to Vercel on push to main.

Production URL: https://dailyrewards.vercel.app

## License

MIT
