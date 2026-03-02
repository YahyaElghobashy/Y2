# T307: CoyynsHistory — Build Plan

## Files to Create

1. **`src/components/relationship/CoyynsHistory.tsx`** — Main component
2. **`src/__tests__/components/relationship/CoyynsHistory.test.tsx`** — Tests

## Files to Modify

1. **`docs/COMPONENT_REGISTRY.md`** — Register CoyynsHistory under Relationship Module

## Dependencies (Imports)

| Import | Source | Purpose |
|--------|--------|---------|
| `useCoyyns` | `@/lib/hooks/use-coyyns` (T302) | Fetch transactions when no prop provided |
| `StaggerList` | `@/components/animations` | Staggered entrance animation for rows |
| `EmptyState` | `@/components/shared/EmptyState` | Empty transaction list display |
| `LoadingSkeleton` | `@/components/shared/LoadingSkeleton` | Loading state (list-item variant, count=3) |
| `cn` | `@/lib/utils` | Conditional class merging |
| `CoyynsTransaction` | `@/lib/types/coyyns.types` | Type for transaction rows |
| `TrendingUp`, `TrendingDown`, `Coins` | `lucide-react` | Row direction icons + empty state icon |
| `formatDistanceToNow` | `date-fns` | Relative timestamps ("2 hours ago") |

## Design Tokens Referenced

| Token | Tailwind / CSS | Usage |
|-------|---------------|-------|
| `--text-primary` | `text-[var(--text-primary)]` | Description text |
| `--text-muted` | `text-[var(--text-muted)]` | Category + time subtitle |
| `--success` | `text-[var(--success)]` | Earn amount color (+) |
| `--error` | `text-[var(--error)]` | Spend amount color (−) |
| `--bg-elevated` | `bg-[var(--bg-elevated)]` | Row background |
| `--border-subtle` | `border-[var(--border-subtle)]` | Row separator |
| `--font-body` | `font-[family-name:var(--font-body)]` | Description text |
| `--font-mono` | `font-[family-name:var(--font-mono)]` | Amount display |

### Inline One-off Colors (acceptable per task spec)
- Earn icon bg tint: `rgba(124,182,124,0.10)`
- Spend icon bg tint: `rgba(194,112,112,0.10)`

## Component Architecture

```
CoyynsHistory (props: transactions?, limit, compact, className)
├── Loading state → LoadingSkeleton variant="list-item" count={3}
├── Empty state → EmptyState (Coins icon, "No CoYYns yet", "Acts of care will appear here")
└── List state → <ul> wrapped in StaggerList (staggerDelay=0.04)
    └── <li> × N (sliced by limit)
        ├── Icon container (32×32, rounded-lg, tinted bg)
        │   └── TrendingUp or TrendingDown (16px)
        ├── Text column (flex-1, min-w-0 for truncate)
        │   ├── Description (14px, truncate, text-primary)
        │   └── Category · relative time (12px, text-muted)
        └── Amount (right-aligned, font-mono, semibold, +/−)
```

## Key Implementation Details

1. **Conditional hook call**: Use `useCoyyns()` only when `transactions` prop is undefined. Since hooks can't be called conditionally, always call the hook but only use its data when prop is absent.
   - Actually — we can use a pattern: call useCoyyns always, but use prop data when provided. The hook returns inert state when user is null so it's safe to always call.

2. **CoyynsTransaction.description** is `string | null` per database types — need null fallback (empty string).

3. **CoyynsTransaction.type** is `string` (not literal union) — compare with `=== 'earn'`.

4. **Amount sign**: Use `Math.abs(amount)` with "+" prefix for earn, "−" (U+2212) for spend.

5. **Relative time**: `formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })` → "2 hours ago".

6. **StaggerList**: Wrap `<ul>` role="list" — StaggerList renders a motion.div, so the `<li>` elements are wrapped inside StaggerList's motion.div children. Since StaggerList wraps each child in motion.div, we pass individual row divs (not `<li>`) to StaggerList, and set StaggerList to render as a list container. Actually, StaggerList uses `motion.div` — for semantic correctness, render a `<ul>` with `<li>` children inside StaggerList's wrapper. Each child of StaggerList gets wrapped in motion.div → so `<li>` goes inside that motion.div. This breaks `<ul>` → `<div>` → `<li>` semantics. Workaround: use `role="list"` on StaggerList and `role="listitem"` on each child div, making it semantically valid as an ARIA list.

7. **Compact mode**: `py-2` vs `py-3`, text `text-[13px]` vs `text-[14px]`.

## Test Cases

1. Renders without crashing with empty transactions array
2. Renders EmptyState when transactions array is empty
3. Renders correct number of rows for given transactions
4. Earn rows show TrendingUp icon and "+" prefixed amount with success color
5. Spend rows show TrendingDown icon and "−" prefixed amount with error color
6. Amount uses JetBrains Mono font class
7. Description has `truncate` class
8. Category and relative time render in subtitle
9. `limit` prop caps rendered row count
10. Compact mode applies compact padding/size classes
11. Does not call useCoyyns when transactions prop is provided (verify via mock)

## Potential Issues / Edge Cases

- **SSR**: `formatDistanceToNow` works server-side (pure date math), no window dependency
- **Null description**: Fallback to empty string to avoid rendering "null"
- **Hook always called**: Can't conditionally call hook — always call it, choose data source in render logic
- **StaggerList + list semantics**: Use ARIA roles for accessibility since StaggerList wraps in divs
- **Large amounts**: JetBrains Mono is fixed-width, handles wide numbers naturally; use tabular-nums for alignment
