# T303: CoyynsWallet Display — Build Plan

## Files to Create

1. **`src/components/relationship/CoyynsWallet.tsx`** — Main wallet display component
2. **`src/__tests__/components/relationship/CoyynsWallet.test.tsx`** — Test suite

## Files to Modify

1. **`docs/COMPONENT_REGISTRY.md`** — Register new component

## Dependencies (Imports)

| Import | Source | Purpose |
|--------|--------|---------|
| `useCoyyns` | `@/lib/hooks/use-coyyns` | Wallet data (balance, partnerWallet, isLoading, error, refreshWallet) |
| `useAuth` | `@/lib/providers/AuthProvider` | Current user identity to determine partner name |
| `motion, useMotionValue, useTransform, animate` | `framer-motion` | Card entrance animation + balance count-up |
| `cn` | `@/lib/utils` | Conditional class merging |

## Data Shape (from T302)

```ts
CoyynsWallet = {
  id: string
  user_id: string
  balance: number
  lifetime_earned: number
  lifetime_spent: number
  created_at: string
  updated_at: string
}
```

Partner info from `useAuth()`:
- `partner.display_name` — partner's name for the "X has Y CoYYns" row
- `user.id` — matches against wallet.user_id to know which is "mine"

## Design Tokens Referenced

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `--color-bg-elevated` | `bg-bg-elevated` | Card background |
| `--color-accent-primary` | `text-accent-primary` | Balance number, Add btn border/text, Spend btn bg |
| `--color-text-secondary` | `text-text-secondary` | "CoYYns" label, partner row |
| `--color-text-muted` | `text-text-muted` | Stats row labels |
| `--color-border-subtle` | `border-border-subtle` | Divider lines |
| `--color-accent-soft` | `bg-accent-soft/30` | Shimmer placeholder bg |
| `--font-mono` | `font-mono` | Balance number, stat numbers |
| `--font-body` | `font-body` | Labels, descriptions |
| Shadow: soft | `shadow-[0_2px_12px_rgba(44,40,37,0.06)]` | Card shadow |
| Radius: 2xl | `rounded-2xl` | Card border radius (16px) |
| Radius: xl | `rounded-xl` | Button border radius (12px) |

## Component Structure

```
motion.div (card wrapper — fade+slide entrance)
  ├── Loading state (shimmer placeholders when isLoading)
  ├── Error state ("Couldn't load wallet" + Retry)
  └── Loaded state
       ├── Coin icon (28px)
       ├── Animated balance (motion.span with count-up)
       ├── "CoYYns" label (uppercase, tracking-wider)
       ├── Divider
       ├── Stats row (Earned / Spent)
       ├── Partner row ("{Name} has {X} CoYYns")
       ├── Divider
       └── Button row (Add outline / Spend filled)
```

## Animation Details

- **Card entrance**: `initial={{ opacity: 0, y: 8 }}` → `animate={{ opacity: 1, y: 0 }}`, duration 0.35s, easeOut
- **Balance count-up**: Framer Motion `useMotionValue(0)` + `useTransform` for formatting + `animate()` imperative API. Duration 0.6s, easeOut. On mount: 0→current. On change: old→new.
- **No bounce, no spring, no overshoot**

## Test Cases

1. Renders without crashing when `useCoyyns` returns loading state
2. Renders shimmer placeholders during loading (check for `animate-pulse` elements)
3. Renders balance number when data is available
4. Balance is formatted with comma separators (1250 → "1,250")
5. "CoYYns" label is visible below the balance
6. Lifetime Earned value is rendered
7. Lifetime Spent value is rendered
8. Partner's name and balance are rendered in the partner row
9. "Add" button is rendered and calls `onAdd` prop when clicked
10. "Spend" button is rendered and calls `onSpend` prop when clicked
11. Error state renders "Couldn't load wallet" message when `useCoyyns` returns an error
12. Component renders correctly when balance is 0

## Mock Strategy for Tests

- Mock `@/lib/hooks/use-coyyns` — return controlled loading/data/error states
- Mock `@/lib/providers/AuthProvider` — return mock user + partner profile
- Mock `framer-motion` — pass through motion components as divs/spans for DOM testing

## Potential Issues / Edge Cases

- **Framer Motion SSR**: `"use client"` directive handles this
- **useMotionValue in tests**: Motion mocks needed — motion.span renders as span
- **Partner wallet null**: If partner hasn't been set up yet, show dash or 0
- **Balance 0**: Must render "0" not blank
- **Large numbers**: Let card expand naturally, no dynamic font sizing
- **RTL**: Using logical properties (ps/pe/ms/me), no left/right classes
- **No motion.ts file exists**: Animation constants defined inline in component (matching design system values)
