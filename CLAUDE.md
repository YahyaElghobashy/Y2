# Y2 — Shared Life Ecosystem

A PWA for two users (Yahya & Yara). Built with Next.js 15, shadcn/ui, Tailwind CSS v4, Framer Motion, Supabase.

## Read Before Every Task

Before writing any code, read the relevant docs:

| What you're doing | Read first |
|---|---|
| Any UI work | `docs/DESIGN_SYSTEM.md` |
| Creating components | `docs/DESIGN_SYSTEM.md` + `docs/COMPONENT_REGISTRY.md` |
| Backend / data | `docs/API_CONTRACTS.md` |
| Any code | `docs/CODING_STANDARDS.md` |
| Understanding the app | `docs/ARCHITECTURE.md` |
| Checking what exists | `docs/COMPONENT_REGISTRY.md` + `docs/TASK_LOG.md` |

## Project Rules

1. **Design tokens only** — never hardcode colors, spacing, or font sizes. Use CSS variables from `lib/theme.ts`
2. **One file per component** — in `components/[module]/ComponentName.tsx`
3. **Use `cn()` utility** — from `lib/utils.ts` for conditional Tailwind classes
4. **All user-facing text** — goes in `lib/i18n/` (support English + Arabic)
5. **Framer Motion for all animation** — follow patterns in DESIGN_SYSTEM.md
6. **shadcn/ui as base** — extend and theme, never replace primitives
7. **One concern per function** — small, readable, composable
8. **Tests beside components** — in `__tests__/` adjacent to the component
9. **Conventional commits** — `feat(scope): description` / `fix(scope): description` / `chore(scope): description`
10. **After creating a component** — update `docs/COMPONENT_REGISTRY.md`
11. **After completing a task** — update `docs/TASK_LOG.md`
12. **Never install packages** without checking if they're already in package.json
13. **Mobile-first** — all layouts start from 375px width and scale up
14. **RTL-ready** — use logical properties (ps, pe, ms, me) not left/right in Tailwind

## Tech Stack Quick Reference

- **Framework**: Next.js 15 (App Router, Server Components default)
- **UI**: shadcn/ui (Radix primitives) + custom themed components
- **Styling**: Tailwind CSS v4 with CSS variables
- **Animation**: Framer Motion + Motion Primitives library
- **State**: Zustand for client state
- **Forms**: React Hook Form + Zod validation
- **Backend**: Supabase (Postgres, Auth, Realtime, Edge Functions, Storage, Cron)
- **PWA**: Serwist (service worker, offline, push notifications)
- **Hosting**: Vercel
- **Testing**: Vitest + React Testing Library
- **Icons**: Lucide React
- **Fonts**: Playfair Display (display), DM Sans (body), JetBrains Mono (mono)

## File Naming

- Components: `PascalCase.tsx` (e.g., `DailyCheckIn.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-prayer-times.ts`)
- Types: `kebab-case.types.ts` (e.g., `health.types.ts`)
- Pages: `page.tsx` inside route folders (Next.js convention)
