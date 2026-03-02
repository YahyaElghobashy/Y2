# T304: CoyynsBadge — Build Plan

## Files to Create

1. **`src/components/shared/CoyynsBadge.tsx`** — The component
2. **`src/__tests__/components/shared/CoyynsBadge.test.tsx`** — Tests

## Files to Modify

1. **`docs/COMPONENT_REGISTRY.md`** — Register the new component

## Dependencies (imports)

- `framer-motion` — `motion` for hover animation
- `lucide-react` — `Coins` icon
- `@/lib/utils` — `cn()` for class merging
- `@/lib/hooks/use-coyyns` — `useCoyyns` hook (conditionally called)

## Design Tokens Referenced

| Token | Tailwind Class | Usage |
|---|---|---|
| `--color-accent-soft` (#E8D5C0) | `bg-accent-soft` | Pill background |
| `--color-accent-primary` (#C4956A) | `text-accent-primary` | Coin icon color |
| `--color-text-primary` (#2C2825) | `text-text-primary` | Balance number |
| `--font-mono` (JetBrains Mono) | `font-mono` | Balance number font |

## Component Architecture

The component must conditionally call `useCoyyns()`:
- If `balance !== undefined` → use prop directly, do NOT call hook
- If `balance === undefined` → call `useCoyyns()` to get `{ wallet, isLoading }`

Since React hooks cannot be called conditionally, we'll split into two sub-components:
1. `CoyynsBadge` (exported) — decides whether to render `CoyynsBadgeWithHook` or `CoyynsBadgeDisplay`
2. `CoyynsBadgeDisplay` — pure display component (receives balance, isLoading, size, className)
3. `CoyynsBadgeWithHook` — calls `useCoyyns()` and delegates to `CoyynsBadgeDisplay`

This pattern avoids conditional hook calls while keeping the API clean.

## Size Variants

| Prop | Height | Icon Size | Text Size | Padding |
|---|---|---|---|---|
| `sm` | ~24px | 12px | 11px (text-[11px]) | px-2 py-0.5 |
| `md` (default) | ~28px | 14px | 13px (text-[13px]) | px-3 py-1 |

## Animation

- `motion.div` wrapping the pill
- `whileHover={{ scale: 1.02 }}`
- `transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}`

## Test Cases

1. Renders the coin icon (Lucide `Coins` SVG in DOM)
2. Renders formatted balance when `balance` prop provided
3. Formats with commas (1240 → "1,240")
4. Renders "0" when `balance={0}` (not empty)
5. Does NOT call `useCoyyns()` when `balance` prop provided
6. Calls `useCoyyns()` when no `balance` prop provided
7. Shows loading pulse when hook returns `isLoading: true`
8. Shows "—" fallback when hook returns null/undefined balance after load
9. Applies `sm` size classes
10. Applies `md` size classes (default)
11. Accepts and applies `className` prop

## Edge Cases

- `balance={0}` must not trigger hook (use `!== undefined`, not falsy check)
- Very large numbers handled by `toLocaleString()`
- Loading state shows animated pulse placeholder, not "0" or "undefined"
- Error/null balance after load shows "—" dash

## Potential Issues

- Hook rule: cannot call `useCoyyns()` conditionally — solved by component split pattern
- Tailwind v4 token names: verify `bg-accent-soft`, `text-accent-primary`, `text-text-primary` work in globals.css `@theme inline` block — they are defined as `--color-accent-soft` etc., so Tailwind v4 maps them to `bg-accent-soft`, `text-accent-primary`, `text-text-primary`
