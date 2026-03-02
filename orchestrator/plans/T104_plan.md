# T104: LoadingSkeleton — Build Plan

## Files to Create

| File | Purpose |
|---|---|
| `src/components/shared/LoadingSkeleton.tsx` | Main component — 4 variants (card, list-item, header, full-page) |
| `src/__tests__/components/shared/LoadingSkeleton.test.tsx` | Test suite — 7+ test cases |

## Files to Modify

| File | Change |
|---|---|
| `docs/COMPONENT_REGISTRY.md` | Add LoadingSkeleton entry to Shared Components |
| `docs/TASK_LOG.md` | Add T104 completion row |

## Dependencies on Existing Components

- `cn()` from `@/lib/utils` — class merging utility

No other component dependencies. This is a self-contained Server Component with no client-side JS, no Framer Motion, no hooks.

## Design Tokens Referenced

| Token | Tailwind Class | Usage |
|---|---|---|
| `--color-bg-secondary` (#F5F0E8) | `bg-bg-secondary` | Skeleton block backgrounds |
| `--color-bg-primary` (#FBF8F4) | `bg-bg-primary` | Inner detail bars (lighter depth) |

Both tokens are registered in `globals.css` under `@theme inline` as `--color-bg-secondary` and `--color-bg-primary`.

## Animation

- Tailwind `animate-pulse` only (CSS-only, no Framer Motion)
- Gentle opacity oscillation (1.0 → 0.5 → 1.0, 2s cycle)
- No shimmer/gradient sweep

## Component Structure

```
LoadingSkeleton({ variant, count = 3, className })
  ├── variant === "card"      → CardSkeleton
  ├── variant === "list-item" → ListItemSkeleton (renders `count` rows)
  ├── variant === "header"    → HeaderSkeleton
  └── variant === "full-page" → HeaderSkeleton + 3x CardSkeleton
```

Each variant is a simple conditional render inside the main function. Internal helper functions keep it clean.

## Variant Details

### card (120px, full width, rounded-xl)
- Container: `w-full h-[120px] rounded-xl bg-bg-secondary animate-pulse p-4`
- Circle: `w-8 h-8 rounded-full bg-bg-primary/70`
- Title bar: `w-[60%] h-3.5 rounded bg-bg-primary/70 mt-3`
- Subtitle bar: `w-[40%] h-2.5 rounded bg-bg-primary/70 mt-2`

### list-item (count rows, 56px each, gap-3)
- Wrapper: `flex flex-col gap-3`
- Each row: `w-full h-14 rounded-lg bg-bg-secondary animate-pulse flex items-center px-4`
- Left circle: `w-10 h-10 rounded-full bg-bg-primary/70 shrink-0`
- Right content (gap-2):
  - Top bar: `w-[60%] h-3 rounded bg-bg-primary/70`
  - Bottom bar: `w-[40%] h-2.5 rounded bg-bg-primary/70`

### header
- Title bar: `w-1/2 h-7 rounded bg-bg-secondary animate-pulse`
- Subtitle bar: `w-[30%] h-4 rounded bg-bg-secondary animate-pulse mt-2`

### full-page
- Wrapper: `p-6`
- HeaderSkeleton
- 24px gap (`mt-6`)
- 3x CardSkeleton with `gap-4`

## RTL Considerations

- Using percentage widths and flex layout — naturally RTL-compatible
- No left/right positioning — all uses flex/gap which respects direction

## Edge Cases

- `list-item` with `count={0}` → render nothing (return null for the list area)
- `list-item` with `count={1}` → single row
- Narrow screens → percentage widths scale naturally
- No borders on any skeleton element
- Server Component — no `"use client"` directive

## Test Cases

1. `card` variant renders without error
2. `list-item` variant renders correct number of rows (test count=5)
3. `list-item` default count is 3
4. `header` variant renders two bars (title + subtitle)
5. `full-page` variant renders header + cards
6. All variants accept className prop
7. `animate-pulse` class is present on skeleton elements
8. `list-item` with count=0 renders no rows

## Potential Issues

- Tailwind v4 custom color classes (`bg-bg-secondary`, `bg-bg-primary`) — these are registered via `--color-bg-secondary` / `--color-bg-primary` in `@theme inline`, so `bg-bg-secondary` and `bg-bg-primary` should work.
- Opacity modifier on custom colors (`bg-bg-primary/70`) — need to verify Tailwind v4 supports this with CSS variable-based colors. If not, will use a separate opacity utility or inline style. Fallback: use `opacity-70` on inner elements.
