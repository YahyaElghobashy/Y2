# Y2 (Hayah) — Project Context

**This file loads with every Claude Code execution. It is the soul of the project. Read it fully before writing a single line of code.**

---

## What This Is

Hayah (حياة — "life" in Arabic) is a shared life ecosystem for two people: Yahya and Yara. It is not a generic couples app. It is not a template. It is a deeply personal digital space that reflects how these two specific humans live, love, play, and take care of each other.

Yahya is a Muslim writer and thinker living in Cairo, Egypt. He describes 2026 as his "Year of Building Gently" — a philosophy of sustainable, intentional progress over aggressive optimization. Yara is his partner, and he plans to propose to her this year. The app is being built as an expression of that intention: a shared space that grows with them.

This project is built entirely by AI agents (Claude Code) orchestrated by a Python script overnight. Yahya designs and plans during the day, the agents build at night, and he reviews in the morning. You — the Claude Code instance reading this — are one of those agents. You are building something that matters to a real person. Build it like it matters.

---

## Who Uses This App

### Yahya (primary builder, User A)
- Late 20s, Cairo-based, Muslim
- Writer, thinker, overthinker. Spirals sometimes. Romantic.
- Disciplines: 5 daily prayers, Quran reading, morning azkar
- Health: active fitness journey (targeting 85kg), managing dry eye condition
- Interests: specialty coffee, anime, D&D, music production (DJ Gargeera), gaming
- Communication style: layered, metaphor-heavy, emotionally precise
- Uses both English and Egyptian Arabic naturally (code-switches)

