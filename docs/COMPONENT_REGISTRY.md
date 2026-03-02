# Y2 Component Registry

> This file is updated after every successful build task. Claude Code reads this to know what already exists. Do not create duplicate components.

## Status Legend
- ✅ Built and tested
- 🔨 In progress
- 📋 Planned
- ❌ Failed (needs rebuild)

---

## UI Base (shadcn)

| Component | Status | Path | Notes |
|---|---|---|---|
| Button | 📋 | `components/ui/button.tsx` | Will be installed via shadcn CLI |
| Input | 📋 | `components/ui/input.tsx` | |
| Dialog | 📋 | `components/ui/dialog.tsx` | |
| Card | 📋 | `components/ui/card.tsx` | |
| Toggle | 📋 | `components/ui/toggle.tsx` | |
| Tabs | 📋 | `components/ui/tabs.tsx` | |
| Toast | 📋 | `components/ui/toast.tsx` | |

## Animation Wrappers

| Component | Status | Path | Props |
|---|---|---|---|
| PageTransition | ✅ | `components/animations/PageTransition.tsx` | `children, className?` — Page-level fade+slide wrapper. Fades in (opacity 0→1) with subtle slide up (y 8→0). Duration 250ms, ease-out deceleration. Respects `prefers-reduced-motion`. |
| FadeIn | ✅ | `components/animations/FadeIn.tsx` | `children, delay?, duration?, className?` — Simple opacity fade wrapper. Configurable delay (default 0) and duration (default 0.3s). Respects `prefers-reduced-motion`. |
| StaggerList | ✅ | `components/animations/StaggerList.tsx` | `children, staggerDelay?, className?` — Staggered list entrance. Children appear sequentially with configurable delay (default 0.05s). Each item fades+slides (y 6→0). Returns null for 0 children. Respects `prefers-reduced-motion`. |
| Barrel Export | ✅ | `components/animations/index.ts` | Re-exports PageTransition, FadeIn, StaggerList for clean imports. |
| SlideUp | 📋 | `components/animations/SlideUp.tsx` | `children, delay?` |
| ScaleIn | 📋 | `components/animations/ScaleIn.tsx` | `children, delay?` |

## Shared Components

| Component | Status | Path | Props |
|---|---|---|---|
| BottomNav | ✅ | `components/shared/BottomNav.tsx` | Fixed bottom nav with 5 tabs (Home, Us, Health, Spirit, Ops). Uses `usePathname()` for active state, Framer Motion `layoutId` for sliding copper indicator, `whileTap` for press feedback. iOS safe area aware. |
| PageHeader | ✅ | `components/shared/PageHeader.tsx` | `title, backHref?, rightAction?, className?` — Page identity header with optional back navigation and right action slot. Uses Playfair Display title, ChevronLeft back icon with Framer Motion `whileTap` press feedback. Three-column balanced layout with spacers. |
| LoadingSkeleton | ✅ | `components/shared/LoadingSkeleton.tsx` | `variant: "card" \| "list-item" \| "header" \| "full-page", count?, className?` — Warm-toned skeleton placeholders with CSS `animate-pulse`. Card (120px with icon/title/subtitle shapes), list-item (repeatable rows with avatar/text shapes), header (title+subtitle bars), full-page (header + 3 cards). Server Component, no JS animation. |
| EmptyState | ✅ | `components/shared/EmptyState.tsx` | `icon: ReactNode, title: string, subtitle?: string, actionLabel?: string, actionHref?: string, onAction?: () => void, className?` — Centered empty placeholder with icon, title, optional subtitle, and optional copper CTA button (Link or button). Wrapped in FadeIn for soft entrance. min-h-[300px]. 9 tests passing. |
| AppShell | ✅ | `components/shared/AppShell.tsx` | `children: ReactNode` — Root layout shell wrapping all pages. Warm cream background (`bg-bg-primary`), `min-h-[100dvh]` for mobile viewport, `pb-24` content padding to clear BottomNav. Renders BottomNav fixed at bottom. Integrated into `app/layout.tsx`. 5 tests passing. |
| LoadingPulse | 📋 | `components/shared/LoadingPulse.tsx` | — |
| UserGreeting | 📋 | `components/shared/UserGreeting.tsx` | — |

## Home Module

| Component | Status | Path | Props |
|---|---|---|---|
| QuickActionCard | ✅ | `components/home/QuickActionCard.tsx` | `icon: ReactNode, label: string, description: string, href: string, className?` — Module doorway card for 2×2 home grid. Warm icon circle (40px, accent-soft bg), bold label, truncated description. Framer Motion whileHover scale(1.02) + shadow deepen, whileTap scale(0.98). Wrapped in next/link. 7 tests passing. |

## Relationship Module

| Component | Status | Path | Props |
|---|---|---|---|
| ChallengeCard | ✅ | `components/relationship/ChallengeCard.tsx` | `title: string, stakes: string, status: "pending" \| "active" \| "completed" \| "declined", participants: { name: string, initial: string }[], onAccept?: () => void, onDecline?: () => void, className?` — Challenge card with trophy icon, color-coded status badge (pending/warning, active/info, completed/success, declined/error), overlapping participant initial avatars, and conditional Accept/Decline buttons for pending status. Framer Motion whileHover scale(1.02) + shadow deepen, whileTap scale(0.98). 15 tests passing. |

## Health Module

(none yet)

## Spiritual Module

(none yet)

## Ops Module

(none yet)
