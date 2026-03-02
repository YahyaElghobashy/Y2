# T103: PageTransition + FadeIn + StaggerList — Motion Language

## Files to Create

| File | Purpose |
|---|---|
| `src/components/animations/PageTransition.tsx` | Page-level fade+slide wrapper |
| `src/components/animations/FadeIn.tsx` | Simple opacity fade wrapper |
| `src/components/animations/StaggerList.tsx` | Staggered list entrance wrapper |
| `src/components/animations/index.ts` | Barrel export for clean imports |
| `src/__tests__/components/animations/PageTransition.test.tsx` | Tests for all three components |

## Dependencies on Existing Components

- `framer-motion` (already in package.json) — `motion` component
- `@/lib/utils` — `cn()` utility for className merging
- No other component dependencies — these are leaf-level animation wrappers

## Design Tokens Referenced

- **Easing curve:** `[0.25, 0.1, 0.25, 1]` (ease-out deceleration, from DESIGN_SYSTEM.md)
- **Duration range:** 200-300ms (0.2-0.3s)
- **PageTransition:** duration 0.25s, y offset 8px
- **FadeIn:** duration 0.3s default, configurable
- **StaggerList:** stagger delay 0.05s default, y offset 6px per item

## Implementation Details

### All Components
- `"use client"` directive (Framer Motion requires client)
- Named exports only (no default exports)
- Accept `className` prop, merged via `cn()`
- Respect `prefers-reduced-motion` — set duration to 0 when active

### PageTransition
- `initial={{ opacity: 0, y: 8 }}`
- `animate={{ opacity: 1, y: 0 }}`
- Duration: 0.25s, ease: `[0.25, 0.1, 0.25, 1]`

### FadeIn
- `initial={{ opacity: 0 }}`
- `animate={{ opacity: 1 }}`
- Configurable `delay` (default 0) and `duration` (default 0.3)

### StaggerList
- Parent uses variants pattern with `staggerChildren`
- Each child wrapped in `motion.div` with item variants
- `React.Children.map` to wrap children
- Handles 0 children (renders nothing) and 1 child gracefully

## Test Cases

1. PageTransition renders children correctly
2. FadeIn renders children correctly
3. FadeIn accepts custom delay and duration props
4. StaggerList renders children correctly
5. StaggerList renders nothing with 0 children
6. StaggerList renders single child correctly
7. All three accept and apply className prop
8. Barrel export works (`import { PageTransition, FadeIn, StaggerList }`)

## Testing Approach

- Mock `framer-motion` similar to existing tests in `BottomNav.test.tsx`
- Use `@testing-library/react` for rendering and assertions
- Verify DOM output, not animation internals

## Potential Issues / Edge Cases

- `prefers-reduced-motion` check uses `window.matchMedia` — must guard with `typeof window !== 'undefined'` for SSR
- No exit animations — no `AnimatePresence` at page level (conflicts with Next.js App Router server components)
- StaggerList with dynamically changing children — works naturally since `React.Children.map` re-evaluates on each render
- No spring physics, no bounce, no overshoot — tween with ease-out only