### Yara (partner, User B)
- Yahya's partner. The app is built for both of them.
- She has her own login, her own view, her own data
- Some features are shared (coupons, CoYYns, notifications)
- Some features are Yahya-only (period tracker — he tracks her cycle to be a better partner, she doesn't see this)
- Her experience should feel just as considered as his — not an afterthought

### What They Do NOT Want
- A clinical productivity app
- A generic "couples tracker" with heart emojis everywhere
- Something that feels like a chore to open
- Gamification that feels patronizing
- Any feature that creates pressure or obligation

### What They DO Want
- A warm, beautiful space that feels like opening a leather journal
- Playful systems (CoYYns, coupons) that make mundane life fun
- Gentle reminders that help them take care of each other
- Privacy from each other where needed (period tracker, surprise coupons)
- Something they'd actually open every day because it's *nice*

---

## The Emotional Architecture

Every screen, every interaction, every animation should serve one of these emotional goals:

1. **Warmth** — The app should feel like coming home. Warm cream backgrounds, copper accents, serif headings that feel like handwritten notes. Never cold, never clinical.

2. **Playfulness** — The CoYYns economy, love coupons, challenges — these are games. They should feel fun, not transactional. A gentle nudge toward joy.

3. **Care** — The period tracker, the notification system, the shared lists — these are tools for paying attention to each other. The app should make it easy to be thoughtful.

4. **Privacy** — Some things are just for you. Yahya's cycle tracker doesn't appear in Yara's app. Surprise coupons stay hidden until revealed. The app respects boundaries within the relationship.

5. **Serenity** — No notification overload. No red badges screaming for attention. No streaks that create guilt. The spiritual module should feel like a quiet room, not a productivity dashboard.

---

## Design Language — "Warm Mineral"

The aesthetic is sophisticated warmth. Think: Claude's interface meets high-end stationery. Premium without pretension. Like the feeling of turning a heavy page in a leather-bound book.

### Key principles:
- **Dominant cream with sharp copper accents** — never evenly distributed color. The accent is rare and intentional.
- **Generous negative space** — let content breathe. When in doubt, add more space.
- **Soft shadows, not borders** — cards float slightly above the surface, they don't sit in boxes.
- **Animations decelerate** — everything eases out. Nothing bounces. Nothing overshoots. Physics, not effects.
- **Typography has character** — Playfair Display for headings gives romantic weight. DM Sans for body stays clean.

### Colors (use these tokens, never hardcode hex):
- Backgrounds: `bg-primary` (#FBF8F4), `bg-secondary` (#F5F0E8), `bg-elevated` (#FFFFFF)
- Text: `text-primary` (#2C2825), `text-secondary` (#8C8279), `text-muted` (#B5ADA4)
- Accent: `accent-primary` (#C4956A copper), `accent-soft` (#E8D5C0)
- Border: `border-subtle` (rgba(44,40,37,0.08))

### Animation rules:
- Page transitions: fade + translateY(8px), 250ms, ease-out
- Hover: scale(1.02), shadow expansion, 150ms
- Press: scale(0.98), 100ms
- Lists: stagger children with 50ms delay
- NEVER: bounce, spring overshoot, parallax, auto-looping, rotation

---

## System Architecture

### Tech Stack
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage, Edge Functions, pg_cron)
- **State:** Zustand (client), React Hook Form + Zod (forms)
- **Hosting:** Vercel (free tier)
- **PWA:** Serwist for service worker, installable on iOS 16.4+

### Module Map
```
/ .............. Home dashboard — greeting, quick actions, widget slots
/us ............ Relationship module — notes, coupons, CoYYns, notification builder
/health ........ Health module — period tracker (Yahya-only), fitness (future)
/spirit ........ Spiritual module — prayer, Quran, azkar (future)
/ops ........... Daily operations — lists, tasks, budgets (future)
/settings ...... Account, preferences, app info
/(auth)/login .. Authentication page
```

### Data Flow
- Supabase handles auth, database, and realtime subscriptions
- Row Level Security (RLS) ensures users only see their own data
- Shared data (coupons, CoYYns, notifications) uses partner_id relationships
- Edge Functions handle push notifications and scheduled tasks
- Service worker enables offline access and background sync

### Security Model
- Two users only (Yahya + Yara), pre-created in Supabase
- Every table has RLS policies — no data leaks between users
- Partner linking via `partner_id` in profiles table
- Period tracker table has strict owner-only RLS (Yahya's eyes only)
- Service role key is server-side only, never exposed to client

---

## Feature Map (What's Being Built)

### Phase 1: App Shell
The skeleton. Every page exists, every transition works, every empty state has personality. No data, no auth — just a beautiful navigable frame.

### Phase 2: Authentication
Supabase Auth with email/password. Persistent sessions. Partner-linked profiles. Middleware protects all routes.

### Phase 3: CoYYns Core
The fake currency system. Both users have wallets. Manual earn/spend with descriptions. Transaction history. This is the economy that powers the marketplace later.

### Phase 4: Push Notifications + Notification Builder
Either person can send the other a push notification. Limited to 2/day. Extra sends cost CoYYns. The notification builder is the first "product" in the CoYYns economy.

### Phase 5: Period Tracker (Yahya-only)
Hormonal pill cycle tracker: 21 days on, 7 days off. Calculates current phase, PMS windows, period days. Sends Yahya reminders to be thoughtful. Yara never sees this.

### Phase 6: Love Coupons
Both users create coupons for each other. Redeemable with approval flow. Photo/code attachments. Full history with timestamps.

### Phase 7: CoYYns Marketplace
Storefront where CoYYns buy real things (extra notifications, future items). Challenges system for earning CoYYns through bets and competitions.

---

## Build System Context

You are one instance in a swarm of Claude Code agents orchestrated by a Python script. Here's how the system works:

1. **Orchestrator** reads tasks from a Google Sheets queue
2. **Builder agent** (you) receives one atomic task with a detailed prompt
3. You build the code, following this context + CLAUDE.md + the task prompt
4. **Auditor agent** reviews your work (runs build, tests, checks design system compliance)
5. If approved → committed to git. If rejected → reverted.
6. Orchestrator moves to the next task.

### What this means for you:
- **Read CLAUDE.md first** — it points to design system, coding standards, component registry
- **Check docs/COMPONENT_REGISTRY.md** — know what already exists before building
- **One task, one focus** — don't build beyond your task scope
- **Make `npm run build` pass** — if it doesn't, the auditor rejects you
- **Write tests** — every component gets a test file
- **Update docs/COMPONENT_REGISTRY.md** — register any new components you build
- **Do NOT commit** — the orchestrator handles git

### File naming conventions:
- Components: PascalCase (`BottomNav.tsx`)
- Hooks: camelCase with `use` prefix (`useCoyyns.ts`)
- Tests: mirror source path in `src/__tests__/`
- Pages: `page.tsx` inside route directories

---

## This Terminal's Role

This Claude Code terminal is part of the Y2 build swarm. You are not having a conversation. You are executing a specific build task with full context. Your job is to:

1. Read CLAUDE.md and referenced docs
2. Read your task prompt carefully
3. Build exactly what's specified, with the quality and care described in this context file
4. Make the build pass
5. Write tests
6. Update the component registry
7. Stop

Build it like it matters. Because it does.
