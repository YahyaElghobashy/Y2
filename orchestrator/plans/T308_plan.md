# T308: CoYYns Home Dashboard Wiring — Build Plan

## Files to Create

1. **`src/components/home/CoyynsWidget.tsx`** — New component: compact CoYYns card for home dashboard
2. **`src/__tests__/components/home/CoyynsWidget.test.tsx`** — Tests for CoyynsWidget

## Files to Modify

3. **`src/components/home/HomeGreeting.tsx`** — Remove `name` prop, add `useAuth()` for dynamic name
4. **`src/app/(main)/page.tsx`** — Replace first `<WidgetSlot />` with `<CoyynsWidget />`
5. **`src/__tests__/components/home/HomeGreeting.test.tsx`** — Rewrite tests for auth-based name
6. **`src/__tests__/app/page.test.tsx`** — Update tests: CoyynsWidget instead of 2 WidgetSlots, auth mock
7. **`docs/COMPONENT_REGISTRY.md`** — Add CoyynsWidget entry, update HomeGreeting props

## Dependencies on Existing Components

| Import | From | Purpose |
|---|---|---|
| `useCoyyns` | `@/lib/hooks/use-coyyns` | Wallet + transactions data |
| `useAuth` | `@/lib/providers/AuthProvider` | Profile display_name for greeting |
| `CoyynsBadge` | `@/components/shared/CoyynsBadge` | Balance pill in widget header |
| `LoadingSkeleton` | `@/components/shared/LoadingSkeleton` | List-item variant for loading state |
| `cn` | `@/lib/utils` | Conditional classnames |
| `motion` | `framer-motion` | whileTap press feedback |
| `Link` | `next/link` | Card navigation to /us |

## Design Tokens Referenced

| Token | Tailwind / CSS | Usage |
|---|---|---|
| `--bg-elevated` | `bg-[var(--color-bg-elevated)]` | Card background (#FFFFFF) |
| `--text-primary` | `text-[var(--color-text-primary)]` | Transaction description |
| `--text-secondary` | `text-[var(--color-text-secondary)]` | "CoYYns" label, spend amounts |
| `--text-muted` | `text-[var(--color-text-muted)]` | Empty state text |
| `--accent-primary` | `text-accent-primary` | "See all →" link, earn amounts |
| `--border-subtle` | `border-[var(--color-border-subtle)]` | Divider line |
| `--font-body` | `font-[family-name:var(--font-body)]` | Labels, descriptions |
| `--font-mono` | `font-[family-name:var(--font-mono)]` | Amount numbers |
| `shadow-soft` | `shadow-soft` | Card shadow |
| `rounded-2xl` | `rounded-2xl` | Card radius |

## Implementation Details

### CoyynsWidget
- "use client" component
- Wraps entire card in `next/link` to `/us` with `motion.div` wrapper (`whileTap={{ scale: 0.99 }}`)
- Calls `useCoyyns()` for wallet + transactions
- Passes `wallet?.balance` to CoyynsBadge as prop (avoids double hook call)
- Renders 3-row transaction list DIRECTLY (not reusing CoyynsHistory) — the widget visual spec has no direction icons, no category/time subtitle, just description + amount
- Loading: LoadingSkeleton list-item variant (count=3)
- Empty: "Start earning CoYYns together" centered text
- "See all →" visual label (not a separate link)

### HomeGreeting
- Remove `name` prop, add `useAuth()` import
- Derive name: `profile?.display_name ?? "there"`
- Add `className?` prop
- Keep greeting logic and rendering identical

### page.tsx
- Replace first `<WidgetSlot />` with `<CoyynsWidget />`
- Add import, keep second WidgetSlot

## Test Cases

### CoyynsWidget.test.tsx (12 tests)
1. Renders card container without crashing
2. Renders "CoYYns" label text
3. Renders CoyynsBadge (coin icon in DOM)
4. Renders 3 transaction rows when transactions has 3+ entries
5. Renders fewer rows when transactions has < 3 entries
6. Renders empty state "Start earning CoYYns together" when empty + not loading
7. Renders LoadingSkeleton rows when isLoading
8. Renders "See all →" text
9. Card links to /us
10. Earn transactions show "+" prefix
11. Spend transactions show "-" prefix
12. Amount formatted with commas (1000 → "1,000")

### HomeGreeting.test.tsx (6 tests)
1. Renders greeting with profile.display_name from useAuth() mock
2. Renders "Good morning, there" when profile is null
3. Renders "Good morning, there" when profile.display_name is undefined
4. No longer uses name prop
5. Correct time-aware greeting prefix
6. Correct date format

### page.test.tsx (3 tests)
1. CoyynsWidget renders in first widget position
2. Exactly one WidgetSlot remains
3. Greeting reflects mocked useAuth() profile name

## Edge Cases Handled
- Profile null → "Good morning, there"
- Wallet null → CoyynsBadge falls back to hook (acceptable)
- Empty transactions → "Start earning CoYYns together"
- 1-2 transactions → renders only those, no padding
- Long description → `truncate max-w-[160px]`
- Transaction amount sign: DB stores negative for spend, use `Math.abs()` + type check for prefix
