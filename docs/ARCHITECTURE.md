# Y2 Architecture

## Overview

Y2 is a Progressive Web App serving exactly 2 authenticated users. It is a personal life management ecosystem — not a social platform, not a productivity tool, not a generic app.

## System Architecture

```
┌──────────────────────────────────────┐
│          Client (PWA)                │
│  Next.js 15 + shadcn/ui + Framer    │
│  Installed on 2 iPhones via          │
│  Add to Home Screen                  │
├──────────────────────────────────────┤
│          Supabase                     │
│  ┌─────────┐ ┌──────────┐           │
│  │ Postgres │ │ Auth     │           │
│  │ + RLS    │ │ (2 users)│           │
│  └─────────┘ └──────────┘           │
│  ┌─────────┐ ┌──────────┐           │
│  │ Realtime │ │ Storage  │           │
│  │ (sync)   │ │ (photos) │           │
│  └─────────┘ └──────────┘           │
│  ┌─────────┐ ┌──────────┐           │
│  │ Edge Fn  │ │ pg_cron  │           │
│  │ (notifs) │ │ (sched.) │           │
│  └─────────┘ └──────────┘           │
├──────────────────────────────────────┤
│          External APIs               │
│  Aladhan (prayer times) — free       │
│  Web Push API (notifications)        │
└──────────────────────────────────────┘
```

## App Modules

| Module | Route | Purpose |
|---|---|---|
| Home | `/` | Dashboard, greeting, quick actions, daily snapshot |
| Us | `/us` | Relationship: notes, timeline, check-ins, photos |
| Health | `/health` | Fitness, IF, eye care, water, shared view |
| Spirit | `/spirit` | Prayer times, Quran tracker, azkar, du'a |
| Ops | `/ops` | Grocery lists, tasks, watchlists, budget |
| Settings | `/settings` | Profile, notifications, preferences, data |
| Auth | `/(auth)` | Login, register (route group, no nav) |

## Data Flow

- **Read**: Component → Supabase client → Postgres (with RLS) → Component state
- **Write**: Form submit → Zod validate → Supabase client → Postgres → Realtime broadcasts to other user
- **Notifications**: pg_cron triggers Edge Function on schedule → Edge Function queries due notifications → sends via Web Push API
- **Offline**: Service worker caches app shell + recent data. Queues writes for sync when back online.

## State Management

| State Type | Where | Tool |
|---|---|---|
| Server data | Supabase | Direct client queries (no SWR/React Query for V1, keep simple) |
| UI state | Component-level | `useState` / `useReducer` |
| Shared client state | Cross-component | Zustand store |
| Form state | Forms | React Hook Form |
| Auth state | Session | Supabase Auth session |

## Folder Map

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout: fonts, providers, metadata
│   ├── page.tsx            # Home dashboard
│   ├── (auth)/             # Auth route group (no bottom nav)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── us/                 # Relationship module
│   ├── health/             # Health module
│   ├── spirit/             # Spiritual module
│   ├── ops/                # Daily operations module
│   └── settings/           # Settings
├── components/
│   ├── ui/                 # shadcn base (Button, Input, Dialog, etc.)
│   ├── animations/         # Reusable motion wrappers
│   ├── shared/             # App-wide (BottomNav, PageHeader, EmptyState)
│   ├── home/               # Home-specific
│   ├── relationship/       # Us module
│   ├── health/             # Health module
│   ├── spiritual/          # Spirit module
│   └── ops/                # Ops module
├── lib/
│   ├── supabase.ts         # Supabase client singleton
│   ├── theme.ts            # Design tokens as TS constants
│   ├── utils.ts            # cn(), formatDate(), etc.
│   ├── motion.ts           # Animation variants and constants
│   ├── hooks/              # Custom hooks
│   ├── stores/             # Zustand stores
│   ├── i18n/               # Translations
│   │   ├── en.ts
│   │   └── ar.ts
│   └── types/              # Shared types
│       ├── user.types.ts
│       ├── health.types.ts
│       ├── relationship.types.ts
│       ├── spiritual.types.ts
│       └── ops.types.ts
└── __tests__/              # Mirrors src/ structure
```

## Security Model

- **Supabase RLS (Row Level Security)** on every table — users can only read/write their own data or shared data
- **Only 2 users** — auth is email/password, no public registration
- **No API keys in client** — Supabase anon key is safe (RLS protects data)
- **HTTPS everywhere** — Vercel handles SSL
- **No user-generated HTML** — prevent XSS
