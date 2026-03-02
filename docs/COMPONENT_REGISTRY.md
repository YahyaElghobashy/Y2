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
| PageTransition | 📋 | `components/animations/PageTransition.tsx` | `children` |
| FadeIn | 📋 | `components/animations/FadeIn.tsx` | `children, delay?, duration?` |
| SlideUp | 📋 | `components/animations/SlideUp.tsx` | `children, delay?` |
| StaggerList | 📋 | `components/animations/StaggerList.tsx` | `children` |
| ScaleIn | 📋 | `components/animations/ScaleIn.tsx` | `children, delay?` |

## Shared Components

| Component | Status | Path | Props |
|---|---|---|---|
| BottomNav | ✅ | `components/shared/BottomNav.tsx` | Fixed bottom nav with 5 tabs (Home, Us, Health, Spirit, Ops). Uses `usePathname()` for active state, Framer Motion `layoutId` for sliding copper indicator, `whileTap` for press feedback. iOS safe area aware. |
| PageHeader | 📋 | `components/shared/PageHeader.tsx` | `title, subtitle?, action?` |
| EmptyState | 📋 | `components/shared/EmptyState.tsx` | `icon, title, description, action?` |
| LoadingPulse | 📋 | `components/shared/LoadingPulse.tsx` | — |
| UserGreeting | 📋 | `components/shared/UserGreeting.tsx` | — |

## Home Module

(none yet)

## Relationship Module

(none yet)

## Health Module

(none yet)

## Spiritual Module

(none yet)

## Ops Module

(none yet)
